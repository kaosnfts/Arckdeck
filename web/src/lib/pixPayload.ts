type Payload = {
  v: 1;
  invoiceId: number;
  amountCents: string;
  invoices: string;
  token: string;
  refId?: string;
};

const PREFIX = "ARCDECK:PIXFLOW:";

export function buildPayload(p: Payload) {
  // Formato estável para demo: JSON (v=1) -> base64
  const json = JSON.stringify(p);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `${PREFIX}${b64}`;
}

export function parsePayload(raw: string): Payload {
  const s = raw.trim();
  if (!s.startsWith(PREFIX)) throw new Error("Payload inválido.");
  const b64 = s.slice(PREFIX.length);
  const json = decodeURIComponent(escape(atob(b64)));
  const p = JSON.parse(json);
  if (!p || p.v !== 1) throw new Error("Versão de payload inválida.");
  return p;
}

export function payloadPrefix() {
  return PREFIX;
}
