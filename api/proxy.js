import process from "node:process";
import { Buffer } from "node:buffer";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, code, message) => res.status(status).json({
    data: null, message, meta: {}, error: { code, message },
  });
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return fail(405, "METHOD_NOT_ALLOWED", "Unsupported API method.");
  }

  const path = req.query.path;
  if (typeof path !== "string" ||
      !/^(issuer\/|auth\/issuer\/|vc\/academic-transcripts\/)/.test(path) ||
      path.includes("..") || /[%\\?#]/.test(path)) {
    return fail(400, "INVALID_API_PATH", "Invalid issuer API path.");
  }

  let target;
  try {
    const base = (process.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
    target = new URL(`${base}/${path}`);
    if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) {
      throw new Error("Invalid API URL");
    }
  } catch {
    return fail(503, "API_NOT_CONFIGURED", "The issuer API URL is not configured on the server.");
  }
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;
    for (const item of Array.isArray(value) ? value : [value]) target.searchParams.append(key, item);
  }

  const headers = { Accept: "application/json" };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.method === "POST") headers["Content-Type"] = "application/json";

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "POST" && req.body !== undefined
        ? typeof req.body === "string" ? req.body : JSON.stringify(req.body)
        : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(55000),
    });
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    const timeout = error.name === "TimeoutError";
    return fail(timeout ? 504 : 502, timeout ? "API_TIMEOUT" : "API_UNREACHABLE",
      timeout ? "The issuer API timed out." : "Vercel could not reach the issuer API. Check the backend address, port, and AWS network access.");
  }
}
