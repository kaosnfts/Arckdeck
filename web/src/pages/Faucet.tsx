import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Toast, useToast } from "../components/Toast";
import { ARC_TESTNET } from "../config/chain";
import { CONTRACTS } from "../config/contracts";
import { connectWallet, switchToArcTestnet } from "../lib/eth";
import { shortAddr } from "../lib/utils";

const LS = {
  autoConnect: "arcdeck:autoConnect",
  faucet: (addr: string) => `arcdeck:faucetLastClaim:${addr.toLowerCase()}`,
};

function fmtNum(n: string, max = 6) {
  const [a, b] = n.split(".");
  if (!b) return a;
  return a + "." + b.slice(0, max);
}

export default function Faucet() {
  const toast = useToast();

  const [address, setAddress] = useState<string>("");
  const [chainOk, setChainOk] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [faucetUSDC, setFaucetUSDC] = useState<string>("0");
  const [lastClaim, setLastClaim] = useState<number>(0);

  async function tryAutoConnect() {
    const eth = (window as any).ethereum;
    if (!eth) return;
    if (localStorage.getItem(LS.autoConnect) !== "1") return;

    try {
      const p = new ethers.BrowserProvider(eth);
      const accounts: string[] = await p.send("eth_accounts", []);
      if (!accounts?.[0]) return;

      const s = await p.getSigner();
      const net = await p.getNetwork();
      setProvider(p);
      setSigner(s);
      setAddress(accounts[0]);
      setChainOk(Number(net.chainId) === ARC_TESTNET.chainId);
    } catch {
      // ignore
    }
  }

  async function onConnect() {
    try {
      const w = await connectWallet();
      setProvider(w.provider);
      setSigner(w.signer);
      setAddress(w.address);
      setChainOk(w.chainId === ARC_TESTNET.chainId);
      localStorage.setItem(LS.autoConnect, "1");
      toast.setMsg("✅ Wallet conectada.");
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    }
  }

  function onDisconnect() {
    setProvider(null);
    setSigner(null);
    setAddress("");
    setChainOk(false);
    localStorage.removeItem(LS.autoConnect);
    toast.setMsg("⛔ Desconectado (sessão local).");
  }

  async function ensureArc() {
    try {
      await switchToArcTestnet();
      toast.setMsg("🔁 Rede adicionada/trocada para Arc Testnet.");
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    }
  }

  async function refreshFaucetBalance() {
    try {
      const r = new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
      const bal = await r.getBalance(CONTRACTS.faucet24h);
      // Arc retorna balance em unidade base (18). Para exibir como USDC (6), normalizamos
      // (equivalente a “cortar 12 zeros” quando a rede expõe valores com 18 casas).
      setFaucetUSDC(fmtNum(ethers.formatUnits(bal, 18), 6));
    } catch {
      // ignore
    }
  }

  async function claimSecondary() {
    if (!signer || !address) return;
    const now = Date.now();
    const last = lastClaim || Number(localStorage.getItem(LS.faucet(address)) || "0");
    const cooldown = 24 * 60 * 60 * 1000;
    if (last && now - last < cooldown) {
      const mins = Math.ceil((cooldown - (now - last)) / 60000);
      toast.setMsg(`⏳ Disponível em ~${mins} min.`);
      return;
    }
    try {
      setBusy("claim");
      const faucetAbi = [{ type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" }] as const;
      const faucet = new ethers.Contract(CONTRACTS.faucet24h, faucetAbi as any, signer);
      const tx = await faucet.claim();
      toast.setMsg("💧 Claim enviado…");
      await tx.wait();

      const t = Date.now();
      localStorage.setItem(LS.faucet(address), String(t));
      setLastClaim(t);
      toast.setMsg("✅ Claim confirmado.");
      await refreshFaucetBalance();
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    tryAutoConnect();
    const eth = (window as any).ethereum;
    if (!eth) return;

    const onAccounts = (a: string[]) => {
      const next = a?.[0] ?? "";
      setAddress(next);
      if (next) setLastClaim(Number(localStorage.getItem(LS.faucet(next)) || "0"));
    };
    const onChain = () => window.location.reload();

    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  useEffect(() => {
    if (!provider || !address) return;
    provider.getNetwork().then((n) => setChainOk(Number(n.chainId) === ARC_TESTNET.chainId)).catch(() => {});
    refreshFaucetBalance();
  }, [provider, address]);

  useEffect(() => {
    refreshFaucetBalance();
  }, []);

  useEffect(() => {
    if (!address) return;
    setLastClaim(Number(localStorage.getItem(LS.faucet(address)) || "0"));
  }, [address]);

  const nextText = useMemo(() => {
    if (!address) return "—";
    const last = lastClaim || Number(localStorage.getItem(LS.faucet(address)) || "0");
    if (!last) return "Disponível agora";
    const cooldown = 24 * 60 * 60 * 1000;
    const left = cooldown - (Date.now() - last);
    if (left <= 0) return "Disponível agora";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `Em ${h}h ${m}m`;
  }, [address, lastClaim]);

  return (
    <div className="space-y-6">
      <Toast msg={toast.msg} />

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">💧 Faucets</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Use a faucet oficial da Circle para gas e, se precisar, a faucet secundária (24h) para testes rápidos.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!address ? (
              <Button onClick={onConnect} variant="primary">🔌 Conectar</Button>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {shortAddr(address)}
                </div>
                <Button onClick={onDisconnect} variant="ghost">⛔ Desconectar</Button>
              </>
            )}
          </div>
        </div>

        {!chainOk ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            Você não está na <span className="font-semibold">{ARC_TESTNET.name}</span>.
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={ensureArc} variant="primary">🔁 Trocar rede</Button>
              <Button as="a" href={ARC_TESTNET.explorer} target="_blank" rel="noreferrer" variant="secondary">🔎 Explorer</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-lg font-extrabold">💧 Circle Faucet (oficial)</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Recomendado para obter gas na Arc Testnet.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button as="a" href={ARC_TESTNET.faucet} target="_blank" rel="noreferrer" variant="primary">
              💧 Abrir Circle Faucet
            </Button>
            <Button as="a" href={ARC_TESTNET.explorer} target="_blank" rel="noreferrer" variant="secondary">
              🔎 Abrir Explorer
            </Button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-xs text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Se o site pedir, selecione a rede/testnet correspondente e faça o claim com sua carteira.
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold">🪄 Faucet secundária (24h)</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Contrato: <span className="font-mono">{shortAddr(CONTRACTS.faucet24h)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              Próximo claim: {nextText}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo da faucet (USDC nativo)</div>
              <div className="mt-1 font-mono text-xl font-extrabold tabular-nums">{faucetUSDC}</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Transparente onchain • atualiza após claim</div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ação</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={claimSecondary} variant="primary" disabled={!chainOk || !address || !!busy}>
                  {busy ? "⌛ Claim…" : "💧 Claim (24h)"}
                </Button>
                <Button onClick={refreshFaucetBalance} variant="secondary" disabled={!!busy}>🔄 Atualizar</Button>
              </div>
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                Limitado a 1 claim a cada 24h por carteira.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
