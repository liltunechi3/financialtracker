import "./globals.css";

export const metadata = { title: "Financial Tracker", description: "Catat keuangan, budget, tabungan, dan cicilan" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
