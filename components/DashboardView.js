import Link from "next/link";
import Icon from "@/components/Icon";
import MonthPicker from "@/components/MonthPicker";
import { AreaChart, Donut, Bars, Ring, PALETTE } from "@/components/charts";
import { rupiah, daysUntil } from "@/lib/format";
import { payInstallment } from "@/lib/actions";

function Delta({ value, goodWhenUp }) {
  if (value === null) return <span className="muted">belum ada pembanding</span>;
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={good ? "pos" : "neg"}>
      {up ? "▲" : "▼"} {Math.abs(value)}% <span className="muted">vs bulan lalu</span>
    </span>
  );
}

function Stat({ icon, label, value, children }) {
  return (
    <div className="stat">
      <div className="stat-head"><span className="chip"><Icon name={icon} /></span>{label}</div>
      <b className="stat-value">{value}</b>
      <div className="stat-foot">{children}</div>
    </div>
  );
}

export default function DashboardView({ s, goals, budgets, due, debt, recent, month, canPay = true }) {
  const saved = goals.reduce((a, g) => a + Number(g.saved_amount), 0);
  const target = goals.reduce((a, g) => a + Number(g.target_amount), 0);
  const goalPct = target > 0 ? Math.round((saved / target) * 100) : 0;
  const expenseTotal = s.categories.reduce((a, c) => a + c.value, 0);
  const topCats = s.categories.slice(0, 5);
  const rest = s.categories.slice(5).reduce((a, c) => a + c.value, 0);
  const slices = rest > 0 ? [...topCats, { label: "Lainnya", value: rest }] : topCats;

  return (
    <>
      <header className="page-head">
        <div><h1>Ringkasan</h1><MonthPicker path="/dashboard" month={month} /></div>
        <div className="quick">
          <Link href="/transactions?type=income" className="qbtn"><Icon name="plus" /> Pemasukan</Link>
          <Link href="/transactions?type=expense" className="qbtn"><Icon name="minus" /> Pengeluaran</Link>
          <Link href="/loans" className="qbtn"><Icon name="bank" /> Pinjaman</Link>
        </div>
      </header>

      <section className="stats">
        <Stat icon="trend" label="Pemasukan" value={rupiah(s.income)}><Delta value={s.incomeChange} goodWhenUp /></Stat>
        <Stat icon="cart" label="Pengeluaran" value={rupiah(s.expense)}><Delta value={s.expenseChange} goodWhenUp={false} /></Stat>
        <Stat icon="piggy" label="Tabungan" value={rupiah(saved)}><span className="muted">{goals.length ? `${goalPct}% dari target ${rupiah(target)}` : "belum ada tujuan"}</span></Stat>
        <Stat icon="debt" label="Sisa pokok utang" value={rupiah(debt)}><span className="muted">{due.length ? `${due.length} cicilan berikutnya` : "tidak ada cicilan aktif"}</span></Stat>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head"><h2>Saldo bersih (akumulasi)</h2><span className="pill">6 bulan terakhir</span></div>
          <AreaChart data={s.balance} format={rupiah} />
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Ringkasan bulan ini</h2></div>
          <div className="ring-wrap">
            <Ring pct={s.savingsRate} label="Rasio sisa pemasukan" />
            <div>
              <div className="muted">Rasio sisa pemasukan</div>
              <b className={s.net >= 0 ? "pos" : "neg"}>{rupiah(s.net)}</b>
              <dl className="kv">
                <dt>Pemasukan</dt><dd>{rupiah(s.income)}</dd>
                <dt>Pengeluaran</dt><dd>{rupiah(s.expense)}</dd>
              </dl>
            </div>
          </div>
        </section>
      </div>

      <div className="grid-3">
        <section className="panel">
          <div className="panel-head"><h2>Pemasukan vs pengeluaran</h2></div>
          <Bars data={s.months} />
          <div className="legend"><span><i style={{ background: "var(--c1)" }} />Pemasukan</span><span><i style={{ background: "var(--c3)" }} />Pengeluaran</span></div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Sebaran pengeluaran</h2></div>
          {slices.length === 0 ? <p className="muted">Belum ada pengeluaran bulan ini.</p> : (
            <div className="donut-wrap">
              <Donut slices={slices} centerTop={rupiah(expenseTotal)} centerBottom="Total" />
              <ul className="legend-list">
                {slices.map((c, i) => (
                  <li key={c.label}><i style={{ background: PALETTE[i % PALETTE.length] }} />{c.label}<b>{Math.round((c.value / expenseTotal) * 100)}%</b></li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Cicilan jatuh tempo</h2><Link href="/loans">Semua</Link></div>
          {due.length === 0 && <p className="muted">Tidak ada cicilan aktif.</p>}
          {due.map((i) => {
            const d = daysUntil(i.due_date);
            return (
              <div className="row" key={i.id}>
                <div>
                  <b>{i.loans.name}</b> · ke-{i.installment_no}
                  <div className={d < 0 ? "neg" : d <= 3 ? "warn" : "muted"}>
                    {d < 0 ? `terlambat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`}
                  </div>
                </div>
                <div className="right">
                  <b>{rupiah(i.amount)}</b>
                  {canPay && <form action={payInstallment}><input type="hidden" name="id" value={i.id} /><button className="small">Bayar</button></form>}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head"><h2>Budget bulan ini</h2><Link href="/budgets">Atur</Link></div>
          {budgets.length === 0 && <p className="muted">Belum ada budget.</p>}
          {budgets.map((b) => {
            const spent = s.categories.find((c) => c.label === b.category)?.value ?? 0;
            const pct = Math.round((spent / b.monthly_limit) * 100);
            return (
              <div key={b.category} className="bar-wrap">
                <div className="row"><span>{b.category}</span><span className="muted">{rupiah(spent)} / {rupiah(b.monthly_limit)}</span></div>
                <div className="bar"><i className={pct > 100 ? "over" : pct >= 80 ? "near" : ""} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              </div>
            );
          })}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Tujuan tabungan</h2><Link href="/goals">Kelola</Link></div>
          {goals.length === 0 && <p className="muted">Belum ada tujuan.</p>}
          {goals.map((g) => {
            const pct = Math.round((g.saved_amount / g.target_amount) * 100);
            return (
              <div key={g.name} className="bar-wrap">
                <div className="row"><span>{g.name}</span><span className="muted">{pct}%</span></div>
                <div className="bar"><i style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Transaksi terbaru</h2><Link href="/transactions">Lihat semua</Link></div>
        {recent.length === 0 && <p className="muted">Belum ada transaksi.</p>}
        <div className="table">
          {recent.length > 0 && <div className="tx thead"><span>Tanggal</span><span>Catatan</span><span>Kategori</span><span className="num">Jumlah</span></div>}
          {recent.map((t) => (
            <div className="tx" key={t.id}>
              <span className="muted">{t.occurred_on}</span>
              <span>{t.note || "—"}</span>
              <span><em className="tag">{t.category}</em></span>
              <b className={`num ${t.type === "income" ? "pos" : "neg"}`}>{t.type === "income" ? "+" : "−"}{rupiah(t.amount)}</b>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
