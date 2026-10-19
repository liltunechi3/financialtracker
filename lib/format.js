const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const rupiah = (n) => idr.format(Number(n) || 0);

export const monthStart = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

export const today = () => new Date().toISOString().slice(0, 10);

export const daysUntil = (isoDate) =>
  Math.round((new Date(isoDate + "T00:00:00Z") - new Date(today() + "T00:00:00Z")) / 86400000);

export const CATEGORIES = {
  expense: ["Makan", "Transport", "Tagihan", "Belanja", "Kesehatan", "Hiburan", "Pendidikan", "Cicilan", "Lainnya"],
  income: ["Gaji", "Bonus", "Usaha", "Investasi", "Lainnya"],
};
