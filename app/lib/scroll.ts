/**
 * Cuộn mượt tới section theo hash ("#schedule"). Trừ chiều cao header dính
 * để tiêu đề section không bị header che. Cập nhật URL hash không tạo
 * history entry mới.
 */
export function smoothScrollToHash(hash: string): boolean {
  const id = hash.replace(/^#/, '');
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const nav = document.querySelector<HTMLElement>('.main-nav');
  const offset = (nav?.offsetHeight ?? 0) + 8;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  try { history.replaceState(null, '', `#${id}`); } catch {}
  return true;
}
