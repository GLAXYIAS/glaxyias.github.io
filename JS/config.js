// Shared API config for Null X (Cloudflare Worker + Turso)
window.NX_API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
window.NX_API_HEADERS = { 'Content-Type': 'application/json' };

async function nxApi(path, options = {}) {
  const opts = { ...options };
  opts.headers = { ...window.NX_API_HEADERS, ...(opts.headers || {}) };
  const res = await fetch(window.NX_API_BASE + path, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.error) || ('HTTP ' + res.status));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
