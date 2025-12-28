import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Label, Textarea } from "../components/Field";
import { Toast, useToast } from "../components/Toast";
import { ARC_TESTNET } from "../config/chain";
import { CONTRACTS } from "../config/contracts";
import { ArcDeckBRLAbi } from "../abi/ArcDeckBRL";
import { ArcDeckInvoicesAbi } from "../abi/ArcDeckInvoices";
import {
  connectWallet,
  formatBRLFromCents,
  parseCentsFromBRL,
  randomBytes32,
  switchToArcTestnet,
} from "../lib/eth";
import { buildPayload } from "../lib/pixPayload";
import { shortAddr } from "../lib/utils";

type InvoiceStatus = "PENDING" | "PAID" | "CANCELLED";

type LocalInvoice = {
  id: string; // uint256
  merchant: string;
  token: string;
  amountCents: string; // bigint as string
  dueAt: number; // unix seconds (0 = none)
  refId: string; // bytes32
  status: InvoiceStatus;
  createdAt: number; // ms
  paidAt?: number; // ms
  cancelledAt?: number; // ms
  createTx?: string;
  payTx?: string;
  cancelTx?: string;
  hidden?: boolean;
  splits?: { to: string; bps: number }[];
};

type SplitRow = { to: string; bps: string };

const LS = {
  autoConnect: "arcdeck:autoConnect",
  invoices: (addr: string) => `arcdeck:invoices:${addr.toLowerCase()}`,
  faucet: (addr: string) => `arcdeck:faucetLastClaim:${addr.toLowerCase()}`,
};

function clampText(s: string, max = 14) {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(6, max - 3)) + "…" + s.slice(-4);
}

function txUrl(hash: string) {
  if (!hash) return "";
  // ARC_TESTNET usa a chave `explorer` (base URL do explorer)
  return `${ARC_TESTNET.explorer}/tx/${hash}`;
}

function fmtNum(n: string, max = 6) {
  const [a, b] = n.split(".");
  if (!b) return a;
  return a + "." + b.slice(0, max);
}

function statusFromNumber(n: number): InvoiceStatus {
  return n === 2 ? "PAID" : n === 3 ? "CANCELLED" : "PENDING";
}

function loadInvoices(addr: string): LocalInvoice[] {
  try {
    const raw = localStorage.getItem(LS.invoices(addr));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalInvoice[];
  } catch {
    return [];
  }
}

function saveInvoices(addr: string, list: LocalInvoice[]) {
  localStorage.setItem(LS.invoices(addr), JSON.stringify(list));
}

function upsertInvoice(addr: string, inv: LocalInvoice) {
  const list = loadInvoices(addr);
  const idx = list.findIndex((x) => x.id === inv.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...inv };
  else list.unshift(inv);
  saveInvoices(addr, list);
  return list;
}

function setHidden(addr: string, id: string, hidden: boolean) {
  const list = loadInvoices(addr).map((x) => (x.id === id ? { ...x, hidden } : x));
  saveInvoices(addr, list);
  return list;
}


function hideAllPending(addr: string) {
  const list = loadInvoices(addr).map((x) => (x.status === "PENDING" ? { ...x, hidden: true } : x));
  saveInvoices(addr, list);
  return list;
}


