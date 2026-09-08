'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTableSort } from '../../lib/useTableSort';
import Link from 'next/link';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminGuard from '../../components/AdminGuard';
import {
  BarList,
  Kpi,
  axisTick,
  dateTimeFmt,
  dayLabel,
  nf,
  stampFmt,
  timeFmt,
} from '../../components/admin/StatsUi';
import type { VisitRange, VisitStats } from '../../lib/visits';
import '../analytics/analytics.css';
import './visitors.css';

const KEY = 'lffc_admin_pw';

const RANGES: { key: VisitRange; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: '28d', label: '28 ngày' },
  { key: '90d', label: '90 ngày' },
  { key: 'all', label: 'Tất cả' },
];

const SERIES = [
  { key: 'visits', label: 'Lượt truy cập', color: 'var(--an-series-1)' },
  { key: 'visitors', label: 'Khách duy nhất', color: 'var(--an-series-2)' },
] as const;

/** visitor_id là UUID 36 ký tự, dài quá thì bảng không đọc nổi — lấy 8 ký tự đầu. */
const shortId = (id: string) => id.slice(0, 8);

/** Mọi tham số của một lượt gọi /api/visitors. */
interface LoadArgs {
  range: VisitRange;
  page: number;
  /** Ô tìm của bảng "Từng lượt truy cập". */
  q: string;
  /** Ô tìm của bảng "Khách quay lại nhiều nhất". */
  vq: string;
  /** Ngày đầu của bộ lọc bảng khách quay lại (YYYY-MM-DD, rỗng là không lọc). */
  vfrom: string;
  /** Ngày cuối của bộ lọc đó, bao gồm cả ngày này. */
  vto: string;
}

/** 'YYYY-MM-DD' → '06/09/2026' */
function dayVi(day: string): string {
  const [y, m, d] = day.split('-');
  return d && m && y ? `${d}/${m}/${y}` : day;
}

