import { createClient } from "@/lib/supabase/server";
import { addTransaction, deleteTransaction } from "@/lib/actions";
import { rupiah, today, CATEGORIES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Transactions({ searchParams }) {
  const type = searchParams?.type === "income" ? "income" : "expense";
  const { data } = await createClient()
    .from("transactions").select("*")
    .order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(100);

  return (
    <>
      <h1>Transaksi</h1>
      <form action={addTransaction} className="panel form">
        <select name="type" defaultValue={type}>
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
        <input name="amount" inputMode="numeric" placeholder="Jumlah (Rp)" required />
        <select name="category">
          {[...new Set([...CATEGORIES.expense, ...CATEGORIES.income])].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input name="note" placeholder="Catatan (opsional)" />
        <input name="occurred_on" type="date" defaultValue={today()} />
        <button>Tambah</button>
      </form>

      <section className="panel">
        {(data ?? []).length === 0 && <p className="muted">Belum ada transaksi.</p>}
        {(data ?? []).map((t) => (
          <div className="row" key={t.id}>
            <div>
              <b>{t.category}</b>{t.note ? ` · ${t.note}` : ""}
              <div className="muted">{t.occurred_on}</div>
            </div>
            <div className="right">
              <b className={t.type === "income" ? "pos" : "neg"}>{t.type === "income" ? "+" : "−"}{rupiah(t.amount)}</b>
              <form action={deleteTransaction}><input type="hidden" name="id" value={t.id} /><button className="ghost">Hapus</button></form>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
