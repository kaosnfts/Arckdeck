export function cn(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

export function shortAddr(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
