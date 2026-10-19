import { createClient } from "@/lib/supabase/server";
import { saveBudget, deleteBudget } from "@/lib/actions";
import { rupiah, CATEGORIES } from "@/lib/format";
import MonthPicker from "@/components/MonthPicker";
import { parseMonth, monthRange } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Budgets({ searchParams }) {
  const supabase = createClient();
  const ref = parseMonth(searchParams?.month);
  const { from, to } = monthRange(ref);
  const [budgets, tx] = await Promise.all([
    supabase.from("budgets").select("*").order("category"),
    supabase.from("transactions").select("category, amount").eq("type", "expense").gte("occurred_on", from).lt("occurred_on", to),
  ]);
  const spentBy = {};
  (tx.data ?? []).forEach((r) => { spentBy[r.category] = (spentBy[r.category] ?? 0) + Number(r.amount); });

  return (
    <>
      <h1>Budget bulanan</h1>
      <MonthPicker path="/budgets" month={ref} />
      <form action={saveBudget} className="panel form">
        <select name="category">{CATEGORIES.expense.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="monthly_limit" inputMode="numeric" placeholder="Batas per bulan (Rp)" required />
        <button>Simpan</button>
      </form>
      <section className="panel">
        {(budgets.data ?? []).length === 0 && <p className="muted">Belum ada budget.</p>}
        {(budgets.data ?? []).map((b) => {
          const spent = spentBy[b.category] ?? 0;
          const pct = Math.round((spent / b.monthly_limit) * 100);
          return (
            <div key={b.id} className="bar-wrap">
              <div className="row">
                <span><b>{b.category}</b> · sisa {rupiah(Math.max(b.monthly_limit - spent, 0))}</span>
                <form action={deleteBudget}><input type="hidden" name="id" value={b.id} /><button className="ghost">Hapus</button></form>
              </div>
              <div className="bar"><i className={pct > 100 ? "over" : pct >= 80 ? "near" : ""} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div className="muted">{rupiah(spent)} dari {rupiah(b.monthly_limit)} ({pct}%)</div>
            </div>
          );
        })}
      </section>
    </>
  );
}
