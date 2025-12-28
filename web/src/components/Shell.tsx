import { Link, NavLink } from "react-router-dom";
import { Button } from "./Button";
import { cn, shortAddr } from "../lib/utils";
import { ARC_TESTNET } from "../config/chain";
import logoMark from "../assets/logo-mark.png";
import logoFull from "../assets/logo-full.png";
import { useEffect, useState } from "react";

const navLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-2xl px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
  );

export function Shell({
  children,
  dark,
  setDark,
}: {
  children: React.ReactNode;
  dark: boolean;
  setDark: (v: boolean) => void;
}) {
  const [addr, setAddr] = useState<string>("");

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((a: string[]) => setAddr(a?.[0] ?? "")).catch(() => {});
    const onAcc = (a: string[]) => setAddr(a?.[0] ?? "");
    eth.on?.("accountsChanged", onAcc);
    return () => eth.removeListener?.("accountsChanged", onAcc);
  }, []);

  return (
    <div className={cn(dark ? "dark" : "", "min-h-screen bg-gradient-to-b from-[#F6F8FF] via-[#F7F8FF] to-[#EEF2FF] text-slate-900 dark:bg-gradient-to-b dark:from-[#050815] dark:via-[#070A14] dark:to-[#050815] dark:text-white")}>
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-400/40 via-fuchsia-400/25 to-cyan-300/25 blur-3xl dark:from-indigo-500/25 dark:via-fuchsia-500/15 dark:to-cyan-400/15" />
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-[#070A14]/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoMark} alt="ArcDeck PixFlow" className="h-10 w-10 rounded-2xl" />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide">ArcDeck</div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">PixFlow</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={navLink}>🏠 Início</NavLink>
            <NavLink to="/app" className={navLink}>🚀 Launch</NavLink>
            <NavLink to="/guia" className={navLink}>🧭 Guia</NavLink>
            <NavLink to="/docs" className={navLink}>📘 Docs</NavLink>
            <a
              href={ARC_TESTNET.faucet}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "rounded-2xl px-3 py-2 text-sm font-semibold transition",
                "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
              )}
            >
              💧 Circle Faucet
            </a>
            <NavLink to="/faucet" className={navLink}>🪄 Faucet</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200 md:block">
              {ARC_TESTNET.name} • {addr ? shortAddr(addr) : "carteira desconectada"}
            </div>

            <Button
              onClick={() => setDark(!dark)}
              aria-label="Alternar tema"
              title="Alternar tema"
              variant="ghost"
            >
              {dark ? "🌙" : "☀️"}
            </Button>

            <div className="flex items-center gap-2 md:hidden">
              <Button as="a" href={ARC_TESTNET.faucet} target="_blank" rel="noreferrer" variant="ghost" title="Circle Faucet">💧</Button>
              <Button as={Link as any} to="/faucet" variant="ghost" title="Faucet secundária">🪄</Button>
              <Button as={Link as any} to="/app" variant="primary">🚀 Launch</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>

      <footer className="border-t border-slate-200/60 dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <img src={logoFull} alt="ArcDeck PixFlow" className="w-[420px] max-w-full h-auto" />
            <div className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">ArcDeck PixFlow</span> é uma demo de fluxo de cobrança com
              <span className="font-semibold"> recibo público verificável onchain</span>, pensada para testes rápidos,
              conciliação por eventos e apresentação técnica.
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              “Pix” é marca registrada do Banco Central do Brasil. Este produto é uma simulação para testnet e não processa pagamentos reais.
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold">Produto</div>
            <div className="mt-3 space-y-2 text-sm">
              <Link className="block text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" to="/docs">📘 Documentação</Link>
              <Link className="block text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" to="/guia">🧭 Guia rápido</Link>
              <Link className="block text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" to="/app">🚀 Launch</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold">Contato</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>Discord: <span className="font-semibold">kaosnft1</span></div>
              <div>Twitter/X: <a href="https://x.com/kAosNFTs" target="_blank" rel="noreferrer" className="font-semibold hover:underline">kAosNFTs</a></div>
</div>
          </div>
        </div>

        <div className="border-t border-slate-200/60 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
  <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
    <div>© {new Date().getFullYear()} ArcDeck PixFlow • Todos os direitos reservados.</div>
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/docs?tab=terms" className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-1 font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">📄 Termos</Link>
      <Link to="/docs?tab=privacy" className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-1 font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">🔒 Privacidade</Link>
    </div>
  </div>
</div>
      </footer>
    </div>
  );
}
