import { createClient } from "@/lib/supabase/server";
import { addGoal, depositGoal, deleteGoal } from "@/lib/actions";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Goals() {
  const { data } = await createClient().from("goals").select("*").order("created_at");

  return (
    <>
      <h1>Tujuan tabungan</h1>
      <form action={addGoal} className="panel form">
        <input name="name" placeholder="Nama tujuan (mis. Dana darurat)" required />
        <input name="target_amount" inputMode="numeric" placeholder="Target (Rp)" required />
        <input name="saved_amount" inputMode="numeric" placeholder="Sudah terkumpul (Rp)" />
        <input name="deadline" type="date" />
        <button>Buat</button>
      </form>
      <section className="panel">
        {(data ?? []).length === 0 && <p className="muted">Belum ada tujuan.</p>}
        {(data ?? []).map((g) => {
          const pct = Math.round((g.saved_amount / g.target_amount) * 100);
          return (
            <div key={g.id} className="bar-wrap">
              <div className="row">
                <span><b>{g.name}</b>{g.deadline ? ` · target ${g.deadline}` : ""}</span>
                <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><button className="ghost">Hapus</button></form>
              </div>
              <div className="bar"><i style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div className="row">
                <span className="muted">{rupiah(g.saved_amount)} dari {rupiah(g.target_amount)} ({pct}%)</span>
                <form action={depositGoal} className="inline">
                  <input type="hidden" name="id" value={g.id} />
                  <input name="amount" inputMode="numeric" placeholder="Setor (Rp)" required />
                  <button>Setor</button>
                </form>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
