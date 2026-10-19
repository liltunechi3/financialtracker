// Jadwal cicilan. Semua nilai dalam rupiah, dibulatkan ke bilangan bulat;
// selisih pembulatan dibebankan ke cicilan terakhir supaya total pokok = principal.

export function addMonths(isoDate, months, dueDay) {
  const [y, m] = isoDate.split("-").map(Number);
  const idx = y * 12 + (m - 1) + months;
  const year = Math.floor(idx / 12);
  const month = idx % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function annuityPayment(principal, annualRatePct, tenor) {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / tenor;
  return (principal * r) / (1 - Math.pow(1 + r, -tenor));
}

/**
 * @param {{principal:number, annualRatePct:number, tenor:number,
 *          method:"annuity"|"flat", startDate:string, dueDay:number}} loan
 * startDate = tanggal pencairan (YYYY-MM-DD); cicilan pertama jatuh tempo bulan berikutnya.
 */
export function buildSchedule({ principal, annualRatePct, tenor, method, startDate, dueDay }) {
  if (!(principal > 0) || !Number.isInteger(tenor) || tenor < 1) {
    throw new Error("principal harus > 0 dan tenor bilangan bulat >= 1");
  }
  if (annualRatePct < 0) throw new Error("bunga tidak boleh negatif");

  const rows = [];
  let balance = principal;

  if (method === "flat") {
    const totalInterest = principal * (annualRatePct / 100) * (tenor / 12);
    const principalPer = Math.round(principal / tenor);
    const interestPer = Math.round(totalInterest / tenor);
    for (let i = 1; i <= tenor; i++) {
      const isLast = i === tenor;
      const p = isLast ? balance : principalPer;
      const interest = isLast ? Math.round(totalInterest) - interestPer * (tenor - 1) : interestPer;
      balance -= p;
      rows.push(row(i, startDate, dueDay, p, interest, balance));
    }
    return rows;
  }

  const r = annualRatePct / 100 / 12;
  const pmt = Math.round(annuityPayment(principal, annualRatePct, tenor));
  for (let i = 1; i <= tenor; i++) {
    const isLast = i === tenor;
    const interest = Math.round(balance * r);
    const p = isLast ? balance : Math.min(pmt - interest, balance);
    balance -= p;
    rows.push(row(i, startDate, dueDay, p, interest, balance));
  }
  return rows;
}

function row(no, startDate, dueDay, principalPart, interestPart, balance) {
  return {
    installment_no: no,
    due_date: addMonths(startDate, no, dueDay),
    principal_part: principalPart,
    interest_part: interestPart,
    amount: principalPart + interestPart,
    remaining_balance: balance,
  };
}

export function summarize(schedule) {
  const total = schedule.reduce((s, r) => s + r.amount, 0);
  const interest = schedule.reduce((s, r) => s + r.interest_part, 0);
  return { total, interest, monthly: schedule[0]?.amount ?? 0 };
}
