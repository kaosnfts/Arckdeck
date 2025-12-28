import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ARC_TESTNET } from "../config/chain";
import { CONTRACTS } from "../config/contracts";
import { ArcDeckInvoicesAbi } from "../abi/ArcDeckInvoices";
import { formatBRLFromCents, isZeroAddress } from "../lib/eth";

const STATUS: Record<number, string> = { 0: "NONE", 1: "PENDING", 2: "PAID", 3: "CANCELLED" };

export default function ReceiptPublic() {
  const { invoiceId } = useParams();
  const id = useMemo(() => Number(invoiceId || "0"), [invoiceId]);
  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      setData(null);
      if (!id || id < 1) return;
      if (isZeroAddress(CONTRACTS.invoices)) {
        setErr("Contrato de invoices não configurado.");
        return;
      }
      try {
        const provider = new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
        const c = new ethers.Contract(CONTRACTS.invoices, ArcDeckInvoicesAbi, provider);
        const inv = await c.getInvoice(id);
        setData(inv);
      } catch (e: any) {
        setErr(e?.shortMessage || e?.message || "Falha ao carregar recibo.");
      }
    })();
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-extrabold">🧾 Recibo</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Verificação pública do invoice #{id || "-"}
          </div>
        </div>
        <Link to="/app"><Button variant="primary">🚀 Voltar ao app</Button></Link>
      </div>

      <Card>
        {!id || id < 1 ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Invoice inválido.</div>
        ) : err ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">{err}</div>
        ) : !data ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Carregando…</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">Status</div>
              <div className="rounded-full border border-slate-200 px-3 py-1 dark:border-white/10">
                {STATUS[Number(data.status)] || "—"}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="text-xs font-semibold text-slate-500">Valor</div>
                <div className="mt-1 text-base font-extrabold">{formatBRLFromCents(BigInt(data.amount.toString()))}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="text-xs font-semibold text-slate-500">Merchant</div>
                <div className="mt-1 break-all">{data.merchant}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="text-xs font-semibold text-slate-500">Token</div>
                <div className="mt-1 break-all">{data.token}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="text-xs font-semibold text-slate-500">PixTxId (simulado)</div>
                <div className="mt-1 break-all">{data.pixTxId}</div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              “Pix” é marca registrada do Banco Central do Brasil. Este recibo é uma simulação onchain para fins de teste.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
