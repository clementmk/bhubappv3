const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './bhub.db';
const db = new sqlite3.Database(dbPath);

// Helper function for async/await support in Node.js
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const seedAllData = async () => {
  try {
    console.log("🌱 Initializing Cloud Data Seeding...");

    // 1. Seed Default User (Crucial for completion logs)
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('123456', 10);
    
    const usersToSeed = [
      ['clement_climbs', 'Clement', 'clement@bhub.app', defaultPassword, 0, 'V0'],
      ['tomoa', 'Tomoa', 'tomoa@gmail.com', defaultPassword, 0, 'V0'],
    ];

    for (const u of usersToSeed) {
      await runQuery(
        `INSERT OR IGNORE INTO users (username, name, email, password, points, highest_grade) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        u
      );
    }

    // 2. Seed Sectors
    const sectors = [
      { id: 'I', name: 'Sector I', x: 0.12, y: 0.48 },
      { id: 'II', name: 'Sector II', x: 0.28, y: 0.13 },
      { id: 'III', name: 'Sector III', x: 0.55, y: 0.13 },
      { id: 'IV', name: 'Sector IV', x: 0.82, y: 0.22 },
      { id: 'V', name: 'Sector V', x: 0.85, y: 0.36 },
      { id: 'VI', name: 'Sector VI', x: 0.85, y: 0.48 },
      { id: 'VII', name: 'Sector VII', x: 0.85, y: 0.62 },
      { id: 'VIII', name: 'Sector VIII', x: 0.80, y: 0.75 },
      { id: 'IX', name: 'Sector IX', x: 0.60, y: 0.45 },
      { id: 'X', name: 'Sector X', x: 0.60, y: 0.58 },
      { id: 'XI', name: 'Sector XI', x: 0.45, y: 0.72 },
      { id: 'XII', name: 'Sector XII', x: 0.43, y: 0.60 },
      { id: 'XIII', name: 'Sector XIII', x: 0.43, y: 0.45 },
      { id: 'K', name: 'Sector K', x: 0.12, y: 0.27 },
      { id: 'M', name: 'Sector M', x: 0.43, y: 0.36 },
    ];

    for (const s of sectors) {
      await runQuery(
        `INSERT OR IGNORE INTO sectors (id, name, label_x, label_y, color) VALUES (?, ?, ?, ?, ?)`,
        [s.id, s.name, s.x, s.y, '#FE8004']
      );
    }

    // 3. Seed Routes & Tags
    const routesBySector = {
      I: [
        { code: 'B1', name: 'Iron Slab', grade: 'V3', tags: ['Slab', 'Technical'] },
        { code: 'B2', name: 'Left Hook', grade: 'V4', tags: ['Crimpy', 'Technical'] },
        { code: 'B3', name: 'Power Pull', grade: 'V6', tags: ['Strength', 'Dynamic'] },
      ],
      II: [
        { code: 'B1', name: 'Orange Crush', grade: 'V2', tags: ['Dynamic'] },
        { code: 'B2', name: 'Ceiling Cat', grade: 'V5', tags: ['Strength', 'Dynamic'] },
        { code: 'B3', name: 'Disco Fever', grade: 'V4', tags: ['Technical', 'Slab'] },
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
        await runQuery(
          `INSERT OR IGNORE INTO routes (id, sector_id, code, name, grade, is_active) 
           VALUES (?, ?, ?, ?, ?, 1)`,
          [routeId, sectorId, r.code, r.name, r.grade]
        );

        if (r.tags) {
          for (const tag of r.tags) {
            await runQuery(`INSERT OR IGNORE INTO route_tags (route_id, tag) VALUES (?, ?)`, [routeId, tag]);
          }
        }
        routeId++;
      }
    }

    // 4. Seed News
    const news = [
      { title: 'Ogata Yoshiyuki Workshop', subtitle: 'A Masterclass For Everyone' },
      { title: '2nd Anniversary Carnival', subtitle: 'Prize Pool: RM30,000' }
    ];

    for (const n of news) {
      await runQuery(
        `INSERT OR IGNORE INTO news (title, subtitle, published) VALUES (?, ?, 1)`,
        [n.title, n.subtitle]
      );
    }

    console.log("✅ Database Seeding Complete!");
    db.close();
  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    db.close();
  }
};

seedAllData();