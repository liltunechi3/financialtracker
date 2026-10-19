"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildSchedule } from "@/lib/amortization";
import { today } from "@/lib/format";

const str = (fd, k) => String(fd.get(k) ?? "").trim();
const num = (fd, k) => Number(String(fd.get(k) ?? "").replace(/[^\d.]/g, ""));

async function db() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

function check(error) {
  if (error) throw new Error(error.message);
}

/* ---------- auth ---------- */

export async function login(_prev, fd) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: str(fd, "password") });
  if (error) return { error: "Email atau password salah." };
  redirect("/dashboard");
}

export async function signup(_prev, fd) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email: str(fd, "email"), password: str(fd, "password") });
  if (error) return { error: error.message };
  if (!data.session) return { info: "Cek email untuk konfirmasi, lalu login." };
  redirect("/dashboard");
}

export async function logout() {
  await createClient().auth.signOut();
  redirect("/login");
}

/* ---------- transaksi ---------- */

export async function addTransaction(fd) {
  const supabase = await db();
  const amount = num(fd, "amount");
  if (!(amount > 0)) return;
  check((await supabase.from("transactions").insert({
    type: str(fd, "type") === "income" ? "income" : "expense",
    amount,
    category: str(fd, "category") || "Lainnya",
    note: str(fd, "note") || null,
    occurred_on: str(fd, "occurred_on") || today(),
  })).error);
  revalidatePath("/", "layout");
}

export async function deleteTransaction(fd) {
  const supabase = await db();
  check((await supabase.from("transactions").delete().eq("id", str(fd, "id"))).error);
  revalidatePath("/", "layout");
}

/* ---------- budget ---------- */

export async function saveBudget(fd) {
  const supabase = await db();
  const limit = num(fd, "monthly_limit");
  const category = str(fd, "category");
  if (!category || !(limit > 0)) return;
  const { data: { user } } = await supabase.auth.getUser();
  check((await supabase.from("budgets").upsert(
    { user_id: user.id, category, monthly_limit: limit },
    { onConflict: "user_id,category" }
  )).error);
  revalidatePath("/", "layout");
}

export async function deleteBudget(fd) {
  const supabase = await db();
  check((await supabase.from("budgets").delete().eq("id", str(fd, "id"))).error);
  revalidatePath("/", "layout");
}

/* ---------- tujuan tabungan ---------- */

export async function addGoal(fd) {
  const supabase = await db();
  const target = num(fd, "target_amount");
  if (!str(fd, "name") || !(target > 0)) return;
  check((await supabase.from("goals").insert({
    name: str(fd, "name"),
    target_amount: target,
    saved_amount: num(fd, "saved_amount") || 0,
    deadline: str(fd, "deadline") || null,
  })).error);
  revalidatePath("/", "layout");
}

export async function depositGoal(fd) {
  const supabase = await db();
  const add = num(fd, "amount");
  if (!(add > 0)) return;
  const { data: goal } = await supabase.from("goals").select("saved_amount").eq("id", str(fd, "id")).single();
  if (!goal) return;
  check((await supabase.from("goals").update({ saved_amount: Number(goal.saved_amount) + add }).eq("id", str(fd, "id"))).error);
  revalidatePath("/", "layout");
}

export async function deleteGoal(fd) {
  const supabase = await db();
  check((await supabase.from("goals").delete().eq("id", str(fd, "id"))).error);
  revalidatePath("/", "layout");
}

/* ---------- pinjaman & cicilan ---------- */

export async function createLoan(fd) {
  const supabase = await db();
  const loan = {
    name: str(fd, "name"),
    lender: str(fd, "lender") || null,
    principal: num(fd, "principal"),
    annual_rate: num(fd, "annual_rate"),
    tenor_months: Math.trunc(num(fd, "tenor_months")),
    method: str(fd, "method") === "flat" ? "flat" : "annuity",
    start_date: str(fd, "start_date") || today(),
    due_day: Math.min(31, Math.max(1, Math.trunc(num(fd, "due_day")) || 1)),
  };
  if (!loan.name || !(loan.principal > 0) || !(loan.tenor_months >= 1)) return;

  const schedule = buildSchedule({
    principal: loan.principal,
    annualRatePct: loan.annual_rate,
    tenor: loan.tenor_months,
    method: loan.method,
    startDate: loan.start_date,
    dueDay: loan.due_day,
  });

  const { data, error } = await supabase.from("loans").insert(loan).select("id").single();
  check(error);
  const { error: e2 } = await supabase.from("loan_installments").insert(
    schedule.map((r) => ({ ...r, loan_id: data.id }))
  );
  if (e2) {
    await supabase.from("loans").delete().eq("id", data.id); // jangan tinggalkan pinjaman tanpa jadwal
    throw new Error(e2.message);
  }
  revalidatePath("/", "layout");
  redirect(`/loans/${data.id}`);
}

export async function deleteLoan(fd) {
  const supabase = await db();
  check((await supabase.from("loans").delete().eq("id", str(fd, "id"))).error);
  revalidatePath("/", "layout");
  redirect("/loans");
}

// Menandai lunas sekaligus mencatat pengeluaran kategori "Cicilan".
export async function payInstallment(fd) {
  const supabase = await db();
  const id = str(fd, "id");
  const { data: inst } = await supabase
    .from("loan_installments")
    .select("amount, installment_no, paid_on, loans(name)")
    .eq("id", id)
    .single();
  if (!inst || inst.paid_on) return;

  const { data: updated, error } = await supabase
    .from("loan_installments")
    .update({ paid_on: today() })
    .eq("id", id)
    .is("paid_on", null)
    .select("id");
  check(error);
  if (!updated?.length) return; // sudah dibayar oleh request lain

  check((await supabase.from("transactions").insert({
    type: "expense",
    amount: inst.amount,
    category: "Cicilan",
    note: `${inst.loans.name} — cicilan ke-${inst.installment_no}`,
    occurred_on: today(),
  })).error);
  revalidatePath("/", "layout");
}
