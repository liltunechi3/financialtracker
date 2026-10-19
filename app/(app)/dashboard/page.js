import { createClient } from "@/lib/supabase/server";
import DashboardView from "@/components/DashboardView";
import { summarize, sixMonthsAgoStart } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const now = new Date();

  const [tx, budgets, goals, due, remaining] = await Promise.all([
    supabase.from("transactions").select("id, type, amount, category, note, occurred_on")
      .gte("occurred_on", sixMonthsAgoStart(now)).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("budgets").select("category, monthly_limit").order("category"),
    supabase.from("goals").select("name, target_amount, saved_amount").order("created_at"),
    supabase.from("loan_installments")
      .select("id, due_date, amount, installment_no, loans(name)")
      .is("paid_on", null).order("due_date").limit(4),
    supabase.from("loan_installments").select("principal_part").is("paid_on", null),
  ]);

  const transactions = tx.data ?? [];
  return (
    <DashboardView
      s={summarize(transactions, now)}
      goals={goals.data ?? []}
      budgets={budgets.data ?? []}
      due={due.data ?? []}
      debt={(remaining.data ?? []).reduce((a, r) => a + Number(r.principal_part), 0)}
      recent={transactions.slice(0, 6)}
      monthLabel={now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
    />
  );
}