/** Hôm nay theo giờ máy người dùng, dạng YYYY-MM-DD cho input type=date. */
function todayValue(): string {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

/** Referrer chỉ cần biết đến từ đâu, không cần cả query string. */
function refLabel(ref: string | null) {
  if (!ref) return null;
  try {
    const url = new URL(ref);
    return url.hostname + (url.pathname !== '/' ? url.pathname : '');
  } catch {
    return ref;
  }
}

interface TooltipPayload {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tip">
      <div className="an-tip-date">{label ? dayLabel(String(label)) : ''}</div>
      {payload.map((item) => {
        const series = SERIES.find((s) => s.key === item.dataKey);
        return (
          <div key={String(item.dataKey)} className="an-tip-row">
            <span style={{ color: item.color }}>
              <i />
              <span style={{ color: 'var(--ink)' }}>{series?.label ?? String(item.dataKey)}</span>
            </span>
            <b>{nf.format(item.value ?? 0)}</b>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function VisitorsScreen() {
  const [range, setRange] = useState<VisitRange>('7d');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Bảng "Khách quay lại nhiều nhất" có bộ lọc riêng, độc lập với chip thời gian.
  const [vSearch, setVSearch] = useState('');
  const [vFrom, setVFrom] = useState('');
  const [vTo, setVTo] = useState('');
  const [data, setData] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (args: LoadArgs) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ range: args.range, page: String(args.page) });
      if (args.q.trim()) params.set('q', args.q.trim());
      if (args.vq.trim()) params.set('vq', args.vq.trim());
      if (args.vfrom) params.set('vfrom', args.vfrom);
      if (args.vto) params.set('vto', args.vto);
      const res = await fetch(`/api/visitors?${params}`, {
        cache: 'no-store',
        headers: { 'x-admin-password': localStorage.getItem(KEY) || '' },
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(KEY);
          window.dispatchEvent(new CustomEvent('admin-unauthorized'));
          return;
        }
        setError(body.error || `Lỗi ${res.status}`);
        setData(null);
        return;
      }
      setData(body as VisitStats);
    } catch {
      setError('Không gọi được API. Kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Gom mọi tham số đang chọn để mỗi lần gọi API là một ảnh chụp đầy đủ.
  function currentArgs(): LoadArgs {
    return { range, page, q: search, vq: vSearch, vfrom: vFrom, vto: vTo };
  }

  useEffect(() => {
    load({ range: '7d', page: 1, q: '', vq: '', vfrom: '', vto: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gõ tới đâu tìm tới đó, nhưng đợi 400ms cho người dùng gõ xong đã.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearch(value: string) {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      load({ ...currentArgs(), page: 1, q: value });
    }, 400);
  }

  // Ô tìm của bảng khách quay lại — cũng chờ 400ms, dùng timer riêng để hai ô
  // tìm không huỷ lượt gọi của nhau.
  const vDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onVisitorSearch(value: string) {
    setVSearch(value);
    if (vDebounce.current) clearTimeout(vDebounce.current);
    vDebounce.current = setTimeout(() => {
      load({ ...currentArgs(), vq: value });
    }, 400);
  }

  function setVisitorDay(which: 'from' | 'to', value: string) {
    const next = { vfrom: which === 'from' ? value : vFrom, vto: which === 'to' ? value : vTo };
    if (which === 'from') setVFrom(value);
    else setVTo(value);
    load({ ...currentArgs(), ...next });
  }

  /** Chọn nhanh một ngày: đặt cả hai đầu về đúng ngày đó. */
  function pickVisitorDay(day: string) {
    setVFrom(day);
    setVTo(day);
    load({ ...currentArgs(), vfrom: day, vto: day });
  }

  function clearVisitorFilter() {
    setVSearch('');
    setVFrom('');
    setVTo('');
    if (vDebounce.current) clearTimeout(vDebounce.current);
    load({ ...currentArgs(), vq: '', vfrom: '', vto: '' });
  }

  function pickRange(key: VisitRange) {
    setRange(key);
    setPage(1);
    load({ ...currentArgs(), range: key, page: 1 });
  }

  function goPage(next: number) {
    setPage(next);
    load({ ...currentArgs(), page: next });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.recentTotal / data.pageSize)) : 1;

  // Sort chạy trên dữ liệu đang hiển thị: bảng "Khách quay lại" là top 20 của kỳ,
  // bảng "Từng lượt truy cập" là trang hiện tại (mỗi trang một lần sort).
  const top = useTableSort(data?.topVisitors ?? [], {
    visitorId: v => v.visitorId,
    visits: v => v.visits,
    lastIp: v => v.lastIp,
    device: v => v.device,
    firstSeen: v => v.firstSeen,
    lastSeen: v => v.lastSeen,
    lastPath: v => v.lastPath,
  });

  const recent = useTableSort(data?.recent ?? [], {
    createdAt: v => v.createdAt,
    ip: v => v.ip,
    visitorId: v => v.visitorId,
    path: v => v.path,
    device: v => `${v.device || ''} ${v.browser || ''} ${v.os || ''}`,
    referrer: v => refLabel(v.referrer) || '',
    screen: v => v.screen,
  });

  return (
    <div className="an-root">
      <div className="an-wrap">
        <header className="an-head">
          <div>
            <h1>Nhật ký truy cập</h1>
            <div className="an-sub">
              Dữ liệu tự thu thập, lưu trên máy chủ của mình — không qua Google, không bị ad-blocker chặn
              {data && ` · cập nhật ${timeFmt.format(new Date(data.updatedAt))}`}
            </div>
          </div>
          <div className="an-head-actions">
            <Link className="an-btn" href="/admin/analytics">
              Xem thống kê GA4
            </Link>
            <button className="an-btn" onClick={() => load(currentArgs())} disabled={loading}>
              {loading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </header>

        {error && (
          <div className="an-banner">
            <strong>Không lấy được số liệu.</strong> {error}
          </div>
        )}

        <div className="an-filters">
          {RANGES.map((item) => (
            <button
              key={item.key}
              className="an-chip"
              aria-pressed={item.key === range}
              onClick={() => pickRange(item.key)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        {!data && !error && <div className="an-skeleton" style={{ height: 340 }} />}

        {data && (
          <>
            <div className="an-kpis">
              <Kpi label="Lượt truy cập" value={nf.format(data.summary.visits)} hint="tổng số trang được mở" />
              <Kpi label="Khách duy nhất" value={nf.format(data.summary.visitors)} hint="đếm theo visitor ID" />
              <Kpi label="Địa chỉ IP" value={nf.format(data.summary.ips)} hint="số IP khác nhau" />
              <Kpi label="Phiên" value={nf.format(data.summary.sessions)} hint="mỗi tab một phiên" />
              <Kpi label="Khách mới" value={nf.format(data.summary.newVisitors)} hint="lần đầu vào site" />
              <Kpi label="Lượt quay lại" value={nf.format(data.summary.returningVisits)} hint="khách đã từng vào" />
            </div>

            <div className="an-card" style={{ marginBottom: 12 }}>
              <h2>Diễn biến theo ngày</h2>
              <div className="an-hint">
                {data.daily.length < 2
                  ? 'Mới có dữ liệu của một ngày — cần từ hai ngày trở lên mới vẽ được đường'
                  : 'Một khách có thể tạo nhiều lượt truy cập'}
              </div>
              <div className="an-legend">
                {SERIES.map((series) => (
                  <span key={series.key} style={{ color: series.color }}>
                    <i />
                    <span style={{ color: 'var(--ink)' }}>{series.label}</span>
                  </span>
                ))}
              </div>
              <div className="an-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily} margin={{ top: 6, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={dayLabel}
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--line)' }}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={axisTick}
                      width={56}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--line)' }} />
                    {SERIES.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke={series.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="an-grid">
              <div className="an-card">
                <h2>Trang được mở nhiều nhất</h2>
                <div className="an-hint">Top 10 theo lượt truy cập</div>
                <BarList rows={data.topPaths.map((p) => ({ label: p.name, value: p.value }))} unit="lượt" />
              </div>
              <div className="an-card">
                <h2>Nguồn giới thiệu</h2>
                <div className="an-hint">Trang đưa khách sang</div>
                <BarList
                  rows={data.topReferrers.map((r) => ({ label: refLabel(r.name) || r.name, value: r.value }))}
                  unit="lượt"
                />
              </div>
            </div>

            <div className="an-grid">
              <div className="an-card">
                <h2>Thiết bị</h2>
                <div className="an-hint">Suy từ user-agent</div>
                <BarList rows={data.devices.map((d) => ({ label: d.name, value: d.value }))} unit="lượt" />
              </div>
              <div className="an-card">
                <h2>Trình duyệt</h2>
                <div className="an-hint">Top 8</div>
                <BarList rows={data.browsers.map((b) => ({ label: b.name, value: b.value }))} unit="lượt" />
              </div>
            </div>

            <div className="an-card" style={{ marginBottom: 12 }}>
              <h2>Khách quay lại nhiều nhất</h2>
              <div className="an-hint">
                {vFrom || vTo
                  ? vFrom && vTo && vFrom === vTo
                    ? `Chỉ tính riêng ngày ${dayVi(vFrom)}`
                    : `Chỉ tính ${vFrom ? `từ ${dayVi(vFrom)}` : 'từ đầu'} ${vTo ? `đến ${dayVi(vTo)}` : 'đến nay'}`
                  : 'Xếp theo số lượt truy cập trong kỳ'}
                {' · top 20'}
                {data.topVisitorTotal > 0 && ` / ${nf.format(data.topVisitorTotal)} khách khớp`}
              </div>

              <div className="an-toolbar">
                <input
                  className="an-search"
                  value={vSearch}
                  onChange={(e) => onVisitorSearch(e.target.value)}
                  placeholder="Tìm theo visitor ID, IP hoặc đường dẫn…"
                />
                <label className="an-field">
                  <span>Từ ngày</span>
                  <input
                    className="an-date"
                    type="date"
                    value={vFrom}
                    max={vTo || undefined}
                    onChange={(e) => setVisitorDay('from', e.target.value)}
                  />
                </label>
                <label className="an-field">
                  <span>Đến ngày</span>
                  <input
                    className="an-date"
                    type="date"
                    value={vTo}
                    min={vFrom || undefined}
                    onChange={(e) => setVisitorDay('to', e.target.value)}
                  />
                </label>
                <button className="an-btn" onClick={() => pickVisitorDay(todayValue())} disabled={loading}>
                  Hôm nay
                </button>
                {(vSearch || vFrom || vTo) && (
                  <button className="an-btn" onClick={clearVisitorFilter} disabled={loading}>
                    Xoá lọc
                  </button>
                )}
              </div>

              {data.topVisitors.length === 0 ? (
                <div className="an-empty">
                  {vSearch || vFrom || vTo ? 'Không có khách nào khớp bộ lọc' : 'Chưa có dữ liệu trong kỳ này'}
                </div>
              ) : (
                <div className="an-tablewrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th {...top.sortProps('visitorId')}>Visitor ID{top.indicator('visitorId')}</th>
                        <th {...top.sortProps('visits')}>Lượt{top.indicator('visits')}</th>
                        <th {...top.sortProps('lastIp')}>IP gần nhất{top.indicator('lastIp')}</th>
                        <th {...top.sortProps('device')}>Thiết bị{top.indicator('device')}</th>
                        <th {...top.sortProps('firstSeen')}>Lần đầu{top.indicator('firstSeen')}</th>
                        <th {...top.sortProps('lastSeen')}>Lần cuối{top.indicator('lastSeen')}</th>
                        <th {...top.sortProps('lastPath')}>Trang cuối{top.indicator('lastPath')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top.sorted.map((v) => (
                        <tr key={v.visitorId}>
                          <td className="mono" title={v.visitorId}>
                            {shortId(v.visitorId)}
                          </td>
                          <td>{nf.format(v.visits)}</td>
                          <td className="mono">
                            {v.lastIp}
                            {v.ipCount > 1 && <small>{v.ipCount} IP khác nhau</small>}
                          </td>
                          <td className="dim">{v.device || '—'}</td>
                          <td className="dim">{dateTimeFmt.format(new Date(v.firstSeen))}</td>
                          <td className="dim">{dateTimeFmt.format(new Date(v.lastSeen))}</td>
                          <td className="wrap dim">{v.lastPath}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="an-card">
              <h2>Từng lượt truy cập</h2>
              <div className="an-hint">Mới nhất trước · {nf.format(data.recentTotal)} bản ghi</div>

              <div className="an-toolbar">
                <input
                  className="an-search"
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Tìm theo IP, visitor ID hoặc đường dẫn…"
                />
              </div>

              {data.recent.length === 0 ? (
                <div className="an-empty">Không có bản ghi nào khớp</div>
              ) : (
                <>
                  <div className="an-tablewrap">
                    <table className="an-table">
                      <thead>
                        <tr>
                          <th {...recent.sortProps('createdAt')}>Thời điểm{recent.indicator('createdAt')}</th>
                          <th {...recent.sortProps('ip')}>IP{recent.indicator('ip')}</th>
                          <th {...recent.sortProps('visitorId')}>Visitor{recent.indicator('visitorId')}</th>
                          <th {...recent.sortProps('path')}>Trang{recent.indicator('path')}</th>
                          <th {...recent.sortProps('device')}>Thiết bị{recent.indicator('device')}</th>
                          <th {...recent.sortProps('referrer')}>Nguồn{recent.indicator('referrer')}</th>
                          <th {...recent.sortProps('screen')}>Màn hình{recent.indicator('screen')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.sorted.map((v) => (
                          <tr key={v.id}>
                            <td className="dim">{stampFmt.format(new Date(v.createdAt))}</td>
                            <td className="mono">{v.ip}</td>
                            <td className="mono" title={v.visitorId}>
                              {shortId(v.visitorId)}{' '}
                              <span className={`an-tag ${v.isNewVisitor ? 'new' : 'back'}`}>
                                {v.isNewVisitor ? 'mới' : 'quay lại'}
                              </span>
                            </td>
                            <td className="wrap">
                              {v.path}
                              {v.title && <small>{v.title}</small>}
                            </td>
                            <td className="dim">
                              {v.device}
                              <small>
                                {v.browser} · {v.os}
                              </small>
                            </td>
                            <td className="wrap dim">{refLabel(v.referrer) || 'Truy cập thẳng'}</td>
                            <td className="dim mono">{v.screen || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="an-pager">
                    <button className="an-btn" onClick={() => goPage(page - 1)} disabled={page <= 1 || loading}>
                      ← Trước
                    </button>
                    <span>
                      Trang {nf.format(page)} / {nf.format(totalPages)}
                    </span>
                    <button
                      className="an-btn"
                      onClick={() => goPage(page + 1)}
                      disabled={page >= totalPages || loading}
                    >
                      Sau →
                    </button>
                    <span className="spacer" />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VisitorsAdminPage() {
  return (
    <AdminGuard>
      <VisitorsScreen />
    </AdminGuard>
  );
}
