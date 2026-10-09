// Router: /<function-name>/... -> /home/deno/functions/<function-name>/index.ts
// Each function runs in an isolated worker with the container's env vars.
const NAME_RE = /^[a-z0-9-]+$/;

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // Kong strips /functions/v1, but accept it too.
  if (parts[0] === "functions" && parts[1] === "v1") parts.splice(0, 2);
  const name = parts[0];

  if (!name) return new Response("ok", { status: 200 });
  if (!NAME_RE.test(name) || name === "main" || name.startsWith("_")) {
    return new Response(JSON.stringify({ error: "Function not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const envVars = Object.entries(Deno.env.toObject());
    // deno-lint-ignore no-explicit-any
    const worker = await (globalThis as any).EdgeRuntime.userWorkers.create({
      servicePath: `/home/deno/functions/${name}`,
      memoryLimitMb: 256,
      workerTimeoutMs: 5 * 60 * 1000,
      noModuleCache: false,
      envVars,
      forceCreate: false,
    });
    return await worker.fetch(req);
  } catch (e) {
    console.error(`[router] ${name}:`, e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
