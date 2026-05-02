// Static mock data — kept for offline/prototype use
// User, Feed, and Beta data are now in SQLite

export const MOCK_NEWS = [
  {
    id: '1',
    title: 'Ogata Yoshiyuki Workshop',
    subtitle: 'A Masterclass For Everyone',
    imageKey: 'src/assets/images/news_1.png',
  },
  {
    id: '2',
    title: '2nd Anniversary Carnival',
    subtitle: 'Prize Pool: RM30,000 — 04-04-2026',
    imageKey: 'src/assets/images/news_2.png',
  },
  {
    id: '3',
    title: 'New Route Reset',
    subtitle: 'Sectors V, VI, VII fully reset this week!',
    imageKey: 'src/assets/images/news_3.png',
  },
];

export const MOCK_ACHIEVEMENTS = [
  { id: 'ach_01', title: 'First Send', description: 'Complete your first route', icon: '🏔️', unlocked: true, date: '2025-01-20' },
  { id: 'ach_02', title: 'First B8 Send', description: 'Complete a V8 or harder route', icon: '🏆', unlocked: true, date: '2025-03-05' },
  { id: 'ach_03', title: '10 Days Climbed', description: 'Check in 10 different days', icon: '📅', unlocked: true, date: '2025-02-10' },
  { id: 'ach_04', title: '100 Days Climbed', description: 'Check in 100 different days', icon: '🔥', unlocked: false, date: null },
  { id: 'ach_05', title: 'Sector Master', description: 'Send all routes in any sector', icon: '⭐', unlocked: true, date: '2025-02-20' },
  { id: 'ach_06', title: 'Social Climber', description: 'Upload 5 beta videos', icon: '📹', unlocked: true, date: '2025-03-01' },
  { id: 'ach_07', title: 'Gym Rat', description: 'Check in 7 days in a row', icon: '💪', unlocked: false, date: null },
  { id: 'ach_08', title: 'Beta King', description: 'Get 100 likes on a beta video', icon: '👑', unlocked: false, date: null },
  { id: 'ach_09', title: 'V-Collector', description: 'Send at least one route of each grade V0–V7', icon: '🎯', unlocked: false, date: null },
  { id: 'ach_10', title: 'First Flash', description: 'Send a route on your very first attempt', icon: '⚡', unlocked: true, date: '2025-01-22' },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alvin Yap', username: 'alvin_bhub', sends: 142, grade: 'V9', avatar: null },
  { rank: 2, name: 'Marcus Ng', username: 'marcus_moves', sends: 118, grade: 'V8', avatar: null },
  { rank: 3, name: 'Felice Lim', username: 'felice_crux', sends: 104, grade: 'V8', avatar: null },
  { rank: 4, name: 'Raj Kumar', username: 'raj_climber', sends: 97, grade: 'V7', avatar: null },
  { rank: 5, name: 'Sarah Koh', username: 'sarah_sends', sends: 88, grade: 'V7', avatar: null },
  { rank: 6, name: 'You', username: 'clement_climbs', sends: 63, grade: 'V6', avatar: null },
  { rank: 7, name: 'Zara Amir', username: 'zara_climb', sends: 51, grade: 'V6', avatar: null },
  { rank: 8, name: 'Ben Low', username: 'ben_boulders', sends: 44, grade: 'V5', avatar: null },
];

export const MOCK_RESET_SCHEDULE = [
  { sector: 'Sector I', lastReset: '2026-03-01', nextReset: '2026-04-01', routeCount: 3 },
  { sector: 'Sector II', lastReset: '2026-03-10', nextReset: '2026-04-10', routeCount: 3 },
  { sector: 'Sector III', lastReset: '2026-03-15', nextReset: '2026-04-15', routeCount: 2 },
  { sector: 'Sector IX', lastReset: '2026-03-20', nextReset: '2026-04-20', routeCount: 3 },
  { sector: 'Sector M', lastReset: '2026-02-20', nextReset: '2026-03-20', routeCount: 3 },
  { sector: 'Sector K', lastReset: '2026-03-05', nextReset: '2026-04-05', routeCount: 2 },
];
