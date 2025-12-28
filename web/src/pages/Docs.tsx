import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ARC_TESTNET } from "../config/chain";
import { CONTRACTS } from "../config/contracts";

type Tab = "overview" | "architecture" | "faq" | "terms" | "privacy";

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "overview", label: "Visão geral", icon: "📘" },
  { id: "architecture", label: "Arquitetura", icon: "🧱" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "terms", label: "Termos", icon: "📄" },
  { id: "privacy", label: "Privacidade", icon: "🔒" },
];

const HIGHLIGHTS = [
  {
    icon: "⚡",
    title: "Setup rápido",
    desc: "Conecte a carteira, garanta saldo para gas, mint aBRL, aprove e execute o fluxo completo.",
  },
  {
    icon: "🧾",
    title: "Recibo público",
    desc: "Leitura onchain em /r/:invoiceId com status, timestamps e dados da cobrança.",
  },
  {
    icon: "📊",
    title: "Conciliação",
    desc: "Eventos padronizados para somar, auditar e exportar a atividade.",
  },
  {
    icon: "🧩",
    title: "Splits",
    desc: "Repasse automático por basis points (bps) para múltiplos recebedores.",
  },
] as const;

function SectionTitle(props: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20 text-lg">
        {props.icon}
      </div>
      <div>
        <div className="text-xl font-extrabold tracking-tight">{props.title}</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{props.desc}</div>
      </div>
    </div>
  );
}

function FaqItem(props: { q: string; a: string }) {
  return (
    <details className="group rounded-3xl border border-slate-200/70 bg-white/60 p-5 shadow-sm backdrop-blur open:bg-white dark:border-white/10 dark:bg-white/5 dark:open:bg-white/10">
      <summary className="cursor-pointer list-none font-extrabold">
        <div className="flex items-center justify-between gap-4">
          <span>{props.q}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700 shadow-sm transition group-open:bg-violet-500/15 group-open:text-violet-700 dark:bg-white/10 dark:text-slate-200 dark:group-open:text-violet-200">
            <span className="text-lg leading-none transition-transform duration-200 group-open:rotate-180">▾</span>
          </span>
        </div>
      </summary>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{props.a}</div>
    </details>
  );
}

