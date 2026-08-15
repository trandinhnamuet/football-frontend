'use client';

/** Mảnh giao diện dùng chung cho các màn hình thống kê trong /admin. */

export const nf = new Intl.NumberFormat('vi-VN');

/** Intl compact tiếng Việt cho ra "1 N" (nghìn) — khó đọc trên trục. Dùng "k". */
export function axisTick(value: number) {
  if (value >= 1000) return `${(value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}k`;
  return nf.format(value);
}

export function duration(seconds: number) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** "2026-08-16" -> "16/08" */
export function dayLabel(iso: string) {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

export function Delta({
  current,
  previous,
  vs,
  lowerIsBetter = false,
}: {
  current: number;
  previous: number;
  vs: string;
  lowerIsBetter?: boolean;
}) {
  if (!previous) {
    return (
      <div className="an-delta">
        <span>—</span>
        <span className="an-vs">chưa có dữ liệu kỳ trước</span>
      </div>
    );
  }
  const change = (current - previous) / previous;
  const rising = change > 0;
  const good = lowerIsBetter ? !rising : rising;
  const flat = Math.abs(change) < 0.005;

  return (
    <div className={`an-delta ${flat ? '' : good ? 'up' : 'down'}`}>
      <span>
        {flat ? '±' : rising ? '↑' : '↓'} {Math.abs(change * 100).toFixed(1)}%
      </span>
      <span className="an-vs">so với {vs}</span>
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  current,
  previous,
  vs,
  lowerIsBetter,
}: {
  label: string;
  value: string;
  /** Dòng chú thích tĩnh, dùng khi ô này không có kỳ trước để so. */
  hint?: string;
  current?: number;
  previous?: number;
  vs?: string;
  lowerIsBetter?: boolean;
}) {
  return (
    <div className="an-kpi">
      <div className="an-kpi-label">{label}</div>
      <div className="an-kpi-value">{value}</div>
      {vs !== undefined && current !== undefined && previous !== undefined ? (
        <Delta current={current} previous={previous} vs={vs} lowerIsBetter={lowerIsBetter} />
      ) : (
        hint && <div className="an-delta"><span className="an-vs">{hint}</span></div>
      )}
    </div>
  );
}

export interface BarRow {
  label: string;
  sub?: string;
  value: number;
}

export function BarList({ rows, unit }: { rows: BarRow[]; unit: string }) {
  if (rows.length === 0) return <div className="an-empty">Chưa có dữ liệu trong kỳ này</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <div className="an-bars">
      {rows.map((row) => (
        <div
          key={row.label + (row.sub ?? '')}
          className="an-bar"
          style={{ ['--an-bar-w' as string]: `${(row.value / max) * 100}%` }}
        >
          <div className="an-bar-label">
            {row.label}
            {row.sub && <small>{row.sub}</small>}
          </div>
          <div className="an-bar-value">
            {nf.format(row.value)} {unit}
            {total > 0 && <em>{Math.round((row.value / total) * 100)}%</em>}
          </div>
        </div>
      ))}
    </div>
  );
}
