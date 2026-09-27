// Minimal mail.tm client for receiving verification emails for throwaway test accounts.
const M = "https://api.mail.tm";
async function j(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}
export async function newInbox(prefix) {
  const domains = await j(M + "/domains");
  const domain = domains["hydra:member"][0].domain;
  const address = `${prefix}${Date.now().toString(36)}@${domain}`;
  const password = "Mailbox#" + Math.random().toString(36).slice(2, 12);
  await j(M + "/accounts", { method: "POST", body: JSON.stringify({ address, password }) });
  const tok = await j(M + "/token", { method: "POST", body: JSON.stringify({ address, password }) });
  return { address, token: tok.token };
}
export async function waitMail(inbox, match = () => true, timeoutMs = 120000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const list = await j(M + "/messages", { headers: { Authorization: "Bearer " + inbox.token } });
    for (const m of list["hydra:member"] || []) {
      const full = await j(M + "/messages/" + m.id, { headers: { Authorization: "Bearer " + inbox.token } });
      const text = (full.text || "") + "\n" + (Array.isArray(full.html) ? full.html.join("\n") : full.html || "");
      if (match(full.subject, text)) return { subject: full.subject, text };
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return null;
}
