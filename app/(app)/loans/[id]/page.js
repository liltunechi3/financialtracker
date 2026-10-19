import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { payInstallment, deleteLoan } from "@/lib/actions";
import { rupiah, daysUntil } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LoanDetail({ params }) {
  const supabase = createClient();
  const { data: loan } = await supabase.from("loans").select("*").eq("id", params.id).maybeSingle();
  if (!loan) notFound();
  const { data: rows } = await supabase
    .from("loan_installments").select("*").eq("loan_id", loan.id).order("installment_no");

  const sum = (f, only) => rows.filter(only ?? (() => true)).reduce((s, r) => s + Number(r[f]), 0);
  const unpaid = (r) => !r.paid_on;

  return (
    <>
      <h1>{loan.name}</h1>
      <section className="cards">
        <div className="card"><span>Total dibayar</span><b>{rupiah(sum("amount"))}</b></div>
        <div className="card"><span>Total bunga</span><b>{rupiah(sum("interest_part"))}</b></div>
        <div className="card"><span>Sisa pokok</span><b>{rupiah(sum("principal_part", unpaid))}</b></div>
        <div className="card"><span>Sisa tagihan</span><b>{rupiah(sum("amount", unpaid))}</b></div>
      </section>

      <section className="panel">
        <h2>Jadwal cicilan</h2>
        <div className="table">
          <div className="thead"><span>#</span><span>Jatuh tempo</span><span>Pokok</span><span>Bunga</span><span>Cicilan</span><span /></div>
          {rows.map((r) => {
            const d = daysUntil(r.due_date);
            return (
              <div className={`trow ${r.paid_on ? "done" : d < 0 ? "late" : ""}`} key={r.id}>
                <span>{r.installment_no}</span>
                <span>{r.due_date}</span>
                <span>{rupiah(r.principal_part)}</span>
                <span>{rupiah(r.interest_part)}</span>
                <b>{rupiah(r.amount)}</b>
                {r.paid_on ? <span className="pos">Lunas {r.paid_on}</span> : (
                  <form action={payInstallment}><input type="hidden" name="id" value={r.id} /><button>Bayar</button></form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <form action={deleteLoan}>
        <input type="hidden" name="id" value={loan.id} />
        <button className="danger">Hapus pinjaman ini</button>
      </form>
    </>
  );
}
