import { getDB } from './db';
import { Sector, Route, RouteDetail, Beta, User, CommunityPost } from './schema';
import RNFS from 'react-native-fs';

// ═══════════════════════════════════════════════════════════════════════════════
//  USER QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = await getDB();
  const [result] = await db.executeSql('SELECT * FROM users WHERE email = ?;', [email]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0);
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const db = await getDB();
  const [result] = await db.executeSql('SELECT * FROM users WHERE username = ?;', [username]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0);
};

export const createUser = async (
  username: string,
  name: string,
  email: string,
  password: string,
): Promise<void> => {
  const db = await getDB();
  const date = new Date().toISOString().split('T')[0];
  await db.executeSql(
    `INSERT INTO users (username, name, email, password, avatar, posts, membershipType, membershipExpiry, created_at)
     VALUES (?, ?, ?, ?, null, 0, 'Standard Pass', '2027-01-01', ?)`,
    [username, name, email, password, date],
  );
};

export const incrementUserPosts = async (username: string): Promise<void> => {
  const db = await getDB();
  await db.executeSql('UPDATE users SET posts = posts + 1 WHERE username = ?;', [username]);
};

export const updateUserMembership = async (
  username: string,
  membershipType: string,
  membershipExpiry: string,
): Promise<void> => {
  const db = await getDB();
  await db.executeSql(
    'UPDATE users SET membershipType = ?, membershipExpiry = ? WHERE username = ?;',
    [membershipType, membershipExpiry, username],
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTOR & ROUTE QUERIES (unchanged logic)
// ═══════════════════════════════════════════════════════════════════════════════

export const getSectors = async (): Promise<Sector[]> => {
  const db = await getDB();
  const [result] = await db.executeSql('SELECT * FROM sectors ORDER BY id;');
  const sectors: Sector[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    sectors.push(result.rows.item(i));
  }
  return sectors;
};

export const getSectorById = async (sectorId: string): Promise<Sector | null> => {
  const db = await getDB();
  const [result] = await db.executeSql('SELECT * FROM sectors WHERE id = ?;', [sectorId]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0);
};

export const getRoutesBySector = async (sectorId: string): Promise<Route[]> => {
  const db = await getDB();
  const [result] = await db.executeSql(
    'SELECT * FROM routes WHERE sector_id = ? AND is_active = 1 ORDER BY code;',
    [sectorId],
  );
  const routes: Route[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const route = result.rows.item(i);
    const [tagResult] = await db.executeSql(
      'SELECT tag FROM route_tags WHERE route_id = ?;',
      [route.id],
    );
    const tags: string[] = [];
    for (let j = 0; j < tagResult.rows.length; j++) {
      tags.push(tagResult.rows.item(j).tag);
    }
    routes.push({ ...route, tags });
  }
  return routes;
};

export const getRouteDetail = async (routeId: number): Promise<RouteDetail | null> => {
  const db = await getDB();
  const [routeResult] = await db.executeSql(
    'SELECT * FROM routes WHERE id = ?;',
    [routeId],
  );
  if (routeResult.rows.length === 0) return null;
  const route = routeResult.rows.item(0);

  const [tagResult] = await db.executeSql(
    'SELECT tag FROM route_tags WHERE route_id = ?;',
    [routeId],
  );
  const tags: string[] = [];
  for (let j = 0; j < tagResult.rows.length; j++) {
    tags.push(tagResult.rows.item(j).tag);
  }

  const betas = await getBetasForRoute(routeId);
  return { ...route, tags, betas };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  BETA QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const getBetasForRoute = async (routeId: number): Promise<Beta[]> => {
  const db = await getDB();
  const [result] = await db.executeSql(
    'SELECT * FROM betas WHERE route_id = ? ORDER BY likes DESC;',
    [routeId],
  );
  const betas: Beta[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    betas.push(result.rows.item(i));
  }
  return betas;
};

export const getAllBetas = async (): Promise<any[]> => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT b.*, r.name as routeName, s.name as sectorName, u.name as uploaderName
     FROM betas b
     LEFT JOIN routes r ON b.route_id = r.id
     LEFT JOIN sectors s ON r.sector_id = s.id
     LEFT JOIN users u ON b.username = u.username
     ORDER BY b.likes DESC
     LIMIT 20;`,
  );
  const betas: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    betas.push(result.rows.item(i));
  }
  return betas;
};

export const getUserBetaVideos = async (username: string): Promise<any[]> => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT b.*, r.name as routeName, s.name as sectorName
     FROM betas b
     LEFT JOIN routes r ON b.route_id = r.id
     LEFT JOIN sectors s ON r.sector_id = s.id
     WHERE b.username = ?
     ORDER BY b.created_at DESC;`,
    [username],
  );
  const betas: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    betas.push(result.rows.item(i));
  }
  return betas;
};

