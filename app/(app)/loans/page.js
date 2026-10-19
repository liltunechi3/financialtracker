import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLoan } from "@/lib/actions";
import { rupiah, today } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Loans() {
  const supabase = createClient();
  const [loans, inst] = await Promise.all([
    supabase.from("loans").select("*").order("created_at"),
    supabase.from("loan_installments").select("loan_id, principal_part, paid_on"),
  ]);
  const stat = {};
  (inst.data ?? []).forEach((i) => {
    const s = (stat[i.loan_id] ??= { left: 0, paid: 0, total: 0 });
    s.total++;
    if (i.paid_on) s.paid++; else s.left += Number(i.principal_part);
  });

  return (
    <>
      <h1>Pinjaman & cicilan</h1>
      <form action={createLoan} className="panel form">
        <input name="name" placeholder="Nama (mis. KPR, Motor, Paylater)" required />
        <input name="lender" placeholder="Pemberi pinjaman (opsional)" />
        <input name="principal" inputMode="numeric" placeholder="Pokok pinjaman (Rp)" required />
        <input name="annual_rate" inputMode="decimal" placeholder="Bunga per tahun (%)" required />
        <input name="tenor_months" inputMode="numeric" placeholder="Tenor (bulan)" required />
        <select name="method" defaultValue="annuity">
          <option value="annuity">Anuitas (bunga menurun)</option>
          <option value="flat">Flat</option>
        </select>
        <label>Tanggal cair <input name="start_date" type="date" defaultValue={today()} /></label>
        <input name="due_day" inputMode="numeric" placeholder="Tanggal jatuh tempo (1-31)" required />
        <button>Buat jadwal cicilan</button>
      </form>

      <section className="panel">
        {(loans.data ?? []).length === 0 && <p className="muted">Belum ada pinjaman.</p>}
        {(loans.data ?? []).map((l) => {
          const s = stat[l.id] ?? { left: 0, paid: 0, total: l.tenor_months };
          return (
            <Link key={l.id} href={`/loans/${l.id}`} className="row linkrow">
              <div>
                <b>{l.name}</b>{l.lender ? ` · ${l.lender}` : ""}
                <div className="muted">{s.paid}/{s.total} cicilan · {l.annual_rate}% {l.method === "flat" ? "flat" : "anuitas"}</div>
              </div>
              <div className="right"><b>{rupiah(s.left)}</b><span className="muted">sisa pokok</span></div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
