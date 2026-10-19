import test from "node:test";
import assert from "node:assert/strict";
import { summarize, lastMonths } from "../lib/dashboard.js";

const now = new Date(2026, 9, 19); // 19 Okt 2026

test("lastMonths: 6 bulan berakhir di bulan ini, lintas tahun benar", () => {
  const m = lastMonths(new Date(2026, 1, 10));
  assert.deepEqual(m.map((x) => x.key), ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"]);
});

test("summarize: total bulan ini, perubahan vs bulan lalu, saldo kumulatif", () => {
  const s = summarize([
    { type: "income", amount: 1000, category: "Gaji", occurred_on: "2026-09-25" },
    { type: "expense", amount: 400, category: "Makan", occurred_on: "2026-09-26" },
    { type: "income", amount: 1500, category: "Gaji", occurred_on: "2026-10-01" },
    { type: "expense", amount: 300, category: "Makan", occurred_on: "2026-10-02" },
    { type: "expense", amount: 100, category: "Hiburan", occurred_on: "2026-10-03" },
    { type: "expense", amount: 999, category: "Makan", occurred_on: "2025-01-01" }, // di luar jendela
  ], now);
  assert.equal(s.income, 1500);
  assert.equal(s.expense, 400);
  assert.equal(s.incomeChange, 50);
  assert.equal(s.expenseChange, 0);
  assert.equal(s.savingsRate, 73);
  assert.deepEqual(s.categories, [{ label: "Makan", value: 300 }, { label: "Hiburan", value: 100 }]);
  assert.equal(s.balance.at(-1).value, 600 + 1100);
});

test("summarize: tanpa data tidak error", () => {
  const s = summarize([], now);
  assert.equal(s.income, 0);
  assert.equal(s.incomeChange, null);
  assert.equal(s.savingsRate, 0);
});

import { parseMonth, shiftMonth, keyOf, monthRange } from "../lib/dashboard.js";

test("parseMonth: valid, tidak valid, dan default", () => {
  assert.equal(keyOf(parseMonth("2026-11")), "2026-11");
  assert.equal(keyOf(parseMonth("2026-13", now)), "2026-10");
  assert.equal(keyOf(parseMonth("abc", now)), "2026-10");
  assert.equal(keyOf(parseMonth(undefined, now)), "2026-10");
});

test("shiftMonth & monthRange lintas tahun", () => {
  assert.equal(keyOf(shiftMonth(parseMonth("2026-12"), 1)), "2027-01");
  assert.equal(keyOf(shiftMonth(parseMonth("2026-01"), -1)), "2025-12");
  assert.deepEqual(monthRange(parseMonth("2026-12")), { from: "2026-12-01", to: "2027-01-01" });
});

test("summarize memakai bulan terpilih sebagai bulan akhir", () => {
  const s = summarize([
    { type: "income", amount: 700, category: "Gaji", occurred_on: "2026-11-02" },
    { type: "expense", amount: 200, category: "Makan", occurred_on: "2026-11-03" },
  ], parseMonth("2026-11"));
  assert.equal(s.months.at(-1).key, "2026-11");
  assert.equal(s.income, 700);
  assert.equal(s.expense, 200);
});