// ─── Helper function for Grade Calculation ───────────────────────────────────
// Converts a string like 'V4' into the number 4 so we can do math with it.
const parseGradeNumber = (grade: string): number => {
  if (!grade) return 0;
  const match = grade.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTE COMPLETION + VIDEO UPLOAD + POINTS LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

export const logRouteCompletion = async (
  routeId: number,
  username: string,
  attempts: string,
  videoFileUri?: string,
): Promise<void> => {
  const db = await getDB();
  const date = new Date().toISOString().split('T')[0];

  let savedVideoPath = '';

  // 1. Save Video (If provided)
  if (videoFileUri && videoFileUri.trim()) {
    const filename = `beta_${username}_${Date.now()}.mp4`;
    const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
    try {
      await RNFS.copyFile(videoFileUri, destPath);
      savedVideoPath = destPath;
    } catch (err) {
      console.error('Failed to copy video file:', err);
    }
  }

  // 2. Log the route completion
  await db.executeSql(
    `INSERT INTO route_completions (route_id, username, attempts, video_url, video_local_path, created_at)
     VALUES (?, ?, ?, '', ?, ?);`,
    [routeId, username, attempts, savedVideoPath, date],
  );

  // 3. Create a beta entry if a video was uploaded
  if (savedVideoPath) {
    await db.executeSql(
      `INSERT INTO betas (route_id, username, video_url, video_local_path, likes, created_at)
       VALUES (?, ?, '', ?, 0, ?);`,
      [routeId, username, savedVideoPath, date],
    );
  }

  // 4. FETCH ROUTE GRADE TO CALCULATE POINTS
  const [routeRes] = await db.executeSql('SELECT grade FROM routes WHERE id = ?;', [routeId]);
  let routeGrade = 'V0';
  if (routeRes.rows.length > 0) {
    routeGrade = routeRes.rows.item(0).grade || 'V0';
  }

  // Assign points based on route grade: V0-V1=0pts, V2=100pts, V3=200pts, V4=300pts, etc.
  const gradeNum = parseGradeNumber(routeGrade);
  const pointsEarned = Math.max(0, (gradeNum - 1) * 100);

  // 5. UPDATE USER STATS (Points and Highest Grade)
  const [userRes] = await db.executeSql('SELECT highest_grade FROM users WHERE username = ?;', [username]);
  let currentHighest = 'V0';
  if (userRes.rows.length > 0) {
    currentHighest = userRes.rows.item(0).highest_grade || 'V0';
  }

  const currentMaxNum = parseGradeNumber(currentHighest);
  const newHighest = gradeNum > currentMaxNum ? routeGrade : currentHighest;

  // Update points, posts, and highest_grade all in one query!
  await db.executeSql(
    `UPDATE users SET posts = posts + 1, points = points + ?, highest_grade = ? WHERE username = ?;`,
    [pointsEarned, newHighest, username]
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  COMMUNITY FEED QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const getCommunityPosts = async (): Promise<any[]> => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT cp.*, u.name as userName, u.avatar as userAvatar
     FROM community_posts cp
     LEFT JOIN users u ON cp.username = u.username
     ORDER BY cp.id DESC
     LIMIT 30;`,
  );
  const posts: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    posts.push({
      id: row.id.toString(),
      user: {
        name: row.userName || row.username,
        username: row.username,
        avatar: row.userAvatar,
      },
      content: row.content,
      type: row.type,
      image_uri: row.image_uri,
      video_uri: row.video_uri,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      liked: false,
      timestamp: row.timestamp || 'Just now',
    });
  }
  return posts;
};

export const createCommunityPost = async (
  username: string,
  content: string,
  type: string,
  imageUri: string,
  videoUri: string,
): Promise<void> => {
  const db = await getDB();
  await db.executeSql(
    `INSERT INTO community_posts (username, content, type, image_uri, video_uri, likes, comments, shares, timestamp, created_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'Just now', date('now'))`,
    [username, content, type, imageUri, videoUri],
  );
};

export const deleteCommunityPost = async (postId: number): Promise<void> => {
  const db = await getDB();
  await db.executeSql('DELETE FROM community_posts WHERE id = ?;', [postId]);
};

export const getUserSends = async (username: string): Promise<any[]> => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT rc.*, r.name as routeName, r.grade as routeGrade, s.name as sectorName
     FROM route_completions rc
     LEFT JOIN routes r ON rc.route_id = r.id
     LEFT JOIN sectors s ON r.sector_id = s.id
     WHERE rc.username = ?
     ORDER BY rc.created_at DESC, rc.id DESC;`,
    [username],
  );
  const sends: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    sends.push(result.rows.item(i));
  }
  return sends;
};
