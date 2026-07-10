import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Play, Eraser, Loader2, FlaskConical } from "lucide-react";

type LogEntry = { level: "log" | "info" | "warn" | "error"; time: string; text: string };

const SNIPPETS: Record<string, string> = {
  "auth.getSession": `// Current session
const { data, error } = await supabase.auth.getSession();
console.log("session:", data.session);
if (error) console.error(error);`,

  "auth.getUser": `// Current user (server-validated)
const { data, error } = await supabase.auth.getUser();
console.log("user:", data.user);
if (error) console.error(error);`,

  "auth.signUp (email+password)": `// Sign up new user
const email = "test+" + Date.now() + "@example.com";
const password = "Test@12345";
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { emailRedirectTo: window.location.origin },
});
console.log({ email, password });
console.log("signUp data:", data);
if (error) console.error("signUp error:", error);`,

  "auth.signInWithPassword": `// Sign in with email+password
const email = "you@example.com";
const password = "Test@12345";
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
console.log("signIn data:", data);
if (error) console.error("signIn error:", error);`,

  "auth.signInWithOAuth (google)": `// Google OAuth (opens redirect)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin + "/auth/callback" },
});
console.log("oauth:", data);
if (error) console.error(error);`,

  "auth.resetPasswordForEmail": `// Password reset email
const email = "you@example.com";
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: window.location.origin + "/reset-password",
});
console.log("reset:", data);
if (error) console.error(error);`,

  "auth.updateUser (password)": `// Update password (must be signed in)
const { data, error } = await supabase.auth.updateUser({ password: "NewPass@12345" });
console.log("update:", data);
if (error) console.error(error);`,

  "auth.signOut": `const { error } = await supabase.auth.signOut();
console.log("signed out");
if (error) console.error(error);`,

  "fetch (raw REST)": `// Raw REST call using publishable key
const url = import.meta.env.VITE_SUPABASE_URL + "/rest/v1/settings?select=key,value";
const res = await fetch(url, {
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: "Bearer " + import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
});
console.log("status:", res.status);
console.log(await res.json());`,
};

const DEFAULT_CODE = SNIPPETS["auth.getUser"];

const AdminApiTester = () => {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [snippet, setSnippet] = useState<string>("auth.getUser");
  const editorRef = useRef<any>(null);

  const push = (level: LogEntry["level"], ...args: unknown[]) => {
    const text = args
      .map((a) => {
        if (a instanceof Error) return `${a.name}: ${a.message}`;
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      })
      .join(" ");
    setLogs((l) => [...l, { level, time: new Date().toLocaleTimeString(), text }]);
  };

  const run = async () => {
    setRunning(true);
    setLogs([]);
    const localConsole = {
      log: (...a: unknown[]) => push("log", ...a),
      info: (...a: unknown[]) => push("info", ...a),
      warn: (...a: unknown[]) => push("warn", ...a),
      error: (...a: unknown[]) => push("error", ...a),
    };
    try {
      // Async function wrapper — user code runs with await support.
      const fn = new Function(
        "supabase",
        "console",
        "fetch",
        `"use strict"; return (async () => { ${code}\n })();`
      );
      const result = await fn(supabase, localConsole, window.fetch.bind(window));
      if (result !== undefined) push("info", "→ returned:", result);
    } catch (err: any) {
      push("error", err?.message || String(err));
      if (err?.stack) push("error", err.stack);
    } finally {
      setRunning(false);
    }
  };

  const loadSnippet = (key: string) => {
    setSnippet(key);
    setCode(SNIPPETS[key]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">API Tester (JS Playground)</h1>
          <p className="text-sm text-muted-foreground">
            Run JavaScript against the live Supabase client. Test auth, REST, and edge functions in-browser.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Code</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={snippet} onValueChange={loadSnippet}>
              <SelectTrigger className="w-[260px] h-9">
                <SelectValue placeholder="Load snippet" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(SNIPPETS).map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setLogs([])}>
              <Eraser className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
            <Button size="sm" onClick={run} disabled={running}>
              {running ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
              Run
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Editor
              height="360px"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              onMount={(ed) => (editorRef.current = ed)}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                tabSize: 2,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Available in scope: <code className="font-mono">supabase</code>, <code className="font-mono">console</code>, <code className="font-mono">fetch</code>. Top-level <code>await</code> supported. Runs in your browser as the logged-in user.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" /> Console
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-950 text-zinc-100 rounded-md p-3 font-mono text-xs h-[280px] overflow-auto">
            {logs.length === 0 ? (
              <div className="text-zinc-500">No output yet. Click Run.</div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.level === "error"
                      ? "text-red-400 whitespace-pre-wrap"
                      : l.level === "warn"
                      ? "text-amber-300 whitespace-pre-wrap"
                      : l.level === "info"
                      ? "text-sky-300 whitespace-pre-wrap"
                      : "text-zinc-100 whitespace-pre-wrap"
                  }
                >
                  <span className="text-zinc-500">[{l.time}]</span> {l.text}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApiTester;
