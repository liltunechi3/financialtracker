import Link from "next/link";
import { keyOf, shiftMonth } from "@/lib/dashboard";

// Navigasi bulan berbasis URL; bekerja tanpa JavaScript di sisi klien.
export default function MonthPicker({ path, month }) {
  const href = (d) => `${path}?month=${keyOf(d)}`;
  const label = month.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return (
    <div className="monthpick">
      <Link href={href(shiftMonth(month, -1))} className="qbtn" aria-label="Bulan sebelumnya">‹</Link>
      <form action={path} className="inline">
        <input type="month" name="month" defaultValue={keyOf(month)} aria-label={`Bulan: ${label}`} />
        <button className="small">Tampilkan</button>
      </form>
      <Link href={href(shiftMonth(month, 1))} className="qbtn" aria-label="Bulan berikutnya">›</Link>
    </div>
  );
}
