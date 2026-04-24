// Vercel Node.js function — bridges TanStack Start's Fetch-API server to Vercel's req/res model.
// All requests that aren't matched to static files in dist/client/ are routed here.

let _server;
async function getServer() {
  if (!_server) {
    const mod = await import("../dist/server/server.js");
    _server = mod.default;
  }
  return _server;
}

export default async function handler(req, res) {
  const server = await getServer();

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.url, `${proto}://${host}`);

  const bodyInit =
    req.method !== "GET" && req.method !== "HEAD" ? req : null;

  const request = new Request(url.toString(), {
    method: req.method || "GET",
    headers: req.headers,
    body: bodyInit,
    ...(bodyInit ? { duplex: "half" } : {}),
  });

  const response = await server.fetch(request);

  res.status(response.status);
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() !== "transfer-encoding") {
      res.setHeader(key, value);
    }
  }

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  const flush = async () => {
    const { done, value } = await reader.read();
    if (done) {
      res.end();
      return;
    }
    res.write(value);
    return flush();
  };
  await flush();
}
