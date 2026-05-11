'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { FANTA } from '../../lib/types';
import { translations } from '../../lib/i18n';

const STORAGE_KEY_VI = 'lffc_i18n_vi';
const STORAGE_KEY_EN = 'lffc_i18n_en';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

type FlatEntry = { key: string; vi: string; en: string };

function flattenObject(obj: any, prefix = ''): FlatEntry[] {
  const entries: FlatEntry[] = [];
  function walk(node: any, path: string) {
    if (typeof node === 'string') {
      entries.push({ key: path, vi: '', en: '' });
    } else if (typeof node === 'object' && node !== null) {
      for (const k of Object.keys(node)) {
        walk(node[k], path ? `${path}.${k}` : k);
      }
    }
  }
  walk(obj, prefix);
  return entries;
}

function getByKey(obj: any, key: string): string {
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    cur = cur?.[p];
    if (cur === undefined) return '';
  }
  return typeof cur === 'string' ? cur : '';
}

function setByKey(obj: any, key: string, value: string): any {
  const parts = key.split('.');
  const result = JSON.parse(JSON.stringify(obj));
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return result;
}

function loadOverrides(key: string, defaults: any): any {
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaults;
    return JSON.parse(saved);
  } catch {
    return defaults;
  }
}

export default function I18nManagementPage() {
  const [viData, setViData] = useState<any>(translations.vi);
  const [enData, setEnData] = useState<any>(translations.en);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi');
  const [saved, setSaved] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setViData(loadOverrides(STORAGE_KEY_VI, translations.vi));
    setEnData(loadOverrides(STORAGE_KEY_EN, translations.en));
  }, []);

  const allKeys = useMemo(() => flattenObject(translations.vi), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allKeys;
    return allKeys.filter(({ key }) => {
      const vi = getByKey(viData, key).toLowerCase();
      const en = getByKey(enData, key).toLowerCase();
      return key.toLowerCase().includes(q) || vi.includes(q) || en.includes(q);
    });
  }, [search, allKeys, viData, enData]);

  function startEdit(key: string) {
    setEditingKey(key);
    setEditValue(activeTab === 'vi' ? getByKey(viData, key) : getByKey(enData, key));
  }

  function saveEdit() {
    if (!editingKey) return;
    if (activeTab === 'vi') {
      const updated = setByKey(viData, editingKey, editValue);
      setViData(updated);
      localStorage.setItem(STORAGE_KEY_VI, JSON.stringify(updated));
    } else {
      const updated = setByKey(enData, editingKey, editValue);
      setEnData(updated);
      localStorage.setItem(STORAGE_KEY_EN, JSON.stringify(updated));
    }
    setEditingKey(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
  }

  function resetAll() {
    if (!confirm('Reset tất cả về bản gốc?')) return;
    localStorage.removeItem(STORAGE_KEY_VI);
    localStorage.removeItem(STORAGE_KEY_EN);
    setViData(translations.vi);
    setEnData(translations.en);
  }

  function exportJSON() {
    const data = activeTab === 'vi' ? viData : enData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `i18n-${activeTab}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentData = activeTab === 'vi' ? viData : enData;

  return (
    <AdminGuard>
      <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
        {/* Header */}
        <header style={{ padding: '48px 48px 32px', borderBottom: `1px solid ${FANTA}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <Link href="/admin" style={{ color: FANTA, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              ← Admin
            </Link>
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.92, textTransform: 'uppercase', margin: 0 }}>
            QUẢN LÝ <span style={{ color: FANTA }}>NGÔN NGỮ</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 12 }}>
            Chỉnh sửa nội dung hiển thị tiếng Việt & tiếng Anh trên website. Thay đổi được lưu vào localStorage của trình duyệt.
          </p>
        </header>

        <main style={{ padding: '32px 48px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Tìm kiếm theo key hoặc nội dung..."
                style={{
                  width: '100%', padding: '10px 14px', background: CARD,
                  border: `1px solid ${FANTA}44`, color: INK, fontSize: 14,
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tab */}
            <div style={{ display: 'flex', gap: 0, border: `1px solid ${FANTA}44` }}>
              {(['vi', 'en'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 24px', background: activeTab === tab ? FANTA : 'transparent',
                    color: activeTab === tab ? '#0a0a0a' : FANTA, border: 'none',
                    cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  {tab === 'vi' ? 'Tiếng Việt' : 'English'}
                </button>
              ))}
            </div>

            <button
              onClick={exportJSON}
              style={{
                padding: '10px 20px', background: 'transparent', border: `1px solid ${FANTA}66`,
                color: FANTA, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              ↓ Export JSON
            </button>

            <button
              onClick={resetAll}
              style={{
                padding: '10px 20px', background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`,
                color: MUTED, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              ↺ Reset gốc
            </button>

            {saved && (
              <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>✓ Đã lưu</span>
            )}
          </div>

          {/* Stats */}
          <div style={{ marginBottom: 16, fontSize: 13, color: MUTED }}>
            Hiển thị {filtered.length} / {allKeys.length} keys
          </div>

          {/* Table */}
          <div style={{ background: CARD, border: `1px solid ${FANTA}22`, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 3fr 1fr',
              padding: '12px 16px', background: `${FANTA}15`,
              borderBottom: `1px solid ${LINE}`, fontSize: 11,
              color: FANTA, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
            }}>
              <span>Key</span>
              <span>Nội dung ({activeTab === 'vi' ? 'Tiếng Việt' : 'English'})</span>
              <span>Thao tác</span>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 14 }}>
                Không tìm thấy kết quả nào
              </div>
            )}

            {filtered.map(({ key }, idx) => {
              const value = getByKey(currentData, key);
              const isEditing = editingKey === key;
              return (
                <div
                  key={key}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 3fr 1fr',
                    padding: '10px 16px', alignItems: 'start',
                    borderBottom: `1px solid ${LINE}`,
                    background: idx % 2 === 0 ? 'transparent' : `${FANTA}05`,
                  }}
                >
                  <div style={{ fontSize: 12, color: FANTA, fontFamily: 'monospace', paddingRight: 12, paddingTop: 2, wordBreak: 'break-all' }}>
                    {key}
                  </div>
                  <div style={{ paddingRight: 12 }}>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          style={{
                            width: '100%', minHeight: 60, padding: '8px',
                            background: BLACK, border: `1px solid ${FANTA}`,
                            color: INK, fontSize: 13, fontFamily: 'inherit',
                            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                          }}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button onClick={saveEdit} style={{ padding: '4px 14px', background: FANTA, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }}>
                            Lưu
                          </button>
                          <button onClick={cancelEdit} style={{ padding: '4px 12px', background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEdit(key)}
                        style={{
                          fontSize: 13, color: value ? INK : MUTED, cursor: 'pointer',
                          minHeight: 24, lineHeight: 1.5,
                          padding: '2px 6px', borderRadius: 2,
                          border: '1px solid transparent',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = `${FANTA}55`)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                        title="Click để chỉnh sửa"
                      >
                        {value || <em style={{ color: MUTED }}>chưa có nội dung</em>}
                      </div>
                    )}
                  </div>
                  <div>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(key)}
                        style={{
                          padding: '4px 12px', background: 'transparent',
                          border: `1px solid ${FANTA}44`, color: FANTA,
                          cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                        }}
                      >
                        Sửa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
