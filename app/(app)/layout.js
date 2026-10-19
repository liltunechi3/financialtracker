import Link from "next/link";
import Icon from "@/components/Icon";
import { logout } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

const links = [
  ["/dashboard", "Ringkasan", "home"],
  ["/transactions", "Transaksi", "list"],
  ["/budgets", "Budget", "pie"],
  ["/goals", "Tabungan", "target"],
  ["/loans", "Pinjaman", "bank"],
];

export default async function AppLayout({ children }) {
  const { data: { user } } = await createClient().auth.getUser();
  const email = user?.email ?? "";

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="chip"><Icon name="trend" /></span><strong>FinTrack</strong></div>
        <nav className="menu">
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href}><Icon name={icon} />{label}</Link>
          ))}
        </nav>
        <div className="me">
          <span className="avatar">{email.slice(0, 1).toUpperCase()}</span>
          <span className="email">{email}</span>
          <form action={logout}><button className="icon-btn" title="Keluar" aria-label="Keluar"><Icon name="out" /></button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
