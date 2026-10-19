const paths = {
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  pie: "M21 12A9 9 0 1112 3v9h9z",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z",
  bank: "M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  cart: "M6 6h15l-2 9H8L6 3H3M9 20h.01M18 20h.01",
  wallet: "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h12M16 14h.01",
  debt: "M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  piggy: "M19 11c0-3-3-5-7-5S5 8 5 11c0 2 1 3.5 2.5 4.5V19h3v-1.5h3V19h3v-3.5c1.5-.8 2.5-2.3 2.5-4.5zM15 10h.01M2 10c1 0 2 1 3 2",
  out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  up: "M7 17L17 7M8 7h9v9",
  down: "M7 7l10 10M17 8v9H8",
};

export default function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
