import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ARC_TESTNET } from "../config/chain";
import { CONTRACTS } from "../config/contracts";

const STEPS = [
  {
    icon: "🔌",
    title: "Conecte a wallet",
    desc: "Abra a aba Launch e conecte sua carteira. Se não estiver na Arc Testnet, troque a rede pelo botão de aviso.",
  },
  {
    icon: "💧",
    title: "Garanta gas (USDC) e aBRL",
    desc: "Use a faucet 24h (se disponível) e/ou o mint de aBRL para ter saldo e testar pagamentos.",
  },
  {
    icon: "✅",
    title: "Approve aBRL",
    desc: "Libere o contrato de invoices para movimentar seu aBRL. Isso permite pagar cobranças sem fricção.",
  },
  {
    icon: "🧾",
    title: "Crie uma cobrança",
    desc: "Defina valor e (opcional) vencimento. Ao criar, o sistema gera payload + QR e adiciona em Pendentes.",
  },
  {
    icon: "💳",
    title: "Pague com outra wallet",
    desc: "Troque para outra carteira e clique em Pagar. O status muda para Pago e o recibo fica verificável onchain.",
  },
  {
    icon: "🔎",
    title: "Valide o recibo público",
    desc: "Abra /r/:invoiceId e compare o que aparece na UI com o explorer para auditoria e conciliação por eventos.",
  },
] as const;

export default function Guide() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-3xl font-extrabold tracking-tight">🧭 Guia rápido</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Passo a passo para testar o fluxo completo (mint → approve → criar cobrança → pagar → recibo).
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: i * 0.05 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20 text-lg">
                  {s.icon}
                </div>
                <div>
                  <div className="text-lg font-extrabold">{s.title}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.desc}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-6">
        <div className="text-lg font-extrabold">🔗 Referências</div>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rede</div>
            <div className="mt-2 space-y-1">
              <div>Chain ID: <span className="font-mono">{ARC_TESTNET.chainId}</span></div>
              <div>RPC: <span className="font-mono">{ARC_TESTNET.rpcUrl}</span></div>
              <div>Explorer: <span className="font-mono">{ARC_TESTNET.explorer}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contratos</div>
            <div className="mt-2 space-y-1">
              <div>aBRL: <span className="font-mono">{CONTRACTS.aBRL}</span></div>
              <div>Invoices: <span className="font-mono">{CONTRACTS.invoices}</span></div>
              <div>Faucet 24h: <span className="font-mono">{CONTRACTS.faucet24h}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/app">
            <Button variant="primary">🚀 Abrir Launch</Button>
          </Link>
          <Link to="/docs">
            <Button variant="secondary">📘 Docs</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
