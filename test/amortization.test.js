import test from "node:test";
import assert from "node:assert/strict";
import { addMonths, buildSchedule, summarize } from "../lib/amortization.js";

const base = { principal: 12_000_000, tenor: 12, startDate: "2026-01-15", dueDay: 15 };

test("anuitas: pokok terbayar penuh dan saldo akhir 0", () => {
  const s = buildSchedule({ ...base, annualRatePct: 12, method: "annuity" });
  assert.equal(s.length, 12);
  assert.equal(s.reduce((a, r) => a + r.principal_part, 0), base.principal);
  assert.equal(s.at(-1).remaining_balance, 0);
});

test("anuitas 12% 12 bulan 12jt: cicilan ~1.066.185", () => {
  const s = buildSchedule({ ...base, annualRatePct: 12, method: "annuity" });
  assert.ok(Math.abs(s[0].amount - 1_066_185) <= 1);
});

test("anuitas bunga 0%: cicilan rata", () => {
  const s = buildSchedule({ ...base, annualRatePct: 0, method: "annuity" });
  assert.ok(s.every((r) => r.interest_part === 0 && r.amount === 1_000_000));
});

test("flat: total bunga = pokok x bunga x tahun", () => {
  const s = buildSchedule({ ...base, annualRatePct: 12, method: "flat" });
  assert.equal(summarize(s).interest, 1_440_000);
  assert.equal(s.at(-1).remaining_balance, 0);
});

test("pembulatan ke cicilan terakhir tetap menutup pokok", () => {
  const s = buildSchedule({ principal: 10_000_001, annualRatePct: 9.5, tenor: 7, method: "flat", startDate: "2026-03-31", dueDay: 31 });
  assert.equal(s.reduce((a, r) => a + r.principal_part, 0), 10_000_001);
});

test("tanggal jatuh tempo menyesuaikan akhir bulan", () => {
  assert.equal(addMonths("2026-01-31", 1, 31), "2026-02-28");
  assert.equal(addMonths("2028-01-31", 1, 31), "2028-02-29");
  assert.equal(addMonths("2026-11-30", 2, 30), "2027-01-30");
});

test("input tidak valid ditolak", () => {
  assert.throws(() => buildSchedule({ ...base, principal: 0, annualRatePct: 5, method: "annuity" }));
  assert.throws(() => buildSchedule({ ...base, tenor: 0, annualRatePct: 5, method: "annuity" }));
});
