import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rupiah, monthStart, daysUntil } from "@/lib/format";
import { payInstallment } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const from = monthStart();

  const [tx, budgets, goals, due, remaining] = await Promise.all([
    supabase.from("transactions").select("type, amount, category").gte("occurred_on", from),
    supabase.from("budgets").select("category, monthly_limit"),
    supabase.from("goals").select("name, target_amount, saved_amount"),
    supabase.from("loan_installments")
      .select("id, due_date, amount, installment_no, loans(name)")
      .is("paid_on", null).order("due_date").limit(5),
    supabase.from("loan_installments").select("principal_part").is("paid_on", null),
  ]);

  const rows = tx.data ?? [];
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
  const spentBy = {};
  rows.filter((r) => r.type === "expense").forEach((r) => {
    spentBy[r.category] = (spentBy[r.category] ?? 0) + Number(r.amount);
  });
  const debt = (remaining.data ?? []).reduce((s, r) => s + Number(r.principal_part), 0);

  return (
    <>
      <h1>Dashboard</h1>
      <section className="cards">
        <div className="card"><span>Pemasukan bulan ini</span><b className="pos">{rupiah(income)}</b></div>
        <div className="card"><span>Pengeluaran bulan ini</span><b className="neg">{rupiah(expense)}</b></div>
        <div className="card"><span>Sisa bulan ini</span><b>{rupiah(income - expense)}</b></div>
        <div className="card"><span>Sisa pokok utang</span><b>{rupiah(debt)}</b></div>
      </section>

      <section className="panel">
        <h2>Cicilan jatuh tempo</h2>
        {(due.data ?? []).length === 0 && <p className="muted">Tidak ada cicilan aktif. <Link href="/loans">Tambah pinjaman</Link></p>}
        {(due.data ?? []).map((i) => {
          const d = daysUntil(i.due_date);
          return (
            <div className="row" key={i.id}>
              <div>
                <b>{i.loans.name}</b> · ke-{i.installment_no}
                <div className={d < 0 ? "err" : d <= 3 ? "warn" : "muted"}>
                  {i.due_date} · {d < 0 ? `terlambat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`}
                </div>
              </div>
              <div className="right">
                <b>{rupiah(i.amount)}</b>
                <form action={payInstallment}><input type="hidden" name="id" value={i.id} /><button>Bayar</button></form>
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h2>Budget bulan ini</h2>
        {(budgets.data ?? []).length === 0 && <p className="muted">Belum ada budget. <Link href="/budgets">Atur budget</Link></p>}
        {(budgets.data ?? []).map((b) => {
          const spent = spentBy[b.category] ?? 0;
          const pct = Math.round((spent / b.monthly_limit) * 100);
          return (
            <div key={b.category} className="bar-wrap">
              <div className="row"><span>{b.category}</span><span>{rupiah(spent)} / {rupiah(b.monthly_limit)}</span></div>
              <div className="bar"><i className={pct > 100 ? "over" : pct >= 80 ? "near" : ""} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h2>Tujuan tabungan</h2>
        {(goals.data ?? []).length === 0 && <p className="muted">Belum ada tujuan. <Link href="/goals">Buat tujuan</Link></p>}
        {(goals.data ?? []).map((g) => {
          const pct = Math.round((g.saved_amount / g.target_amount) * 100);
          return (
            <div key={g.name} className="bar-wrap">
              <div className="row"><span>{g.name}</span><span>{pct}%</span></div>
              <div className="bar"><i style={{ width: `${Math.min(pct, 100)}%` }} /></div>
            </div>
          );
        })}
      </section>
    </>
  );
}
