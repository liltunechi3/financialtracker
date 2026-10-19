import Link from "next/link";
import { logout } from "@/lib/actions";

const links = [
  ["/dashboard", "Dashboard"],
  ["/transactions", "Transaksi"],
  ["/budgets", "Budget"],
  ["/goals", "Tabungan"],
  ["/loans", "Pinjaman"],
];

export default function AppLayout({ children }) {
  return (
    <div className="shell">
      <nav className="nav">
        <strong>💰 FinTrack</strong>
        {links.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
        <form action={logout} className="push"><button className="ghost">Keluar</button></form>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
