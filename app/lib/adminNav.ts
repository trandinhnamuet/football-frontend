// Single source of truth for the admin tool list: the /admin index renders these
// as description cards, the sidebar renders them as quick-jump links.

export interface AdminSection {
  title: string;
  /** Compact label for the sidebar, where 220px has to fit on one line. */
  short: string;
  description: string;
  href: string;
  icon: string;
  features: string[];
}

export const adminSections: AdminSection[] = [
  {
    title: 'Thống Kê Truy Cập',
    short: 'Traffic',
    description: 'Xem lượng truy cập website theo ngày, nguồn khách, thiết bị và trang được xem nhiều nhất',
    href: '/admin/analytics',
    icon: '📊',
    features: [
      'Người dùng, phiên, lượt xem trang kèm so sánh với kỳ trước',
      'Biểu đồ diễn biến theo ngày (hôm nay / 7 / 28 / 90 ngày)',
      'Số người đang online theo thời gian thực',
      'Top trang, nguồn traffic, thiết bị và khu vực',
      'Dữ liệu lấy trực tiếp từ Google Analytics 4',
    ],
  },
  {
    title: 'Quản lý Cầu Thủ',
    short: 'Cầu thủ',
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
    short: 'Tin tức',
    description: 'Tạo, chỉnh sửa và xuất bản các bài viết, tin tức về đội bóng',
    href: '/admin/news-management',
    icon: '📰',
    features: [
      'Tạo bài viết mới (hỗ trợ tiếng Việt & Anh)',
      'Chỉnh sửa tiêu đề, nội dung, tóm tắt',
      'Tải ảnh bìa cho bài viết',
      'Thư viện ảnh: upload, nén tự động, chèn vào nội dung',
      'Phân loại bài viết bằng tags',
      'Xóa bài viết',
    ],
  },
  {
    title: 'Quản lý Lịch Thi Đấu',
    short: 'Lịch thi đấu',
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
    short: 'Ngôn ngữ',
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
    short: 'Ảnh Drive',
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
  {
    title: 'Video Highlight',
    short: 'Video',
    description: 'Quản lý video highlight nhúng YouTube hiển thị trên trang chủ',
    href: '/admin/video-highlight',
    icon: '🎬',
    features: [
      'Nhập link YouTube (youtube.com hoặc youtu.be)',
      'Đặt tiêu đề tiếng Việt và tiếng Anh',
      'Bật/tắt hiển thị video trên trang chủ',
      'Xem trước video ngay trong trang admin',
    ],
  },
  {
    title: 'Trang Giới Thiệu',
    short: 'Giới thiệu',
    description: 'Chỉnh sửa nội dung trang giới thiệu chi tiết và ảnh banner',
    href: '/admin/about-management',
    icon: '📖',
    features: [
      'Upload ảnh banner (hiển thị trên trang chủ và trang giới thiệu)',
      'Chỉnh sửa nội dung tiếng Việt (HTML)',
      'Chỉnh sửa nội dung tiếng Anh (HTML)',
      'Xem trước nội dung và banner ngay trong admin',
    ],
  },
  {
    title: 'Banner Ảnh Chạy',
    short: 'Banner',
    description: 'Quản lý dải ảnh slide chạy dưới header trang chủ (Man of the week, khoảnh khắc đội bóng...)',
    href: '/admin/banner-slides',
    icon: '🖼️',
    features: [
      'Thêm / xóa ảnh tùy ý (tự kiểm soát số lượng)',
      'Tải ảnh lên cho từng slide',
      'Đặt chú thích tiếng Việt & tiếng Anh',
      'Thêm link khi bấm vào ảnh (tuỳ chọn)',
      'Bật/tắt hiển thị & sắp xếp thứ tự',
    ],
  },
  {
    title: 'Giới Thiệu Thành Viên',
    short: 'Thành viên',
    description: 'Quản lý các bài viết giới thiệu thành viên hiển thị dạng slide tự động trên trang chủ',
    href: '/admin/memorial-management',
    icon: '🏅',
    features: [
      'Tạo bài viết mới (hỗ trợ tiếng Việt & Anh)',
      'Chỉnh sửa tiêu đề, tóm tắt, nội dung',
      'Tải ảnh bìa cho từng bài viết',
      'Phân loại bằng tags',
      'Xóa bài viết',
    ],
  },
];