export default function AppDashboard() {
  const toast = useToast();

  const [address, setAddress] = useState<string>("");
  const [chainOk, setChainOk] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const [gasUSDC, setGasUSDC] = useState<string>("0");
  const [brlBal, setBrlBal] = useState<string>("0");
  const [allowance, setAllowance] = useState<string>("0");

  const [createAmount, setCreateAmount] = useState<string>("10,00");
  const [createDueMins, setCreateDueMins] = useState<string>("0");
  const [createNote, setCreateNote] = useState<string>("");
  const [createRefId, setCreateRefId] = useState<string>(randomBytes32());

  const [splits, setSplits] = useState<SplitRow[]>([]);

  const [verifyId, setVerifyId] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<LocalInvoice | null>(null);

  const [tab, setTab] = useState<InvoiceStatus>("PENDING");
  const [invoices, setInvoices] = useState<LocalInvoice[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [qrInvoice, setQrInvoice] = useState<LocalInvoice | null>(null);
  const [qrPayload, setQrPayload] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const [faucetLastClaim, setFaucetLastClaim] = useState<number>(0);

  const totals = useMemo(() => {
    const visible = invoices.filter((x) => !x.hidden);
    const totCreated = visible.reduce((a, x) => a + BigInt(x.amountCents), 0n);
    const totPaid = visible.filter((x) => x.status === "PAID").reduce((a, x) => a + BigInt(x.amountCents), 0n);
    return { totCreated, totPaid };
  }, [invoices]);

  const splitSummary = useMemo(() => {
    const rows = splits
      .map((r) => ({ to: r.to.trim(), bps: Number(String(r.bps).replace(/[^0-9]/g, "")) }))
      .filter((r) => r.to && r.bps > 0);
    const sum = rows.reduce((a, r) => a + r.bps, 0);
    return { rows, sum };
  }, [splits]);

  function myInvoicesKey() {
    return address ? LS.invoices(address) : "";
  }

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
    setInvoices([]);
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

  async function refreshBalances() {
    if (!provider || !address) return;
    try {
      const bal = await provider.getBalance(address);
      setGasUSDC(fmtNum(ethers.formatUnits(bal, ARC_TESTNET.nativeCurrencyDecimals), 6));

      const brl = new ethers.Contract(CONTRACTS.aBRL, ArcDeckBRLAbi, provider);
      const brlRaw: bigint = await brl.balanceOf(address);
      setBrlBal(fmtNum(ethers.formatUnits(brlRaw, 2), 2));

      const all: bigint = await brl.allowance(address, CONTRACTS.invoices);
      setAllowance(fmtNum(ethers.formatUnits(all, 2), 2));
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    }
  }

  async function mintABRL() {
    if (!signer || !address) return;
    try {
      setBusy("Mint aBRL");
      const brl = new ethers.Contract(CONTRACTS.aBRL, ArcDeckBRLAbi, signer);
      // mint padrão: 1.000,00 BRL -> 100000 cents
      const tx = await brl.faucetMint(100000n);
      toast.setMsg("🪙 Mint enviado…");
      await tx.wait();
      toast.setMsg("✅ aBRL mintado.");
      await refreshBalances();
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function approveABRL() {
    if (!signer || !address) return;
    try {
      setBusy("Approve");
      const brl = new ethers.Contract(CONTRACTS.aBRL, ArcDeckBRLAbi, signer);
      const tx = await brl.approve(CONTRACTS.invoices, ethers.MaxUint256);
      toast.setMsg("✅ Approve enviado…");
      await tx.wait();
      toast.setMsg("✅ Approve confirmado.");
      await refreshBalances();
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function faucetClaim() {
    if (!signer || !address) return;
    const now = Date.now();
    const last = faucetLastClaim || Number(localStorage.getItem(LS.faucet(address)) || "0");
    const cooldown = 24 * 60 * 60 * 1000;
    if (last && now - last < cooldown) {
      const mins = Math.ceil((cooldown - (now - last)) / 60000);
      toast.setMsg(`⏳ Faucet disponível em ~${mins} min.`);
      return;
    }
    try {
      setBusy("Faucet");
      const faucetAbi = [{ type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" }] as const;
      const faucet = new ethers.Contract(CONTRACTS.faucet24h, faucetAbi as any, signer);
      const tx = await faucet.claim();
      toast.setMsg("💧 Claim enviado…");
      await tx.wait();
      const t = Date.now();
      localStorage.setItem(LS.faucet(address), String(t));
      setFaucetLastClaim(t);
      toast.setMsg("✅ Faucet claim confirmado.");
      await refreshBalances();
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function openQrFor(inv: LocalInvoice) {
    try {
      setQrInvoice(inv);
      const payload = buildPayload({
        v: 1,
        invoiceId: Number(inv.id),
        amountCents: inv.amountCents,
        invoices: CONTRACTS.invoices,
        token: inv.token,
        refId: inv.refId,
      });
      setQrPayload(payload);

      const QRCode = await import("qrcode");
      const url = await QRCode.toDataURL(payload, { margin: 1, width: 360 });
      setQrDataUrl(url);
      setQrOpen(true);
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    }
  }

  function closeQr() {
    setQrOpen(false);
    setQrInvoice(null);
    setQrPayload("");
    setQrDataUrl("");
  }

  async function createInvoice() {
    if (!signer || !address) return;
    try {
      setBusy("Criar");
      const amount = parseCentsFromBRL(createAmount);
      const dueMins = Number(createDueMins || "0");
      const dueAt = dueMins > 0 ? Math.floor(Date.now() / 1000) + dueMins * 60 : 0;

      const invoicesC = new ethers.Contract(CONTRACTS.invoices, ArcDeckInvoicesAbi, signer);
      const recipients: string[] = [];
      const bps: number[] = [];

      if (splitSummary.rows.length) {
        if (splitSummary.sum > 10000) {
          toast.setMsg("⚠️ Soma dos splits excede 10.000 bps (100%).");
          return;
        }
        for (const r of splitSummary.rows) {
          if (!ethers.isAddress(r.to)) {
            toast.setMsg(`⚠️ Endereço inválido em splits: ${r.to}`);
            return;
          }
          if (!Number.isFinite(r.bps) || r.bps <= 0 || r.bps > 10000) {
            toast.setMsg("⚠️ BPS inválido (1..10000).");
            return;
          }
          recipients.push(r.to);
          bps.push(r.bps);
        }
      }

      const tx = await invoicesC.createInvoice(CONTRACTS.aBRL, amount, dueAt, createRefId, recipients, bps);
      toast.setMsg("🧾 Cobrança enviada…");
      const rc = await tx.wait();

      // Parse InvoiceCreated
      const iface = new ethers.Interface(ArcDeckInvoicesAbi);
      let id: string | null = null;
      // `CONTRACTS` é `as const`, então tipamos explicitamente como string para permitir atribuições vindas do evento
      let token: string = CONTRACTS.aBRL;
      let refId = createRefId;
      for (const log of rc.logs) {
        if ((log as any).address?.toLowerCase?.() !== CONTRACTS.invoices.toLowerCase()) continue;
        try {
          const parsed = iface.parseLog(log as any);
          if (parsed?.name === "InvoiceCreated") {
            id = (parsed.args.invoiceId as bigint).toString();
            token = (parsed.args.token as string);
            refId = (parsed.args.refId as string);
            break;
          }
        } catch {}
      }
      if (!id) {
        // fallback: assume sequential
        const next = await invoicesC.nextInvoiceId();
        id = String(BigInt(next) - 1n);
      }

      const inv: LocalInvoice = {
        id,
        merchant: address,
        token,
        amountCents: amount.toString(),
        dueAt,
        refId,
        status: "PENDING",
        createdAt: Date.now(),
        createTx: tx.hash,
        splits: splitSummary.rows.length ? splitSummary.rows.map((r) => ({ to: r.to, bps: r.bps })) : undefined,
      };
      const list = upsertInvoice(address, inv);
      setInvoices(list);
      toast.setMsg(`✅ Cobrança criada (#${id}).`);

      // reset ref/note for next
      setCreateNote("");
      setCreateRefId(randomBytes32());
      setSplits([]);

      await refreshBalances();
      await openQrFor(inv);
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function syncStatuses() {
    if (!provider || !address) return;
    try {
      setBusy("Sincronizar");
      const invoicesC = new ethers.Contract(CONTRACTS.invoices, ArcDeckInvoicesAbi, provider);
      const list = loadInvoices(address);

      const updated: LocalInvoice[] = [];
      for (const inv of list) {
        try {
          const tuple = await invoicesC.getInvoice(inv.id);
          // (merchant, token, amount, dueAt, refId, status, createdAt, paidAt, pixTxId)
          const statusN = Number(tuple[5]);
          const status: InvoiceStatus = statusFromNumber(statusN);

          updated.push({
            ...inv,
            status,
            dueAt: Number(tuple[3]),
            // keep local createdAt; onchain createdAt is tuple[6]
            paidAt: status === "PAID" && tuple[7] ? Number(tuple[7]) * 1000 : inv.paidAt,
          });
        } catch {
          updated.push(inv);
        }
      }
      saveInvoices(address, updated);
      setInvoices(updated);
      toast.setMsg("🔄 Status atualizado.");
      await refreshBalances();
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function verifyInvoice() {
    const raw = (verifyId || "").trim().replace(/^#/, "");
    if (!raw) {
      toast.setMsg("⚠️ Informe um invoiceId. Ex: #3");
      return;
    }
    if (!/^[0-9]+$/.test(raw)) {
      toast.setMsg("⚠️ invoiceId deve ser um número. Ex: 3");
      return;
    }

    try {
      setBusy("Verificar");
      const readP: any = provider ?? new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
      const invoicesC = new ethers.Contract(CONTRACTS.invoices, ArcDeckInvoicesAbi, readP);
      const tuple = await invoicesC.getInvoice(raw);
      const status = statusFromNumber(Number(tuple[5]));
      const inv: LocalInvoice = {
        id: raw,
        merchant: tuple[0] as string,
        token: tuple[1] as string,
        amountCents: (tuple[2] as bigint).toString(),
        dueAt: Number(tuple[3] as bigint),
        refId: tuple[4] as string,
        status,
        createdAt: Number(tuple[6] as bigint) * 1000,
        paidAt: status === "PAID" && tuple[7] ? Number(tuple[7] as bigint) * 1000 : undefined,
      };
      setVerifyResult(inv);
      toast.setMsg(`✅ Recibo encontrado (#${raw}).`);
    } catch (e: any) {
      setVerifyResult(null);
      toast.setMsg(e?.shortMessage ?? e?.message ?? "Falha ao consultar invoice.");
    } finally {
      setBusy(null);
    }
  }

  async function pay(inv: LocalInvoice) {
    if (!signer || !address) return;
    try {
      setBusy("Pagar");
      const invoicesC = new ethers.Contract(CONTRACTS.invoices, ArcDeckInvoicesAbi, signer);
      const tx = await invoicesC.paySandbox(inv.id, randomBytes32());
      toast.setMsg("💳 Pagamento enviado…");
      await tx.wait();
      const upd = { ...inv, status: "PAID" as const, payTx: tx.hash, paidAt: Date.now() };
      const list = upsertInvoice(address, upd);
      setInvoices(list);
      toast.setMsg("✅ Pago.");
      await refreshBalances();
    } catch (e: any) {
      toast.setMsg(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function cancel(inv: LocalInvoice) {
    if (!signer || !address) return;
    try {
      setBusy("Cancelar");
      const invoicesC = new ethers.Contract(CONTRACTS.invoices, ArcDeckInvoicesAbi, signer);
      const tx = await invoicesC.cancelInvoice(inv.id);
      toast.setMsg("🛑 Cancelamento enviado…");
      await tx.wait();
      const upd = { ...inv, status: "CANCELLED" as const, cancelTx: tx.hash, cancelledAt: Date.now() };
      const list = upsertInvoice(address, upd);
      setInvoices(list);
      toast.setMsg("🛑 Cancelado.");
      await refreshBalances();
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
      if (!next) {
        setInvoices([]);
        return;
      }
      setInvoices(loadInvoices(next));
      setFaucetLastClaim(Number(localStorage.getItem(LS.faucet(next)) || "0"));
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
    if (!address) return;
    setInvoices(loadInvoices(address));
    setFaucetLastClaim(Number(localStorage.getItem(LS.faucet(address)) || "0"));
  }, [myInvoicesKey()]);

  useEffect(() => {
    if (!provider || !address) return;
    provider.getNetwork().then((n) => setChainOk(Number(n.chainId) === ARC_TESTNET.chainId)).catch(() => {});
    refreshBalances();
  }, [provider, address]);

  const filtered = useMemo(() => {
    return invoices.filter((x) => !x.hidden).filter((x) => x.status === tab);
  }, [invoices, tab]);

  const faucetNextText = useMemo(() => {
    if (!address) return "—";
    const last = faucetLastClaim || Number(localStorage.getItem(LS.faucet(address)) || "0");
    if (!last) return "Disponível agora";
    const cooldown = 24 * 60 * 60 * 1000;
    const left = cooldown - (Date.now() - last);
    if (left <= 0) return "Disponível agora";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `Em ${h}h ${m}m`;
  }, [address, faucetLastClaim]);

  return (
    <div className="space-y-6">
      <Toast msg={toast.msg} />

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">🚀 Launch</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Cobrança usando Pix (simulado) com recibo verificável onchain — crie, pague, liste e compartilhe o recibo.
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
              <Button onClick={() => window.open(ARC_TESTNET.explorer, "_blank")} variant="secondary">🔎 Explorer</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">🪙 Saldo aBRL</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Atual: <span className="font-mono font-extrabold tabular-nums">{brlBal}</span>{" "}
              <span className="font-semibold">aBRL</span> <span className="text-slate-500 dark:text-slate-400">(decimals=2)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={syncStatuses} variant="secondary" disabled={!chainOk || !address || !!busy}>🔄 Atualizar</Button>
            <Button onClick={mintABRL} variant="secondary" disabled={!chainOk || !address || !!busy}>🪙 Mint aBRL</Button>
            <Button onClick={approveABRL} variant="primary" disabled={!chainOk || !address || !!busy}>✅ Approve</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total cobrado (local)</div>
            <div className="mt-1 text-xl font-extrabold">{ethers.formatUnits(totals.totCreated, 2)} aBRL</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Somatório das cobranças criadas neste navegador.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total pago (local)</div>
            <div className="mt-1 text-xl font-extrabold">{ethers.formatUnits(totals.totPaid, 2)} aBRL</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Após sincronizar, o status vem do onchain.
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-xs text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">Contratos:</span>{" "}
              aBRL <span className="font-mono">{shortAddr(CONTRACTS.aBRL)}</span> •
              Invoices <span className="font-mono">{shortAddr(CONTRACTS.invoices)}</span>
            </div>
            <div className="font-semibold">Rede: {ARC_TESTNET.name}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-lg font-extrabold">🧾 Criar cobrança</div>

          <div className="mt-4 space-y-3">
            <div>
              <Label>Valor (BRL)</Label>
              <Input value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} placeholder="10,00" />
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">aBRL usa centavos (decimals=2).</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Vencimento (min)</Label>
                <Input value={createDueMins} onChange={(e) => setCreateDueMins(e.target.value)} placeholder="0" />
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">0 = sem vencimento</div>
              </div>

              <div>
                <Label>RefId (bytes32)</Label>
                <Input value={createRefId} onChange={(e) => setCreateRefId(e.target.value as any)} />
              </div>
            </div>

            <div>
              <Label>Nota (opcional)</Label>
              <Textarea value={createNote} onChange={(e) => setCreateNote(e.target.value)} rows={3} placeholder="Ex: Assinatura mensal, pedido #123…" />
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">A nota é local (UX). A conciliação onchain usa o refId.</div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-4 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold">🧩 Splits (opcional)</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Defina recebedores e percentuais em <span className="font-semibold">bps</span> (10.000 = 100%).
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!chainOk || !address || !!busy}
                  onClick={() => setSplits((s) => [...s, { to: "", bps: "" }])}
                >
                  ➕ Adicionar
                </Button>
              </div>

              {splits.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200/70 bg-white/40 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Nenhum split configurado. (Opcional)
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Endereço</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">BPS</div>
                    <div />
                  </div>
                  {splits.map((row, idx) => (
                    <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-center">
                      <Input
                        value={row.to}
                        onChange={(e) =>
                          setSplits((s) => s.map((r, i) => (i === idx ? { ...r, to: e.target.value } : r)))
                        }
                        placeholder="0x..."
                      />
                      <Input
                        value={row.bps}
                        onChange={(e) =>
                          setSplits((s) => s.map((r, i) => (i === idx ? { ...r, bps: e.target.value } : r)))
                        }
                        placeholder="250"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!chainOk || !address || !!busy}
                        onClick={() => setSplits((s) => s.filter((_, i) => i !== idx))}
                        title="Remover"
                      >
                        ✖
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-600 dark:text-slate-300">
                  Soma: <span className="font-mono font-extrabold tabular-nums">{splitSummary.sum}</span> / 10000 bps
                </div>
                {splitSummary.sum > 10000 ? (
                  <div className="font-extrabold text-rose-700 dark:text-rose-200">⚠️ Excede 100%</div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={createInvoice} variant="primary" disabled={!chainOk || !address || !!busy}>
                {busy === "Criar" ? "⌛ Criando…" : "➕ Criar cobrança"}
              </Button>
              <Button onClick={() => setCreateRefId(randomBytes32())} variant="secondary" disabled={!chainOk || !address || !!busy}>
                🎲 Novo refId
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold">📋 Cobranças</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Lista local com sincronização do status onchain (via getInvoice).
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTab("PENDING")} variant={tab === "PENDING" ? "primary" : "secondary"}>🕒 Pendentes</Button>
              <Button onClick={() => setTab("PAID")} variant={tab === "PAID" ? "primary" : "secondary"}>✅ Pagas</Button>
              <Button onClick={() => setTab("CANCELLED")} variant={tab === "CANCELLED" ? "primary" : "secondary"}>🛑 Canceladas</Button>
            {address && tab === "PENDING" && filtered.length > 0 ? (
                <Button
                  onClick={() => {
                    setInvoices(hideAllPending(address));
                    toast.setMsg("🗑️ Pendentes excluídas (local).");
                  }}
                  variant="ghost"
                >
                  🗑️ Excluir pendentes
                </Button>
              ) : null}
              </div>
          </div>

        <div className="mt-4 rounded-3xl border border-slate-200/70 bg-white/60 p-4 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1">
              <Label>🔎 Verificar recibo (invoiceId)</Label>
              <Input
                value={verifyId}
                onChange={(e) => {
                  setVerifyId(e.target.value);
                  setVerifyResult(null);
                }}
                placeholder="#3 ou 3"
              />
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Consulta direta no contrato via <span className="font-mono">getInvoice</span>.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={verifyInvoice} variant="secondary" disabled={!chainOk || !!busy}>
                {busy === "Verificar" ? "⌛ Verificando…" : "🔎 Verificar"}
              </Button>
              {verifyResult ? (
                <>
                  <Button onClick={() => window.open(`/r/${verifyResult.id}`, "_blank")} variant="primary" disabled={!chainOk}>
                    🧾 Abrir recibo
                  </Button>
                  {address ? (
                    <Button
                      onClick={() => {
                        const list = upsertInvoice(address, verifyResult);
                        setInvoices(list);
                        toast.setMsg("✅ Adicionado na sua lista local.");
                      }}
                      variant="ghost"
                      disabled={!chainOk}
                    >
                      ➕ Salvar
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {verifyResult ? (
            <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-xs text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-extrabold">
                  #{verifyResult.id} • {formatBRLFromCents(BigInt(verifyResult.amountCents))}
                </div>
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-2 py-1 font-extrabold text-violet-700 dark:text-violet-200">
                  {verifyResult.status === "PAID" ? "✅ Pago" : verifyResult.status === "CANCELLED" ? "🛑 Cancelado" : "🕒 Pendente"}
                </div>
              </div>
              <div className="mt-1 text-slate-600 dark:text-slate-300">
                merchant: <span className="font-mono">{clampText(verifyResult.merchant, 20)}</span> • refId: <span className="font-mono">{verifyResult.refId.slice(0, 12)}…</span>
              </div>
            </div>
          ) : null}
        </div>

          <div className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Nada aqui ainda. Crie uma cobrança para aparecer em <span className="font-semibold">Pendentes</span>.
              </div>
            ) : (
              filtered.map((inv) => {
                const meta =
                  inv.status === "PAID"
                    ? { badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200", label: "✅ Pago" }
                    : inv.status === "CANCELLED"
                    ? { badge: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200", label: "🛑 Cancelado" }
                    : { badge: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-200", label: "🕒 Pendente" };

                return (
                  <div
                    key={inv.id}
                    className="rounded-3xl border border-slate-200/70 bg-white/60 p-4 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-extrabold">#{inv.id}</div>
                          <div className="font-extrabold">{formatBRLFromCents(BigInt(inv.amountCents))}</div>
                          <div className={"rounded-2xl border px-2 py-1 text-xs font-extrabold " + meta.badge}>
                            {meta.label}
                          </div>
                        </div>

                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          refId: <span className="font-mono">{inv.refId.slice(0, 12)}…</span>
                          {inv.dueAt ? (
                            <>
                              {" "}• vence: <span className="font-mono">{new Date(inv.dueAt * 1000).toLocaleString()}</span>
                            </>
                          ) : null}

                          {inv.splits && inv.splits.length ? (
                            <>
                              {" "}• splits: <span className="font-mono">{inv.splits.length} recebedor(es)</span>
                            </>
                          ) : null}

                          {inv.createTx ? (
                            <>
                              {" "}• create: <a className="font-mono underline decoration-violet-400/60 underline-offset-2" href={txUrl(inv.createTx)} target="_blank" rel="noreferrer">{clampText(inv.createTx, 16)}</a>
                            </>
                          ) : null}

                          {inv.payTx ? (
                            <>
                              {" "}• pay: <a className="font-mono underline decoration-emerald-400/60 underline-offset-2" href={txUrl(inv.payTx)} target="_blank" rel="noreferrer">{clampText(inv.payTx, 16)}</a>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={() => openQrFor(inv)} variant="secondary" size="sm">🔳 QR</Button>
                        <Button onClick={() => window.open(`/r/${inv.id}`, "_blank")} variant="ghost" size="sm">🧾 Recibo</Button>

                        {inv.status === "PENDING" ? (
                          <Button onClick={() => pay(inv)} variant="primary" size="sm" disabled={!!busy}>💳 Pagar</Button>
                        ) : null}

                        {inv.status === "PENDING" && inv.merchant.toLowerCase() === address.toLowerCase() ? (
                          <Button onClick={() => cancel(inv)} variant="ghost" size="sm" disabled={!!busy}>🛑 Cancelar</Button>
                        ) : null}

                        <Button
                          onClick={() => {
                            setInvoices(setHidden(address, inv.id, true));
                            toast.setMsg("🗑️ Ocultado (local).");
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          🗑️ Excluir
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {inv.createTx ? (
                        <a
                          className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-1 font-mono font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                          href={`${ARC_TESTNET.explorer}/tx/${inv.createTx}`}
                          target="_blank"
                          rel="noreferrer"
                          title={inv.createTx}
                        >
                          ↗ create {clampText(inv.createTx, 18)}
                        </a>
                      ) : null}

                      {inv.payTx ? (
                        <a
                          className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-1 font-mono font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                          href={`${ARC_TESTNET.explorer}/tx/${inv.payTx}`}
                          target="_blank"
                          rel="noreferrer"
                          title={inv.payTx}
                        >
                          ↗ pay {clampText(inv.payTx, 18)}
                        </a>
                      ) : null}

                      {inv.cancelTx ? (
                        <a
                          className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-1 font-mono font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                          href={`${ARC_TESTNET.explorer}/tx/${inv.cancelTx}`}
                          target="_blank"
                          rel="noreferrer"
                          title={inv.cancelTx}
                        >
                          ↗ cancel {clampText(inv.cancelTx, 18)}
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              }))}
          </div>
        </Card>
      </div>

      {qrOpen && qrInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#070A14]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">🔳 QR & Payload</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Cobrança #{qrInvoice.id} • {formatBRLFromCents(BigInt(qrInvoice.amountCents))}
                </div>
              </div>
              <Button onClick={closeQr} variant="ghost">✖</Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="mx-auto w-full max-w-[360px] rounded-2xl" />
                ) : (
                  <div className="text-sm text-slate-600 dark:text-slate-300">Gerando QR…</div>
                )}
                <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  Use como “copia e cola” (payload) ou para demo visual com QR.
                </div>
              </div>

              <div>
                <Label>Payload</Label>
                <Textarea value={qrPayload} readOnly rows={10} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(qrPayload);
                        toast.setMsg("📋 Payload copiado.");
                      } catch {
                        toast.setMsg("Não foi possível copiar automaticamente.");
                      }
                    }}
                    variant="primary"
                  >
                    📋 Copiar
                  </Button>
                  <Button onClick={() => window.open(`/r/${qrInvoice.id}`, "_blank")} variant="secondary">🧾 Abrir recibo</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