export default function Docs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    const t = searchParams.get("tab") as Tab | null;
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, []);

  function setTabAndUrl(t: Tab) {
    setTab(t);
    setSearchParams({ tab: t });
  }

  const faq = useMemo(
    () => [
      {
        q: "Isso é Pix de verdade?",
        a: "Não. É um fluxo simulando Pix para UX e testes, mas o recibo/estado da cobrança é verificável onchain (Arc Testnet).",
      },
      {
        q: "Como o status muda de Pendente para Pago?",
        a: "Ao pagar, o contrato emite eventos e atualiza o status. O app sincroniza chamando getInvoice para os IDs salvos localmente.",
      },
      {
        q: "Por que preciso de Approve?",
        a: "Porque o contrato de invoices precisa permissão para transferir seu aBRL no pagamento (padrão ERC-20 allowance).",
      },
      {
        q: "As cobranças ficam salvas no blockchain?",
        a: "Sim: merchant, token, amount, dueAt, refId, status e timestamps ficam onchain. A lista na UI é local (para facilitar) e sincroniza o status onchain.",
      },
      {
        q: "Posso apagar uma cobrança?",
        a: "Onchain não dá para “apagar”. Você pode cancelar (se for o merchant) e também ocultar na UI (remove da lista local).",
      },
      {
        q: "O que é o refId?",
        a: "Um bytes32 usado como identificador de conciliação (ex: hash de pedido). Ele ajuda auditoria/integração sem expor dados sensíveis.",
      },
      {
        q: "O que significa Splits (bps)?",
        a: "É divisão do pagamento por basis points (1% = 100 bps). O contrato repassa automaticamente para múltiplos recebedores no ato do pagamento.",
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-3xl font-extrabold tracking-tight">📚 Docs</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Guia técnico e de uso do ArcDeck PixFlow, com foco em UX de cobrança, recibo público e conciliação onchain.
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button
              key={t.id}
              onClick={() => setTabAndUrl(t.id)}
              variant={tab === t.id ? "primary" : "secondary"}
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {tab === "overview" ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <Card className="p-6">
              <SectionTitle
                icon="🏦"
                title="ArcDeck PixFlow"
                desc="Cobrança usando Pix (simulado) com recibo verificável onchain — focado em UX, rastreabilidade e conciliação por eventos."
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">O que é</div>
                  <div className="mt-2 text-slate-600 dark:text-slate-300">
                    Uma demonstração de <span className="font-semibold">cobrança</span> (simulada) com <span className="font-semibold">recibo público</span>.
                    O objetivo é mostrar um fluxo completo que dá para testar em minutos e compartilhar por link/QR, com rastreabilidade onchain.
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    <li>Merchant cria uma cobrança (invoice) e compartilha o QR/payload.</li>
                    <li>Payer paga com outra wallet e o status muda para <span className="font-semibold">PAID</span>.</li>
                    <li>O recibo fica verificável em <span className="font-mono">/r/:invoiceId</span>.</li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">Onde isso encaixa</div>
                  <div className="mt-2 text-slate-600 dark:text-slate-300">
                    Serve como base para protótipos e demos técnicas em cenários como:
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    <li>Checkout (pedido → cobrança → recibo) com conciliação por eventos.</li>
                    <li>Assinaturas/recorrência (refId por ciclo).</li>
                    <li>Marketplaces com repasse automático via splits (bps).</li>
                    <li>Auditoria: prova pública do status e timestamps por ID.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {HIGHLIGHTS.map((h, i) => (
                  <motion.div
                    key={h.title}
                    initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.55, delay: i * 0.06 }}
                    className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20 text-lg">
                        {h.icon}
                      </div>
                      <div>
                        <div className="font-extrabold">{h.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.desc}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <div className="font-extrabold text-slate-900 dark:text-slate-100">Detalhes técnicos (resumo)</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>aBRL (ERC-20, decimals=2) representa o valor da cobrança em centavos.</li>
                  <li>Invoices são criadas via <span className="font-mono">createInvoice(token, amount, dueAt, refId, recipients[], bps[])</span>.</li>
                  <li>O recibo usa <span className="font-mono">getInvoice(invoiceId)</span> + hashes de transação (create/pay/cancel) para verificação.</li>
                  <li>Splits (bps) permitem repasse determinístico no pagamento (1% = 100 bps; 100% = 10.000 bps).</li>
                  <li>O payload/QR é um formato leve para demo (cópia/cola + leitura visual) e pode ser versionado (v1...).</li>
                </ul>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {tab === "architecture" ? (
          <motion.div
            key="architecture"
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <Card className="p-6">
              <SectionTitle
                icon="🧱"
                title="Arquitetura"
                desc="Fluxo: (1) merchant cria invoice (2) payer paga (3) eventos + recibo público para conciliação e auditoria."
              />

              <div className="mt-5 rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="font-extrabold text-slate-900 dark:text-slate-100">Mapa técnico</div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 font-semibold backdrop-blur dark:border-white/10 dark:bg-white/5">👛 Wallet (merchant)</div>
                  <span className="font-bold text-slate-400">→</span>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 font-semibold backdrop-blur dark:border-white/10 dark:bg-white/5">🚀 Launch UI</div>
                  <span className="font-bold text-slate-400">→</span>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 font-semibold backdrop-blur dark:border-white/10 dark:bg-white/5">🌐 RPC</div>
                  <span className="font-bold text-slate-400">→</span>
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 font-extrabold text-violet-700 shadow-sm dark:text-violet-200">📜 ArcDeckInvoices</div>
                  <span className="font-bold text-slate-400">→</span>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 font-semibold backdrop-blur dark:border-white/10 dark:bg-white/5">🧾 Eventos/estado</div>
                  <span className="font-bold text-slate-400">→</span>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 font-semibold backdrop-blur dark:border-white/10 dark:bg-white/5">🔎 Recibo /r/:id</div>
                </div>

                <div className="mt-3 text-slate-600 dark:text-slate-300">
                  O app usa leitura direta (<span className="font-mono">getInvoice</span>) para verificar status por ID e, quando necessário,
                  eventos para conciliação/auditoria. Para dashboards baseados em logs, o recomendado é paginar por blocos e respeitar limites
                  de range do RPC.
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold">Contratos</div>
                  <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                    <div>aBRL: <span className="font-mono">{CONTRACTS.aBRL}</span></div>
                    <div>Invoices: <span className="font-mono">{CONTRACTS.invoices}</span></div>
                    <div>Faucet 24h: <span className="font-mono">{CONTRACTS.faucet24h}</span></div>
                    <div>USDC (token): <span className="font-mono">{ARC_TESTNET.usdcToken}</span></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold">Infra Arc Testnet</div>
                  <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                    <div>Chain ID: <span className="font-mono">{ARC_TESTNET.chainId}</span></div>
                    <div>RPC: <span className="font-mono">{ARC_TESTNET.rpcUrl}</span></div>
                    <div>Explorer: <span className="font-mono">{ARC_TESTNET.explorer}</span></div>
                    <div>RPCs alternativos:</div>
                    <div className="pl-2 text-xs">
                      {ARC_TESTNET.altRpcs.map((u) => (
                        <div key={u} className="font-mono">• {u}</div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <a href={ARC_TESTNET.explorer} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                        Abrir explorer
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <div className="font-extrabold text-slate-900 dark:text-slate-100">Eventos e indexação</div>
                <div className="mt-2">
                  Para conciliação e auditoria, o padrão é indexar eventos emitidos pelo contrato de invoices (ex.: criação, pagamento,
                  cancelamento) e somar valores por merchant/refId. Alguns RPCs limitam buscas longas de logs; na prática, divida por janelas
                  menores (ex.: <span className="font-mono">{ARC_TESTNET.logScanBlocks}</span> blocos) e avance incrementalmente.
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  <li><span className="font-semibold">Leitura pontual</span>: <span className="font-mono">getInvoice(id)</span> (ótimo para recibos e verificações).</li>
                  <li><span className="font-semibold">Leitura por eventos</span>: <span className="font-mono">eth_getLogs</span> paginado (ótimo para dashboards e exportações).</li>
                  <li><span className="font-semibold">Fonte de verdade</span>: a blockchain; a lista do app é apenas conveniência (localStorage).</li>
                </ul>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <div className="font-extrabold text-slate-900 dark:text-slate-100">Recibo público</div>
                <div className="mt-2">
                  O recibo é uma combinação de: (a) leitura onchain via <span className="font-mono">getInvoice(invoiceId)</span> e (b) verificação
                  via explorer usando hashes de transação. A página <span className="font-mono">/r/:invoiceId</span> facilita esse processo.
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {tab === "faq" ? (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <Card className="p-6">
              <SectionTitle icon="❓" title="FAQ" desc="Dúvidas comuns. Clique para expandir as respostas." />
              <div className="mt-5 space-y-3">
                {faq.map((x) => (
                  <FaqItem key={x.q} q={x.q} a={x.a} />
                ))}
              </div>
            </Card>
          </motion.div>
        ) : null}

        {tab === "terms" ? (
          <motion.div
            key="terms"
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <Card className="p-6">
              <SectionTitle icon="📄" title="Termos" desc="Uso para testes e demonstrações (Arc Testnet)." />
              <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">1) Natureza do projeto</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Este aplicativo é uma demonstração técnica (testnet) e <span className="font-semibold">não</span> presta serviço financeiro.</li>
                    <li>“Pix” é marca registrada do Banco Central do Brasil. O fluxo aqui é uma <span className="font-semibold">simulação</span> para fins de UX e rastreabilidade onchain.</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">2) Riscos e responsabilidade</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Você é responsável por revisar e assinar transações na sua carteira.</li>
                    <li>Endereços incorretos, valores errados e permissões (approve) são de responsabilidade do usuário.</li>
                    <li>Contratos e interfaces podem evoluir; não há garantia de compatibilidade futura.</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">3) Sem garantias</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>O app é fornecido “como está”, sem garantias de disponibilidade, segurança ou adequação a um propósito específico.</li>
                    <li>Não use para valores reais; use apenas recursos de testnet.</li>
                  </ul>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Ao usar o app, você concorda com estes termos.
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {tab === "privacy" ? (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <Card className="p-6">
              <SectionTitle icon="🔒" title="Privacidade" desc="Dados onchain são públicos por natureza." />
              <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">1) O que fica público</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Endereços, transações, eventos e estado das invoices são públicos na blockchain.</li>
                    <li>Qualquer pessoa pode consultar o recibo por ID em <span className="font-mono">/r/:invoiceId</span> (via leitura onchain).</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">2) O que o app armazena no navegador</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Lista de invoices criadas por você (IDs) e algumas preferências de UI (ex.: ocultar itens).</li>
                    <li>Esse armazenamento é local (localStorage) e pode ser apagado limpando os dados do site no navegador.</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">3) Terceiros e infraestrutura</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>O app se conecta a um RPC público (Arc Testnet) para ler/enviar transações.</li>
                    <li>Sua carteira (extensão/app) gerencia chaves, assinaturas e permissões; o site não recebe sua seed/private key.</li>
                    <li>Links externos (ex.: explorer e faucets) têm políticas próprias.</li>
                  </ul>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Se quiser máxima privacidade, evite colocar informações pessoais em campos públicos (ex.: memo) e trate refId como identificador técnico.
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
