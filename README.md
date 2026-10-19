# Financial Tracker

Tracker keuangan pribadi: transaksi, budget bulanan, tujuan tabungan, dan pinjaman dengan jadwal cicilan.
Next.js 14 (App Router) + Supabase (Auth + Postgres + RLS).

## Fitur
- **Dashboard**: pemasukan/pengeluaran bulan ini, sisa pokok utang, cicilan jatuh tempo, progres budget & tabungan
- **Transaksi**: catat pemasukan/pengeluaran per kategori
- **Budget**: batas bulanan per kategori, bar hijau → kuning (≥80%) → merah (>100%)
- **Tabungan**: target, setoran, progres
- **Pinjaman**: anuitas atau flat, jadwal cicilan lengkap (pokok/bunga/sisa saldo), tanggal jatuh tempo menyesuaikan akhir bulan, tombol *Bayar* yang otomatis mencatat pengeluaran kategori "Cicilan"

## Setup
1. Buat project Supabase, jalankan `supabase/migrations/0001_init.sql` di SQL editor.
2. `cp .env.example .env.local` dan isi URL + anon key.
3. `npm install && npm run dev`
4. Daftar akun di `/login`. Karena ini untuk pemakaian pribadi, setelah akunmu jadi matikan pendaftaran:
   Supabase → Authentication → Sign In / Providers → matikan *Allow new users to sign up*.

## Test
`npm test` — logika amortisasi (`lib/amortization.js`).

## Deploy
Import repo ke Vercel, isi dua env var di atas.
