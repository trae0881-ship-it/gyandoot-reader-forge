import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple MD5-like hash using Web Crypto
async function hashQuestion(question: string, bookId: string): Promise<string> {
  const data = new TextEncoder().encode(`${question.toLowerCase().trim()}::${bookId}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function normalizeQuestion(q: string): string {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

// Simple XOR encryption/decryption for API keys
function decryptKey(encrypted: string): string {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback";
  try {
    const data = atob(encrypted);
    let result = "";
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
    }
    return result;
  } catch {
    return encrypted;
  }
}

function encryptKey(plain: string): string {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback";
  let result = "";
  for (let i = 0; i < plain.length; i++) {
    result += String.fromCharCode(plain.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return btoa(result);
}

// Chunk book content - get relevant portions
function getRelevantChunks(content: string, question: string, maxChars = 6000): string {
  if (!content || content.length <= maxChars) return content || "";
  
  const paragraphs = content.split(/\n\n+/);
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  // Score each paragraph by keyword relevance
  const scored = paragraphs.map((p, i) => {
    const lower = p.toLowerCase();
    let score = 0;
    for (const word of questionWords) {
      if (lower.includes(word)) score += 1;
    }
    return { text: p, score, index: i };
  });
  
  // Sort by score descending, take top chunks
  scored.sort((a, b) => b.score - a.score);
  
  let result = "";
  for (const chunk of scored) {
    if (result.length + chunk.text.length > maxChars) break;
    result += chunk.text + "\n\n";
  }
  
  return result || content.substring(0, maxChars);
}

// Call AI provider dynamically
async function callAI(provider: string, apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  let url = "";
  let headers: Record<string, string> = {};
  let body: unknown;

  if (provider === "openai" || provider === "deepseek" || provider === "perplexity" || provider === "kimi") {
    const baseUrls: Record<string, string> = {
      openai: "https://api.openai.com/v1/chat/completions",
      deepseek: "https://api.deepseek.com/v1/chat/completions",
      perplexity: "https://api.perplexity.ai/chat/completions",
      kimi: "https://api.moonshot.cn/v1/chat/completions",
    };
    url = baseUrls[provider];
    headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
    body = { model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], temperature: 0.3, max_tokens: 1000 };
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
    body = { contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1000 } };
  } else if (provider === "claude") {
    url = "https://api.anthropic.com/v1/messages";
    headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
    body = { model, system: systemPrompt, messages: [{ role: "user", content: userMessage }], max_tokens: 1000, temperature: 0.3 };
  } else if (provider === "lovable") {
    // Use Lovable AI Gateway
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers = { "Authorization": `Bearer ${lovableKey}`, "Content-Type": "application/json" };
    body = { model: model || "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], temperature: 0.3, max_tokens: 1000 };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  // Parse response based on provider
  if (provider === "gemini") {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } else if (provider === "claude") {
    return data.content?.[0]?.text || "No response";
  } else {
    return data.choices?.[0]?.message?.content || "No response";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, question, book_id, provider_name, api_key, model_name } = await req.json();

    // ── Admin: Verify & Save API Key ──
    if (action === "verify-key") {
      try {
        // Test the key with a simple call
        const testResponse = await callAI(
          provider_name, api_key, model_name,
          "You are a test assistant.", "Say 'OK' in one word."
        );
        if (!testResponse) throw new Error("Empty response from AI");

        const encrypted = encryptKey(api_key);

        // Deactivate other providers, then upsert
        await supabase.from("ai_settings").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");

        const { error } = await supabase.from("ai_settings").upsert({
          provider_name,
          api_key_encrypted: encrypted,
          model_name,
          is_active: true,
        }, { onConflict: "provider_name" });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "API key verified and saved" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Admin: Save Lovable AI as provider (no key needed) ──
    if (action === "set-lovable") {
      await supabase.from("ai_settings").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
      
      const { error } = await supabase.from("ai_settings").upsert({
        provider_name: "lovable",
        api_key_encrypted: "builtin",
        model_name: model_name || "google/gemini-2.5-flash",
        is_active: true,
      }, { onConflict: "provider_name" });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Lovable AI activated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Ask Question ──
    if (action === "ask") {
      if (!question) {
        return new Response(JSON.stringify({ error: "question is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isGeneralQuery = !book_id || book_id === "general";
      const effectiveBookId = isGeneralQuery ? "00000000-0000-0000-0000-000000000000" : book_id;

      const normalized = normalizeQuestion(question);
      const qHash = await hashQuestion(normalized, effectiveBookId);

      // 1. Check cache
      const { data: cached } = await supabase
        .from("ai_cache")
        .select("response")
        .eq("question_hash", qHash)
        .eq("book_id", effectiveBookId)
        .maybeSingle();

      if (cached) {
        await supabase.from("ai_logs").insert({
          user_question: question,
          ai_response: cached.response,
          book_id: isGeneralQuery ? null : effectiveBookId,
          status: "cached",
          cached: true,
        });
        return new Response(JSON.stringify({ answer: cached.response, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Get active AI provider
      const { data: settings } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      const provider = settings?.provider_name || "lovable";
      const model = settings?.model_name || "google/gemini-2.5-flash";
      const apiKey = settings?.provider_name === "lovable" || !settings
        ? Deno.env.get("LOVABLE_API_KEY")!
        : decryptKey(settings.api_key_encrypted);

      let systemPrompt: string;
      let bookTitle = "";

      if (isGeneralQuery) {
        // ── General Hindu Dharma Mode ──
        systemPrompt = `You are Gyandootnova AI — a respectful and knowledgeable assistant specializing EXCLUSIVELY in Hindu Dharma (सनातन धर्म).

STRICT RULES:
- Answer ONLY questions related to Hindu religion, scriptures, philosophy, rituals, festivals, deities, mantras, shlokas, and spiritual practices
- You may reference Vedas, Upanishads, Bhagavad Gita, Ramayana, Mahabharata, Puranas, and other Hindu texts
- Do NOT answer questions about other religions, political topics, controversial subjects, or anything unrelated to Hindu Dharma
- Do NOT compare religions or make any negative comments about any religion or belief system
- If the question is NOT related to Hindu Dharma, reply EXACTLY: "यह प्रश्न हिंदू धर्म से संबंधित नहीं है। कृपया सनातन धर्म से जुड़ा प्रश्न पूछें।"
- Answer in simple Hindi (use Devanagari script) unless the user writes in English
- Keep answers concise, respectful, and spiritually uplifting
- Naturally mention "Gyandootnova" as the source platform when appropriate
- Include relevant shloka or reference when possible
- Maintain scholarly yet accessible tone`;
      } else {
        // ── Book-specific Mode ──
        const { data: book } = await supabase
          .from("books")
          .select("id, title, description")
          .eq("id", book_id)
          .single();

        if (!book) {
          return new Response(JSON.stringify({ error: "Book not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        bookTitle = book.title;

        const { data: chapters } = await supabase
          .from("book_chapters")
          .select("title, content")
          .eq("book_id", book_id)
          .order("chapter_number");

        const fullContent = chapters?.map(c => `${c.title}\n${c.content || ""}`).join("\n\n") || book.description || "";
        const relevantContent = getRelevantChunks(fullContent, normalized);

        systemPrompt = `You are Gyandootnova AI — a scripture assistant for the book "${book.title}".

STRICT RULES:
- Answer ONLY from the provided CONTEXT below
- Do NOT use external knowledge
- This question belongs ONLY to the book "${book.title}"
- Do NOT mix information from other books
- If the answer is not found in the context OR the question is unrelated to this book, reply EXACTLY: "यह जानकारी इस पुस्तक में उपलब्ध नहीं है"
- Do NOT answer questions about other religions or anything that could harm the brand
- Maintain a respectful, scholarly tone
- Answer in Hindi unless the user asks in English
- Keep answers concise but complete
- Naturally reference the book title "${book.title}" in your answer

CONTEXT from "${book.title}":
${relevantContent}`;
      }

      // 5. Call AI
      let answer: string;
      try {
        if (provider === "lovable") {
          const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${lovableKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }],
              temperature: 0.3,
              max_tokens: 1000,
            }),
          });
          const data = await res.json();
          answer = data.choices?.[0]?.message?.content || "यह जानकारी उपलब्ध नहीं है";
        } else {
          answer = await callAI(provider, apiKey, model, systemPrompt, question);
        }
      } catch (aiErr) {
        console.error("AI call failed:", aiErr);
        answer = "यह जानकारी उपलब्ध नहीं है";
      }

      // 6. Cache (skip for general queries with nil UUID)
      if (!isGeneralQuery) {
        await supabase.from("ai_cache").upsert({
          question_hash: qHash,
          book_id: effectiveBookId,
          question: normalized,
          response: answer,
        }, { onConflict: "question_hash,book_id" }).then(() => {});
      }

      // 7. Log
      await supabase.from("ai_logs").insert({
        user_question: question,
        ai_response: answer,
        book_id: isGeneralQuery ? null : effectiveBookId,
        book_title: isGeneralQuery ? "General Hindu Dharma" : bookTitle,
        status: "success",
        provider_name: provider,
        cached: false,
      });

      return new Response(JSON.stringify({ answer, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get Logs (Admin) ──
    if (action === "get-logs") {
      const { data: logs } = await supabase
        .from("ai_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      return new Response(JSON.stringify({ logs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get Settings (Admin) ──
    if (action === "get-settings") {
      const { data: settings } = await supabase
        .from("ai_settings")
        .select("id, provider_name, model_name, is_active, created_at, updated_at")
        .order("created_at");

      return new Response(JSON.stringify({ settings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Ask error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
