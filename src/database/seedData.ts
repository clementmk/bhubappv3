import { SQLiteDatabase } from 'react-native-sqlite-storage';

// ── Seed default user ────────────────────────────────────────────────────────
export const seedUsers = async (db: SQLiteDatabase): Promise<void> => {
  await db.executeSql(
    `INSERT INTO users (username, name, email, password, avatar, posts, points, highest_grade, membershipType, membershipExpiry, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'clement_climbs',
      'Clement',
      'clement@bhub.app',
      '123456',
      null,
      27,
      2500,
      'V6',
      'Monthly Pass',
      '2026-04-30',
      '2025-01-01',
    ],
  );
};

// ── Seed sectors & routes ────────────────────────────────────────────────────
export const seedDatabase = async (db: SQLiteDatabase): Promise<void> => {
  // Seed Sectors
  const sectors = [
    { id: 'I', name: 'Sector I', label_x: 0.12, label_y: 0.48 },
    { id: 'II', name: 'Sector II', label_x: 0.28, label_y: 0.13 },
    { id: 'III', name: 'Sector III', label_x: 0.55, label_y: 0.13 },
    { id: 'IV', name: 'Sector IV', label_x: 0.82, label_y: 0.22 },
    { id: 'V', name: 'Sector V', label_x: 0.85, label_y: 0.36 },
    { id: 'VI', name: 'Sector VI', label_x: 0.85, label_y: 0.48 },
    { id: 'VII', name: 'Sector VII', label_x: 0.85, label_y: 0.62 },
    { id: 'VIII', name: 'Sector VIII', label_x: 0.80, label_y: 0.75 },
    { id: 'IX', name: 'Sector IX', label_x: 0.60, label_y: 0.45 },
    { id: 'X', name: 'Sector X', label_x: 0.60, label_y: 0.58 },
    { id: 'XI', name: 'Sector XI', label_x: 0.45, label_y: 0.72 },
    { id: 'XII', name: 'Sector XII', label_x: 0.43, label_y: 0.60 },
    { id: 'XIII', name: 'Sector XIII', label_x: 0.43, label_y: 0.45 },
    { id: 'K', name: 'Sector K', label_x: 0.12, label_y: 0.27 },
    { id: 'M', name: 'Sector M', label_x: 0.43, label_y: 0.36 },
  ];

  for (const s of sectors) {
    const imageUrl = `https://bhubbouldering.com/images/climb/Bhub%20Sector-01.jpg`;
    await db.executeSql(
      `INSERT INTO sectors (id, name, label_x, label_y, color, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.label_x, s.label_y, '#FE8004', imageUrl],
    );
  }

  // Seed Routes per sector
  const routesBySector: Record<string, Array<{ code: string; name: string; grade: string; description: string; tags: string[] }>> = {
    I: [
      { code: 'B1', name: 'Iron Slab', grade: 'V3', description: 'A delicate balance problem on a flat wall. Focus on footwork.', tags: ['Slab', 'Technical'] },
      { code: 'B2', name: 'Left Hook', grade: 'V4', description: 'Crispy pinches lead into a cool undercling sequence.', tags: ['Crimpy', 'Technical'] },
      { code: 'B3', name: 'Power Pull', grade: 'V6', description: 'Pure strength challenge with big moves on bulging holds.', tags: ['Strength', 'Dynamic'] },
    ],
    II: [
      { code: 'B1', name: 'Orange Crush', grade: 'V2', description: 'Flowing movement on juggy holds. Great for warm-up.', tags: ['Dynamic'] },
      { code: 'B2', name: 'Ceiling Cat', grade: 'V5', description: 'Reaches out onto the overhang. Lock-off strength required.', tags: ['Strength', 'Dynamic'] },
      { code: 'B3', name: 'Disco Fever', grade: 'V4', description: 'Fun, high-footwork sequence on a steep wall.', tags: ['Technical', 'Slab'] },
    ],
    III: [
      { code: 'B1', name: 'Granite Flow', grade: 'V3', description: 'Smooth movement connecting small crimps on a vertical face.', tags: ['Crimpy', 'Technical'] },
      { code: 'B2', name: 'Sky High', grade: 'V6', description: 'A big dynamic move to a sloper that will test your skin.', tags: ['Dynamic', 'Strength'] },
    ],
    IV: [
      { code: 'B1', name: 'Righty Tighty', grade: 'V2', description: 'Right-hand technique on a tall vertical wall.', tags: ['Technical'] },
      { code: 'B2', name: 'Compression King', grade: 'V7', description: 'Squeeze everything together on this compression problem.', tags: ['Strength', 'Technical'] },
    ],
    V: [
      { code: 'B1', name: 'Slab Master', grade: 'V1', description: 'Perfect introductory slab for first-timers.', tags: ['Slab'] },
      { code: 'B2', name: 'Balance Act', grade: 'V4', description: 'High feet and a desperate lunge to the top.', tags: ['Slab', 'Dynamic'] },
      { code: 'B3', name: 'Zero Gravity', grade: 'V5', description: 'Fancy footwork on a steep slab.', tags: ['Slab', 'Technical'] },
    ],
    VI: [
      { code: 'B1', name: 'Side Pull City', grade: 'V4', description: 'A sequence of side pulls on a slightly overhanging wall.', tags: ['Technical', 'Strength'] },
      { code: 'B2', name: 'Pinch Hitter', grade: 'V6', description: 'All pinche holds from bottom to top. Forearm burner!', tags: ['Strength'] },
    ],
    VII: [
      { code: 'B1', name: 'Long Reach', grade: 'V3', description: 'Tall climbers rejoice — big reaches between far holds.', tags: ['Dynamic'] },
      { code: 'B2', name: 'The Crux', grade: 'V7', description: 'One hard move in the middle. Every time.', tags: ['Strength', 'Crimpy'] },
      { code: 'B3', name: 'Rooftop Rumble', grade: 'V5', description: 'Navigate the heel hooks on this roof section.', tags: ['Strength', 'Technical'] },
    ],
    VIII: [
      { code: 'B1', name: 'Corner Stone', grade: 'V2', description: 'Use the corner feature to your advantage.', tags: ['Technical'] },
      { code: 'B2', name: 'Highball Hustle', grade: 'V6', description: 'A tall, committing problem — stay calm!', tags: ['Dynamic', 'Strength'] },
    ],
    IX: [
      { code: 'B1', name: 'Central Park', grade: 'V3', description: 'The most central wall in the gym. A BHUB classic.', tags: ['Technical', 'Dynamic'] },
      { code: 'B2', name: 'Mantlepiece', grade: 'V5', description: 'Mantle the lip of the wall. Pure lockoff test.', tags: ['Strength'] },
      { code: 'B3', name: 'Dyno Drama', grade: 'V6', description: 'A full-on dynamic leap to the top hold.', tags: ['Dynamic'] },
    ],
    X: [
      { code: 'B1', name: 'Down Low', grade: 'V4', description: 'Low start and long moves upward on a gentle overhang.', tags: ['Technical', 'Dynamic'] },
      { code: 'B2', name: 'Sloper Slope', grade: 'V7', description: 'All slopey holds on a slightly overhanging face.', tags: ['Strength', 'Slab'] },
    ],
    XI: [
      { code: 'B1', name: 'Toe Hook Tale', grade: 'V5', description: 'A crafty sequence using toe hooks to finish.', tags: ['Technical'] },
      { code: 'B2', name: 'Heel Hook Heaven', grade: 'V6', description: 'Explosive heel hooks on steep terrain.', tags: ['Strength', 'Technical'] },
      { code: 'B3', name: 'Low Slab Gospel', grade: 'V2', description: 'Simple slab with a tricky low start.', tags: ['Slab'] },
    ],
    XII: [
      { code: 'B1', name: 'Pump Factory', grade: 'V4', description: 'Long sustained problem — pace yourself!', tags: ['Strength', 'Dynamic'] },
      { code: 'B2', name: 'Volume Game', grade: 'V5', description: 'Read the volumes cleverly to find the resting holds.', tags: ['Technical'] },
    ],
    XIII: [
      { code: 'B1', name: 'The Undercling', grade: 'V5', description: 'An undercling-focused sequence across the wall.', tags: ['Technical', 'Strength'] },
      { code: 'B2', name: 'Flight Path', grade: 'V6', description: 'Big moves between far apart volumes.', tags: ['Dynamic'] },
      { code: 'B3', name: 'Campus Dreamer', grade: 'V8', description: 'Campusing optional but encouraged on this hard line.', tags: ['Strength', 'Dynamic'] },
    ],
    K: [],
    M: [],
  };

  let routeId = 1;
  for (const [sectorId, routes] of Object.entries(routesBySector)) {
    for (const r of routes) {
      await db.executeSql(
        `INSERT INTO routes (sector_id, code, name, grade, description, cover_photo, set_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [sectorId, r.code, r.name, r.grade, r.description, `https://picsum.photos/seed/route_${routeId}/800/1200`, '2025-01-15'],
      );
      for (const tag of r.tags) {
        await db.executeSql(
          `INSERT INTO route_tags (route_id, tag) VALUES (?, ?)`,
          [routeId, tag],
        );
      }
      routeId++;
    }
  }

  // Seed 2 beta entries pointing to local video files
  // These use the bundled assets in src/assets/betas/
  await db.executeSql(
    `INSERT INTO betas (route_id, username, video_url, video_local_path, likes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [1, 'clement_climbs', '', 'beta_1', 256, '2025-01-20'],
  );
  await db.executeSql(
    `INSERT INTO betas (route_id, username, video_url, video_local_path, likes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [5, 'clement_climbs', '', 'beta_2', 180, '2025-02-10'],
  );
  await db.executeSql(
    `INSERT INTO betas (route_id, username, video_url, video_local_path, likes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [8, 'clement_climbs', '', 'beta_3', 312, '2025-03-01'], 
  );
  await db.executeSql(
    `INSERT INTO betas (route_id, username, video_url, video_local_path, likes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [4, 'clement_climbs', '', 'beta_4', 420, '2025-04-15'], 
  );
};

// ── Seed News ────────────────────────────────────────────────────────────────
export const seedNewsData = async (db: SQLiteDatabase): Promise<void> => {
  const initialNews = [
    { title: 'Ogata Yoshiyuki Workshop', subtitle: 'A Masterclass For Everyone', image_uri: 'src/assets/images/news_1.png' },
    { title: '2nd Anniversary Carnival', subtitle: 'Prize Pool: RM30,000 — 04-04-2026', image_uri: 'src/assets/images/news_2.png' },
    { title: 'New Route Reset', subtitle: 'Sectors V, VI, VII fully reset this week!', image_uri: 'src/assets/images/news_3.png' },
  ];
  for (const n of initialNews) {
    await db.executeSql(
      `INSERT INTO news (title, subtitle, image_uri, created_at) VALUES (?, ?, ?, date('now'))`,
      [n.title, n.subtitle, n.image_uri],
    );
  }
};

