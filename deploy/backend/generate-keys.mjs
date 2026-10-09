// Usage: node deploy/backend/generate-keys.mjs
// Prints JWT_SECRET, ANON_KEY and SERVICE_ROLE_KEY for the Railway backend.
import { createHmac, randomBytes } from "node:crypto";

const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const secret = process.env.JWT_SECRET || randomBytes(48).toString("base64url");
const sign = (role) => {
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role, iss: "supabase", iat: now, exp: now + 10 * 365 * 86400 })}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
};

console.log(`JWT_SECRET=${secret}`);
console.log(`ANON_KEY=${sign("anon")}`);
console.log(`SERVICE_ROLE_KEY=${sign("service_role")}`);
