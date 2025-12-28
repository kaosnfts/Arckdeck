import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/Button";
import { TypewriterText } from "../components/TypewriterText";
import slide1 from "../assets/slides/slide-1.png";
import slide2 from "../assets/slides/slide-2.png";
import slide3 from "../assets/slides/slide-3.png";
import { ARC_TESTNET } from "../config/chain";

const TAGLINES = [
  "🧾 Recibo público em /r/:invoiceId (status, timestamps e dados da cobrança).",
  "🔳 QR + payload para demo e integração rápida em front/back.",
  "📊 Conciliação por eventos (auditoria, somatórios, exportação).",
  "🧩 Splits por basis points (bps) para múltiplos recebedores.",
] as const;

const IDEAS = [
  {
    icon: "🛒",
    title: "Checkout e e-commerce",
    desc: "Gerar cobranças para pedidos e reconciliar pagamentos por eventos, sem depender de backend para a demo.",
  },
  {
    icon: "🔁",
    title: "Assinaturas e recorrência",
    desc: "Criar invoices com referência (refId) e acompanhar o status onchain para conciliação mensal.",
  },
  {
    icon: "🧾",
    title: "Recebimento com comprovante",
    desc: "Compartilhar um recibo público verificável por ID, com timestamps e dados essenciais da cobrança.",
  },
  {
    icon: "🧩",
    title: "Repasse automático (splits)",
    desc: "Distribuir por bps para múltiplos endereços (marketplace, afiliados, times ou cofre).",
  },
] as const;

const FEATURES = [
  { icon: "⚡", title: "Setup rápido", desc: "Conecte a carteira, mint aBRL, aprove e execute o fluxo completo." },
  { icon: "🧾", title: "Recibo verificável", desc: "Dados onchain consultáveis e compartilháveis com link público." },
  { icon: "📊", title: "Conciliação", desc: "Eventos padronizados para somar, auditar e exportar a atividade." },
  { icon: "🧩", title: "Splits", desc: "Repasse automático por bps para múltiplos recebedores no pagamento." },
] as const;

export default function Landing() {
  const slides = useMemo(() => [slide1, slide2, slide3], []);
  const [idx, setIdx] = useState(0);

  // Intro "manuscrito" timing (ms)
  const typeSpeed = 22;
  const line1 = "Cobrança usando Pix (simulado)";
  const line2a = "com recibo verificável ";
  const line2b = "onchain";
  const d0 = 80;
  const d2 = d0 + Array.from(line1).length * typeSpeed + 180;
  const d3 = d2 + Array.from(line2a).length * typeSpeed + 80;
  const restDelay = d3 + Array.from(line2b).length * typeSpeed + 160;

  const restDelaySec = restDelay / 1000;
  const enter = (i: number, base: number) => {
    const fromX = i % 2 === 0 ? -34 : 34;
    return {
      initial: { opacity: 0, x: fromX, y: 12 },
      animate: { opacity: 1, x: 0, y: 0 },
      transition: {
        delay: base + i * 0.18,
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
      },
    } as const;
  };

  useEffect(() => {
    const t = setInterval(() => setIdx((v) => (v + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="space-y-6">
      {/*
        Sem "retângulo"/Card no topo: o herói usa o fundo do app e blocos internos,
        mantendo as mesmas informações.
      */}
      <section className="grid items-center gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="relative"
            >
              <div className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2.5rem] bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-cyan-400/10 blur-2xl" />
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(168,85,247,0.42)]">
                  <TypewriterText text={line1} delayMs={d0} speedMs={typeSpeed} />
                </span>
                <span className="block text-slate-700 dark:text-slate-200">
                  <TypewriterText text={line2a} delayMs={d2} speedMs={typeSpeed} cursor={false} />
                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    <TypewriterText text={line2b} delayMs={d3} speedMs={typeSpeed} cursor={false} />
                  </span>
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: restDelay / 1000 }}
              className="mt-3 text-base text-slate-600 dark:text-slate-300"
            >
              Fluxo completo de cobrança com <span className="font-semibold">criação</span>, <span className="font-semibold">pagamento</span> e{" "}
              <span className="font-semibold">recibo público</span> — pensado para rastreabilidade, conciliação por eventos e demos técnicas.
              <span className="block mt-2 text-sm text-slate-600/90 dark:text-slate-300/90">
                Ideia de uso: checkout de pedidos, assinaturas/recorrência, marketplaces (splits) e validação pública de comprovantes por ID.
              </span>
            </motion.p>

            <motion.ul
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: restDelay / 1000 + 0.12 } },
              }}
              className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300"
            >
              {TAGLINES.map((t) => (
                <motion.li
                  key={t}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.995 }}
                  className="group flex items-start gap-2 transition-colors hover:text-slate-800 dark:hover:text-slate-100"
                >
                  <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-violet-500/70 shadow-[0_0_16px_rgba(168,85,247,0.35)] transition-transform duration-200 group-hover:scale-110" />
                  <span>{t}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: restDelay / 1000 + 0.28 }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <Link to="/app">
                <Button variant="primary">🚀 Abrir Launch</Button>
              </Link>
              <Link to="/docs">
                <Button variant="secondary">📘 Docs</Button>
              </Link>
              <a href={ARC_TESTNET.explorer} target="_blank" rel="noreferrer">
                <Button variant="ghost">🔎 Explorer</Button>
              </a>
            </motion.div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  {...enter(i, restDelaySec + 0.55)}
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  className="group rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-slate-300/70 hover:ring-1 hover:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20 text-lg transition-transform duration-200 group-hover:scale-105">
                      {f.icon}
                    </div>
                    <div>
                      <div className="font-extrabold">{f.title}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.desc}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Ideias de uso</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {IDEAS.map((x, i) => (
                  <motion.div
                    key={x.title}
                    {...enter(i, restDelaySec + 1.05)}
                    whileHover={{ y: -6, scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    className="group rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-slate-300/70 hover:ring-1 hover:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20 text-lg transition-transform duration-200 group-hover:scale-105">
                        {x.icon}
                      </div>
                      <div>
                        <div className="font-extrabold">{x.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{x.desc}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="relative"
            >
                            <div className="mt-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10, scale: 1.01 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.55 }}
                    className="group overflow-hidden rounded-3xl border border-slate-200/70 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300/70 dark:border-white/10 dark:hover:border-white/20"
                  >
                    <div className="relative w-full aspect-[16/10]">
                      <img
                        src={slides[idx]}
                        alt="Preview"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-3 flex items-center justify-between px-2">
                <div className="flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={
                        "h-2.5 w-2.5 rounded-full transition " +
                        (i === idx
                          ? "bg-violet-500 shadow-[0_0_18px_rgba(168,85,247,0.45)]"
                          : "bg-slate-300/70 hover:bg-slate-400/70 dark:bg-white/10 dark:hover:bg-white/20")
                      }
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>

                              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.45 }}
              className="mt-4 rounded-3xl border border-slate-200/70 bg-white/60 p-5 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              <div className="font-extrabold text-slate-900 dark:text-slate-100">Dica</div>
              <div className="mt-2">
                Para testar end-to-end, use duas wallets: <span className="font-semibold">merchant</span> cria a cobrança e{" "}
                <span className="font-semibold">payer</span> paga. Em seguida, compartilhe o recibo público em{" "}
                <span className="font-mono">/r/:invoiceId</span>.
              </div>
            </motion.div>
          </div>
      </section>
    </div>
  );
}
