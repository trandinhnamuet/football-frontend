'use client';

import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

/** Giá trị so sánh được của một ô. `null`/`undefined` luôn xuống cuối. */
export type SortValue = string | number | boolean | Date | null | undefined;

export type SortAccessors<T> = Record<string, (row: T) => SortValue>;

export interface SortState {
  key: string;
  dir: SortDir;
}

function normalize(v: SortValue): { empty: boolean; num?: number; str?: string } {
  if (v === null || v === undefined || v === '') return { empty: true };
  if (typeof v === 'number') return { empty: false, num: v };
  if (typeof v === 'boolean') return { empty: false, num: v ? 1 : 0 };
  if (v instanceof Date) return { empty: false, num: v.getTime() };
  return { empty: false, str: v };
}

function compare(a: SortValue, b: SortValue): number {
  const x = normalize(a);
  const y = normalize(b);
  // Ô trống luôn nằm cuối, bất kể chiều sort.
  if (x.empty && y.empty) return 0;
  if (x.empty) return 1;
  if (y.empty) return -1;
  if (x.num !== undefined && y.num !== undefined) return x.num - y.num;
  const sx = x.str ?? String(x.num);
  const sy = y.str ?? String(y.num);
  return sx.localeCompare(sy, 'vi', { numeric: true, sensitivity: 'base' });
}

/**
 * Sort bảng theo cột, chu kỳ 3 trạng thái khi bấm vào tên cột:
 * tăng dần → giảm dần → bỏ sort (về thứ tự mặc định của dữ liệu).
 *
 * `rows` phải đã ở thứ tự mặc định mong muốn; hook không đổi thứ tự đó
 * khi chưa chọn cột nào.
 */
export function useTableSort<T>(rows: T[], accessors: SortAccessors<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const get = accessors[sort.key];
    if (!get) return rows;
    const sign = sort.dir === 'asc' ? 1 : -1;
    // Ô trống giữ nguyên ở cuối nên nhân dấu trước khi cộng phần "empty".
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const ea = normalize(va).empty;
      const eb = normalize(vb).empty;
      if (ea || eb) return compare(va, vb);
      return sign * compare(va, vb);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  function toggle(key: string) {
    setSort(cur => {
      if (!cur || cur.key !== key) return { key, dir: 'asc' };
      if (cur.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  }

  /** Props gắn vào ô tiêu đề (dùng được cho cả `<div>` và `<th>`). */
  function sortProps(key: string) {
    const active = sort?.key === key;
    return {
      onClick: () => toggle(key),
      role: 'button' as const,
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(key);
        }
      },
      title: active
        ? sort!.dir === 'asc'
          ? 'Đang sort tăng dần — bấm để giảm dần'
          : 'Đang sort giảm dần — bấm để bỏ sort'
        : 'Bấm để sort theo cột này',
      style: { cursor: 'pointer', userSelect: 'none' as const, whiteSpace: 'nowrap' as const },
    };
  }

  /** Mũi mờ = sort được, mũi rõ = đang sort theo cột đó. */
  function indicator(key: string) {
    const active = sort?.key === key;
    const glyph = !active ? '⇅' : sort!.dir === 'asc' ? '↑' : '↓';
    return (
      <span
        aria-hidden
        style={{ marginLeft: 4, opacity: active ? 1 : 0.32, fontSize: '0.95em', display: 'inline-block' }}
      >
        {glyph}
      </span>
    );
  }

  return { sorted, sort, toggle, sortProps, indicator };
}
