'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { FANTA } from '../../lib/types';
import { translations } from '../../lib/i18n';
import { api } from '../../lib/api';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

type FlatEntry = { key: string };

function flattenObject(obj: any, prefix = ''): FlatEntry[] {
  const entries: FlatEntry[] = [];
  function walk(node: any, path: string) {
    if (typeof node === 'string') {
      entries.push({ key: path });
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

export default function I18nManagementPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [viData, setViData] = useState<any>(translations.vi);
  const [enData, setEnData] = useState<any>(translations.en);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editVi, setEditVi] = useState('');
  const [editEn, setEditEn] = useState('');

  const allKeys = useMemo(() => flattenObject(translations.vi), []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaveMsg('');
    try {
      await api.updateI18n({}, password);
      const data = await api.getI18n();
      function deepMerge(base: any, overrides: any): any {
        if (!overrides || typeof overrides !== 'object') return base;
        const result = { ...base };
        for (const key of Object.keys(overrides)) {
          if (typeof overrides[key] === 'object' && overrides[key] !== null) {
            result[key] = deepMerge(base[key] || {}, overrides[key]);
          } else if (typeof overrides[key] === 'string' && overrides[key] !== '') {
            result[key] = overrides[key];
          }
        }
        return result;
      }
      setViData(deepMerge(translations.vi, data.vi || {}));
      setEnData(deepMerge(translations.en, data.en || {}));
      setAuthed(true);
    } catch (err: any) {
      setSaveMsg('Sai mật khẩu hoặc lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }

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
    setEditVi(getByKey(viData, key));
    setEditEn(getByKey(enData, key));
  }

  async function saveEdit() {
    if (!editingKey) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const viUpdated = setByKey(viData, editingKey, editVi);
      const enUpdated = setByKey(enData, editingKey, editEn);
      await api.updateI18n({ vi: viUpdated, en: enUpdated }, password);
      setViData(viUpdated);
      setEnData(enUpdated);
      setEditingKey(null);
      setSaveMsg('✓ Đã lưu — áp dụng cho tất cả người dùng');
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err: any) {
      setSaveMsg('❌ Lỗi: ' + (err.message || 'không rõ'));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditVi('');
    setEditEn('');
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ vi: viData, en: enData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'i18n-both.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <AdminGuard>
        <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
          <header style={{ padding: '48px 48px 32px', borderBottom: `1px solid ${FANTA}33` }}>
            <Link href="/admin" style={{ color: FANTA, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Admin</Link>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.92, textTransform: 'uppercase', margin: '16px 0 0' }}>
              QUẢN LÝ <span style={{ color: FANTA }}>NGÔN NGỮ</span>
            </h1>
          </header>
          <div style={{ padding: '48px', maxWidth: 400 }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Mật khẩu Admin</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: CARD, border: `1px solid ${FANTA}44`, color: INK, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  placeholder="Nhập mật khẩu..." required />
              </div>
              {saveMsg && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{saveMsg}</div>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', background: FANTA, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      </AdminGuard>
    );
  }

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
              Chỉnh sửa nội dung hiển thị tiếng Việt &amp; tiếng Anh. Thay đổi <strong style={{ color: FANTA }}>áp dụng ngay cho tất cả người dùng</strong>.
            </p>
        </header>

        <main style={{ padding: '32px 48px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 280 }}>
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

            {saveMsg && (
              <span style={{ fontSize: 13, fontWeight: 600, color: saveMsg.startsWith('✓') ? '#4ade80' : '#f87171' }}>{saveMsg}</span>
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
              display: 'grid', gridTemplateColumns: '1.5fr 2fr 2fr 100px',
              padding: '12px 16px', background: `${FANTA}15`,
              borderBottom: `1px solid ${LINE}`, fontSize: 11,
              color: FANTA, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
            }}>
              <span>Key</span>
              <span>Tiếng Việt</span>
              <span>English</span>
              <span>Thao tác</span>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 14 }}>
                Không tìm thấy kết quả nào
              </div>
            )}

            {filtered.map(({ key }, idx) => {
              const isEditing = editingKey === key;
              return (
                <div
                  key={key}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 2fr 2fr 100px',
                    padding: '10px 16px', alignItems: isEditing ? 'start' : 'center',
                    borderBottom: `1px solid ${LINE}`,
                    background: idx % 2 === 0 ? 'transparent' : `${FANTA}05`,
                    gap: 12,
                  }}
                >
                  {/* Key column */}
                  <div style={{ fontSize: 12, color: FANTA, fontFamily: 'monospace', wordBreak: 'break-all', paddingTop: isEditing ? 8 : 0 }}>
                    {key}
                  </div>

                  {/* Vietnamese column */}
                  <div>
                    {isEditing ? (
                      <textarea
                        value={editVi}
                        onChange={e => setEditVi(e.target.value)}
                        style={{
                          width: '100%', minHeight: 60, padding: '8px',
                          background: BLACK, border: `1px solid ${FANTA}`,
                          color: INK, fontSize: 13, fontFamily: 'inherit',
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        }}
                        placeholder="Tiếng Việt..."
                      />
                    ) : (
                      <div
                        onClick={() => startEdit(key)}
                        style={{
                          fontSize: 13, color: getByKey(viData, key) ? INK : MUTED, cursor: 'pointer',
                          minHeight: 24, lineHeight: 1.5,
                          padding: '4px 6px', borderRadius: 2,
                          border: '1px solid transparent',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = `${FANTA}55`)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                        title="Click để chỉnh sửa"
                      >
                        {getByKey(viData, key) || <em style={{ color: MUTED }}>chưa có</em>}
                      </div>
                    )}
                  </div>

                  {/* English column */}
                  <div>
                    {isEditing ? (
                      <textarea
                        value={editEn}
                        onChange={e => setEditEn(e.target.value)}
                        style={{
                          width: '100%', minHeight: 60, padding: '8px',
                          background: BLACK, border: `1px solid ${FANTA}`,
                          color: INK, fontSize: 13, fontFamily: 'inherit',
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        }}
                        placeholder="English..."
                      />
                    ) : (
                      <div
                        onClick={() => startEdit(key)}
                        style={{
                          fontSize: 13, color: getByKey(enData, key) ? INK : MUTED, cursor: 'pointer',
                          minHeight: 24, lineHeight: 1.5,
                          padding: '4px 6px', borderRadius: 2,
                          border: '1px solid transparent',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = `${FANTA}55`)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                        title="Click để chỉnh sửa"
                      >
                        {getByKey(enData, key) || <em style={{ color: MUTED }}>chưa có</em>}
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} disabled={saving} style={{ padding: '4px 10px', background: FANTA, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {saving ? '...' : 'Lưu'}
                        </button>
                        <button onClick={cancelEdit} style={{ padding: '4px 10px', background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                          Huỷ
                        </button>
                      </>
                    ) : (
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
