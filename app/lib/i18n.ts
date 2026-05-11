export type Lang = 'vi' | 'en';

const vi = {
  nav: {
    intro: 'Giới thiệu',
    squad: 'Đội hình',
    news: 'Tin tức',
    schedule: 'Lịch thi đấu',
    dashboard: 'Dashboard',
    scoring: 'Cách tính điểm',
  },
  hero: {
    hashtag: '#ĐamMêBấtTận',
    season: 'Mùa 2026',
    week: 'Tuần',
    line1: 'BẢNG XẾP',
    line2: 'HẠNG',
    accent: 'ĐIỂM',
    mvp: 'MVP Mùa giải',
    goals: 'Bàn',
    assists: 'Kiến tạo',
    points: 'Điểm',
    scoringBtn: 'Cách tính điểm',
    tooltipTitle: 'Công thức tính điểm',
    tooltipGoals: 'Bàn thắng × 5',
    tooltipAssists: 'Kiến tạo × 3',
    tooltipAttend: 'Điểm danh × 2',
    tooltipHint: 'Click để xem chi tiết →',
    noData: 'Chưa có dữ liệu cầu thủ. Đang đồng bộ từ Excel...',
  },
  sections: {
    s01: '01 / GIỚI THIỆU',
    s02: '02 / ĐỘI HÌNH',
    s03: '03 / TIN TỨC',
    s04: '04 / LỊCH THI ĐẤU',
  },
  intro: {
    label: 'Về Lon Fanta FC',
    body: 'Lon Fanta FC là đội bóng phong trào thành lập năm 2019, tập hợp những anh em chung tình yêu trái bóng tròn — đa số đến từ Hà Nội, đá ở các sân Mỹ Đình, Cầu Giấy, Long Biên. Triết lý đơn giản — chơi đẹp, đoàn kết, và luôn chừa chỗ cho tiếng cười.',
    founded: 'Thành lập',
    members: 'Thành viên',
    wins: 'Trận thắng',
    goals: 'Bàn ghi',
  },
  squad: {
    title: 'Đội hình',
    subtitle: 'cầu thủ · Bốn vai trò · Một tinh thần',
    viewAll: 'XEM TẤT CẢ →',
    noData: 'Đang đồng bộ dữ liệu cầu thủ...',
  },
  news: {
    title: 'Tin tức',
    viewAll: 'TẤT CẢ TIN →',
    noData: 'Chưa có tin tức.',
    addNews: 'Thêm bài viết →',
  },
  schedule: {
    title: 'Lịch thi đấu',
    upcoming: 'Sắp tới',
    played: 'Đã đá',
    noUpcoming: 'Chưa có lịch thi đấu',
  },
  cta: {
    label: 'XEM SỐ',
    title1: 'MỞ DASHBOARD',
    title2: 'MỌI THÔNG SỐ',
    btn: '▶ Mở Dashboard',
  },
  roles: {
    GK: 'Thủ môn',
    DEF: 'Hậu vệ',
    MID: 'Tiền vệ',
    FWD: 'Tiền đạo',
    'Tự do': 'Tự do',
  },
};

const en = {
  nav: {
    intro: 'About',
    squad: 'Squad',
    news: 'News',
    schedule: 'Schedule',
    dashboard: 'Dashboard',
    scoring: 'Scoring',
  },
  hero: {
    hashtag: '#NeverStopPlaying',
    season: 'Season 2026',
    week: 'Week',
    line1: 'POINTS',
    line2: 'LEADER',
    accent: 'BOARD',
    mvp: 'Season MVP',
    goals: 'Goals',
    assists: 'Assists',
    points: 'Points',
    scoringBtn: 'Scoring Formula',
    tooltipTitle: 'Scoring Formula',
    tooltipGoals: 'Goals × 5',
    tooltipAssists: 'Assists × 3',
    tooltipAttend: 'Attendance × 2',
    tooltipHint: 'Click for details →',
    noData: 'No player data yet. Syncing from Excel...',
  },
  sections: {
    s01: '01 / ABOUT',
    s02: '02 / SQUAD',
    s03: '03 / NEWS',
    s04: '04 / SCHEDULE',
  },
  intro: {
    label: 'About Lon Fanta FC',
    body: 'Lon Fanta FC is an amateur football club founded in 2019, bringing together friends who share a passion for the beautiful game — mostly from Hanoi, playing at Mỹ Đình, Cầu Giấy, and Long Biên pitches. Simple philosophy — play well, stay together, always leave room for laughter.',
    founded: 'Founded',
    members: 'Members',
    wins: 'Wins',
    goals: 'Goals Scored',
  },
  squad: {
    title: 'Squad',
    subtitle: 'players · Four positions · One spirit',
    viewAll: 'VIEW ALL →',
    noData: 'Syncing player data...',
  },
  news: {
    title: 'News',
    viewAll: 'ALL NEWS →',
    noData: 'No news yet.',
    addNews: 'Add article →',
  },
  schedule: {
    title: 'Schedule',
    upcoming: 'Upcoming',
    played: 'Results',
    noUpcoming: 'No upcoming fixtures',
  },
  cta: {
    label: 'STATS',
    title1: 'OPEN DASHBOARD',
    title2: 'ALL METRICS',
    btn: '▶ Open Dashboard',
  },
  roles: {
    GK: 'Goalkeeper',
    DEF: 'Defender',
    MID: 'Midfielder',
    FWD: 'Forward',
    'Tự do': 'Free Role',
  },
};

export const translations: Record<Lang, typeof vi> = { vi, en };

export function getRoleLabel(role: string, lang: Lang): string {
  return (translations[lang].roles as Record<string, string>)[role] || role;
}
