'use client';

import Link from 'next/link';
import AdminGuard from '../components/AdminGuard';
import { FANTA } from '../lib/types';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';

interface AdminSection {
  title: string;
  description: string;
  href: string;
  icon: string;
  features: string[];
}

const adminSections: AdminSection[] = [
  {
    title: 'Quản lý Cầu Thủ',
    description: 'Quản lý thông tin đội hình, cập nhật dữ liệu cầu thủ từ file Excel hoặc thủ công',
    href: '/admin/player-management',
    icon: '👤',
    features: [
      'Xem danh sách cầu thủ',
      'Chỉnh sửa thông tin cầu thủ (tên, vị trí, áo số, biệt danh)',
      'Tải ảnh avatar cho cầu thủ',
      'Quản lý vai trò (GK, DEF, MID, FWD)',
      'Thêm/xóa cầu thủ',
    ],
  },
  {
    title: 'Quản lý Tin Tức',
    description: 'Tạo, chỉnh sửa và xuất bản các bài viết, tin tức về đội bóng',
    href: '/admin/news-management',
    icon: '📰',
    features: [
      'Tạo bài viết mới (hỗ trợ tiếng Việt & Anh)',
      'Chỉnh sửa tiêu đề, nội dung, tóm tắt',
      'Tải ảnh bìa cho bài viết',
      'Phân loại bài viết bằng tags',
      'Xuất bản/lưu nháp bài viết',
      'Xóa bài viết',
    ],
  },
  {
    title: 'Quản lý Lịch Thi Đấu',
    description: 'Quản lý các trận đấu, kết quả và thống kê đội tuyển',
    href: '/admin/schedule-management',
    icon: '📅',
    features: [
      'Tạo trận đấu mới (sắp tới)',
      'Ghi nhận kết quả trận đấu (đã đấu)',
      'Cập nhật bàn thắng, hỗ trợ cho từng cầu thủ',
      'Quản lý địa điểm thi đấu',
      'Xem thống kê đội (thắng/hòa/thua, bàn thắng/thua)',
      'Xóa trận đấu',
    ],
  },
  {
    title: 'Quản lý Ngôn Ngữ',
    description: 'Chỉnh sửa nội dung hiển thị tiếng Việt và tiếng Anh trên toàn bộ website',
    href: '/admin/i18n-management',
    icon: '🌐',
    features: [
      'Xem toàn bộ nội dung i18n theo key',
      'Tìm kiếm theo key hoặc nội dung văn bản',
      'Chỉnh sửa từng chuỗi tiếng Việt / tiếng Anh',
      'Lưu thay đổi vào localStorage',
      'Export JSON để cập nhật source code',
      'Reset về bản gốc',
    ],
  },
  {
    title: 'Quản lý Ảnh Drive',
    description: 'Quản lý danh sách link ảnh Google Drive, kiểm soát hiển thị công khai',
    href: '/admin/drive-links',
    icon: '🖼️',
    features: [
      'Thêm / sửa / xoá link Google Drive',
      'Bật/tắt hiển thị công khai từng link',
      'Sắp xếp thứ tự hiển thị',
      'Xem trước trang Gallery công khai',
      'Hỗ trợ lightbox xem ảnh lớn',
    ],
  },
];

export default function AdminPage() {
  return (
    <AdminGuard>
      <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
        <header style={{ padding: '48px 48px 0', borderBottom: `1px solid ${FANTA}33` }}>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              QUẢN LÝ <span style={{ color: FANTA }}>ADMIN</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 15, marginTop: 12 }}>Tổng hợp các công cụ quản lý dữ liệu đội bóng</p>
          </div>
        </header>

        <main style={{ padding: '48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
            {adminSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  background: CARD,
                  border: `2px solid ${FANTA}44`,
                  padding: 32,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = FANTA + 'cc';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${FANTA}22`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = FANTA + '44';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Header with icon and title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 40 }}>{section.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0, color: FANTA }}>
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px 0' }}>
                  {section.description}
                </p>

                {/* Features list */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${FANTA}33` }}>
                  <div style={{ fontSize: 11, color: FANTA, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
                    Chức năng chính:
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', listStyle: 'none' }}>
                    {section.features.map((feature, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 13,
                          color: INK,
                          lineHeight: 1.6,
                          marginBottom: 8,
                          position: 'relative',
                          paddingLeft: 12,
                        }}
                      >
                        <span style={{ position: 'absolute', left: 0, color: FANTA, fontWeight: 700 }}>•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${FANTA}33` }}>
                  <div
                    style={{
                      display: 'inline-block',
                      background: FANTA,
                      color: BLACK,
                      padding: '10px 20px',
                      fontFamily: 'Anton, sans-serif',
                      fontSize: 14,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    Mở → 
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info section */}
          <div
            style={{
              marginTop: 64,
              padding: 32,
              background: CARD,
              border: `1px solid ${FANTA}33`,
              borderLeft: `4px solid ${FANTA}`,
            }}
          >
            <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: FANTA, letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
              💡 Ghi chú
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 20px', color: MUTED, fontSize: 14, lineHeight: 1.8 }}>
              <li>Tất cả thay đổi được lưu trực tiếp vào cơ sở dữ liệu</li>
              <li>Có thể cập nhật dữ liệu từ file Excel thông qua tính năng đồng bộ</li>
              <li>Cần nhập mật khẩu quản trị để thực hiện các thay đổi</li>
              <li>Tất cả dữ liệu sẽ được hiển thị trên trang chủ sau khi cập nhật</li>
            </ul>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
