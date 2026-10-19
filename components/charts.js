export const PALETTE = ["#5b57c9", "#8b87e0", "#b7b4ee", "#2fb386", "#f2a33a", "#e5646e", "#5ab0e6", "#a0a7b8"];

const compact = (n) => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `${+(a / 1e9).toFixed(1)}M` : a >= 1e6 ? `${+(a / 1e6).toFixed(1)}jt` : a >= 1e3 ? `${Math.round(a / 1e3)}rb` : `${Math.round(a)}`;
  return (n < 0 ? "-" : "") + s;
};

// Kurva halus (Catmull-Rom → Bezier) lewat titik-titik.
function smooth(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function AreaChart({ data, format }) {
  const W = 620, H = 250, L = 48, R = 16, T = 48, B = 28;
  const vals = data.map((d) => d.value);
  let min = Math.min(0, ...vals), max = Math.max(0, ...vals);
  if (max === min) max = min + 1;
  const x = (i) => L + (i * (W - L - R)) / Math.max(data.length - 1, 1);
  const y = (v) => T + ((max - v) / (max - min)) * (H - T - B);
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = smooth(pts);
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, 1, 2, 3].map((i) => max - ((max - min) * i) / 3);
  const last = data.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Grafik saldo bersih per bulan">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--c1)" stopOpacity=".35" />
          <stop offset="100%" stopColor="var(--c1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" className="axis">{compact(t)}</text>
        </g>
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="var(--c1)" strokeWidth="2.5" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <text x={x(i)} y={H - 6} textAnchor="middle" className="axis">{d.label}</text>
          <circle cx={x(i)} cy={y(d.value)} r={i === last ? 5 : 3} fill="var(--card)" stroke="var(--c1)" strokeWidth="2">
            <title>{`${d.label}: ${format(d.value)}`}</title>
          </circle>
        </g>
      ))}
      {data.length > 0 && (
        <g transform={`translate(${Math.min(Math.max(x(last), 70), W - 70)},${y(data[last].value) - 14})`}>
          <rect x="-56" y="-22" width="112" height="22" rx="6" fill="#2a2d5c" />
          <text x="0" y="-7" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">{format(data[last].value)}</text>
        </g>
      )}
    </svg>
  );
}

export function Donut({ slices, centerTop, centerBottom }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Komposisi pengeluaran">
      <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="18" />
      {total > 0 && slices.map((s, i) => {
        const len = (s.value / total) * C;
        const el = (
          <circle key={s.label} cx="70" cy="70" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]}
            strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)">
            <title>{s.label}</title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" className="donut-top">{centerTop}</text>
      <text x="70" y="84" textAnchor="middle" className="axis">{centerBottom}</text>
    </svg>
  );
}

export function Bars({ data }) {
  const W = 360, H = 190, L = 34, T = 10, B = 24;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const slot = (W - L) / data.length;
  const bw = Math.min(14, slot / 3);
  const h = (v) => (v / max) * (H - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Pemasukan dan pengeluaran per bulan">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} x2={W} y1={H - B - f * (H - T - B)} y2={H - B - f * (H - T - B)} className="grid" />
          <text x={L - 6} y={H - B - f * (H - T - B) + 4} textAnchor="end" className="axis">{compact(max * f)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = L + slot * i + slot / 2;
        return (
          <g key={d.label}>
            <rect x={cx - bw - 1} y={H - B - h(d.income)} width={bw} height={h(d.income)} rx="3" fill="var(--c1)"><title>{`${d.label} pemasukan`}</title></rect>
            <rect x={cx + 1} y={H - B - h(d.expense)} width={bw} height={h(d.expense)} rx="3" fill="var(--c3)"><title>{`${d.label} pengeluaran`}</title></rect>
            <text x={cx} y={H - 6} textAnchor="middle" className="axis">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Ring({ pct, label }) {
  const R = 44, C = 2 * Math.PI * R;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg viewBox="0 0 120 120" className="ring" role="img" aria-label={`${label} ${p}%`}>
      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />
      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--c1)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${(p / 100) * C} ${C}`} transform="rotate(-90 60 60)" />
      <text x="60" y="66" textAnchor="middle" className="ring-text">{p}%</text>
    </svg>
  );
}
