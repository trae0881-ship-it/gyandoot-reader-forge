import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, X, Send, Loader2, BookOpen, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cached?: boolean;
}

interface AskScriptureProps {
  bookId: string;
  bookTitle: string;
}

const AskScripture = ({ bookId, bookTitle }: AskScriptureProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const askQuestion = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-ask", {
        body: { action: "ask", question: q, book_id: bookId },
      });

      if (error) throw error;

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "यह जानकारी इस पुस्तक में उपलब्ध नहीं है",
        cached: data.cached,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Ask error:", err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "कुछ त्रुटि हुई। कृपया पुनः प्रयास करें।",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        aria-label="Ask Scripture AI"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">पुस्तक से पूछें</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
      style={{ height: "min(520px, calc(100vh - 2rem))" }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
        <BookOpen className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">पुस्तक से पूछें</p>
          <p className="text-xs opacity-80 truncate">{bookTitle}</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-primary-foreground/20 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mb-3 text-primary/40" />
            <p className="text-sm font-medium">Gyandootnova AI</p>
            <p className="text-xs mt-1 max-w-[200px]">इस पुस्तक के बारे में कोई भी प्रश्न पूछें</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                {msg.content}
                {msg.cached && (
                  <span className="block text-[10px] opacity-60 mt-1">⚡ cached</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>⚡ शास्त्रों में खोज रहा हूँ...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="अपना प्रश्न यहाँ लिखें..."
            disabled={loading}
            className="flex-1 rounded-full text-sm"
          />
          <Button
            size="icon"
            onClick={askQuestion}
            disabled={loading || !input.trim()}
            className="rounded-full shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AskScripture;
