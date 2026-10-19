const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const monthKey = (y, m0) => `${y}-${String(m0 + 1).padStart(2, "0")}`;

// 6 bulan terakhir (termasuk bulan ini), terlama dulu.
export function lastMonths(now = new Date(), n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { key: monthKey(d.getFullYear(), d.getMonth()), label: MONTHS[d.getMonth()] };
  });
}

export const sixMonthsAgoStart = (now = new Date()) => {
  const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return `${monthKey(d.getFullYear(), d.getMonth())}-01`;
};

const pctChange = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

export function summarize(transactions, now = new Date()) {
  const months = lastMonths(now).map((m) => ({ ...m, income: 0, expense: 0 }));
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]));
  const expenseByCategory = {};
  const thisKey = months.at(-1).key;

  for (const t of transactions) {
    const m = byKey[t.occurred_on.slice(0, 7)];
    if (!m) continue;
    const amt = Number(t.amount);
    if (t.type === "income") m.income += amt;
    else {
      m.expense += amt;
      if (m.key === thisKey) expenseByCategory[t.category] = (expenseByCategory[t.category] ?? 0) + amt;
    }
  }

  let running = 0;
  const balance = months.map((m) => ({ label: m.label, value: (running += m.income - m.expense) }));
  const cur = months.at(-1), prev = months.at(-2);
  const categories = Object.entries(expenseByCategory)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    months,
    balance,
    categories,
    income: cur.income,
    expense: cur.expense,
    net: cur.income - cur.expense,
    incomeChange: pctChange(cur.income, prev.income),
    expenseChange: pctChange(cur.expense, prev.expense),
    savingsRate: cur.income > 0 ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : 0,
  };
}

/* ---------- pilihan bulan (?month=YYYY-MM) ---------- */

// Mengembalikan tanggal 1 bulan terpilih; parameter tak valid jatuh ke bulan ini.
export function parseMonth(param, now = new Date()) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(param ?? "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
}

export const shiftMonth = (ref, delta) => new Date(ref.getFullYear(), ref.getMonth() + delta, 1);

export const keyOf = (d) => monthKey(d.getFullYear(), d.getMonth());

// [awal, awal bulan berikutnya) sebagai string tanggal, untuk filter .gte/.lt
export function monthRange(ref) {
  return { from: `${keyOf(ref)}-01`, to: `${keyOf(shiftMonth(ref, 1))}-01` };
}
