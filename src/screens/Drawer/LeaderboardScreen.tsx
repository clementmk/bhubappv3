import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { getDB } from '../../database/db';
import { userAPI } from '../../api/cloudAPI';
import { useWebSocket, WS_EVENTS } from '../../api/websocket';
import { useAuth } from '../../context/AuthContext';


const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Define the type based on what our SQL query will return
type LeaderboardUser = {
  rank: number;
  username: string;
  name: string;
  sends: number;
  points: number;
  grade: string;
};

const LeaderboardScreen = ({ navigation }: any) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // ── WebSocket: re-fetch instantly when any route is logged ────────────────
  const { lastMessage } = useWebSocket();

  // ── Core fetch function ───────────────────────────────────────────────────
const fetchLeaderboard = useCallback(async () => {
  setIsLoading(true);
  let finalData: LeaderboardUser[] = []; // Initialized as empty array

  try {
    // 1. Try Cloud
    try {
      const response = await userAPI.getLeaderboard(50);
      const cloudData = response?.leaderboard;

      if (Array.isArray(cloudData) && cloudData.length > 0) {
        // Assign the mapped array directly to finalData
        finalData = cloudData.map((item: any) => ({
          username: item.username,
          name: item.name || item.username,
          sends: Number(item.sends) || 0,
          points: Number(item.points) || 0,
          grade: item.grade || 'V0',
          rank: 0, // Placeholder, will be updated after sort
        }));
      }
    } catch (cloudError) {
      console.log('Cloud leaderboard unavailable');
      // Step 2: Fallback to Local could go here if cloudData was empty
    }

    // 3. MANDATORY SORT
    // Note: Use .slice() if you want to be extra safe with immutability
    finalData.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points; // Descending: Higher points first
      }
      return b.sends - a.sends; // Tie-breaker: More sends
    });

    // 4. Assign Ranks
    const rankedData = finalData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setLeaderboardData(rankedData);
  } catch (error) {
    console.error('Leaderboard error:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

  // ── Re-fetch every time the screen comes into focus ───────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [fetchLeaderboard])
  );

  // ── Re-fetch instantly on real-time leaderboard_updated WebSocket event ───
  React.useEffect(() => {
    if (
      lastMessage?.type === WS_EVENTS.LEADERBOARD_UPDATED ||
      lastMessage?.type === WS_EVENTS.ROUTE_COMPLETED
    ) {
      fetchLeaderboard();
    }
  }, [lastMessage, fetchLeaderboard]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 10 }} />}
        </View>
        <Text style={styles.subtitle}>Top senders this month</Text>
      </LinearGradient>

      <FlatList
        data={leaderboardData}
        keyExtractor={item => item.username} // Changed to username since it's unique
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isMe = item.username === user?.username;
          return (
            <View style={[styles.row, isMe && styles.rowMe]}>
              <Text style={styles.rank}>
                {MEDAL[item.rank] ?? `#${item.rank}`}
              </Text>
              <View style={[styles.avatar, isMe && styles.avatarMe]}>
                <Text style={styles.avatarText}>
                  {item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, isMe && styles.nameMe]}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <View style={styles.statsGroup}>
                <Text style={[styles.points, isMe && styles.pointsMe]}>{item.points}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
              <View style={styles.statsGroup}>
                <Text style={[styles.sends, isMe && styles.sendsMe]}>{item.sends}</Text>
                <Text style={styles.sendsLabel}>sends</Text>
              </View>
              <View style={styles.gradePill}>
                <Text style={styles.gradePillText}>{item.grade}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background },
  header: { 
    paddingTop: Spacing.xxxl, 
    paddingHorizontal: Spacing.xl, 
    paddingBottom: Spacing.xl },
  backBtn: { 
    marginBottom: Spacing.base },
  backText: { 
    color: Colors.primary, 
    fontSize: FontSize.base, 
    fontWeight: '600' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { 
    fontSize: FontSize.xxl, 
    fontWeight: '900', 
    color: Colors.text },
  subtitle: { 
    fontSize: FontSize.md, 
    color: Colors.textSecondary, 
    marginTop: 4 },
  list: { 
    padding: Spacing.base },
  row: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.lg,
    padding: Spacing.base, 
    marginBottom: Spacing.sm,
    borderWidth: 1, 
    borderColor: Colors.border, 
    gap: Spacing.sm,
  },
  rowMe: { 
    borderColor: Colors.primary, 
    backgroundColor: 'rgba(254,128,4,0.1)' },
  rank: { 
    fontSize: 22, 
    width: 36, 
    textAlign: 'center' },
  avatar: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  avatarMe: { 
    backgroundColor: Colors.primary },
  avatarText: { 
    fontSize: FontSize.sm, 
    fontWeight: '800', 
    color: Colors.text },
  info: { 
    flex: 1 },
  name: { 
    fontSize: FontSize.md, 
    fontWeight: '700', 
    color: Colors.text },
  nameMe: { 
    color: Colors.primary },
  username: { 
    fontSize: FontSize.xs, 
    color: Colors.textMuted },
  statsGroup: { 
    alignItems: 'center', 
    marginRight: 10 },
  points: { 
    fontSize: FontSize.lg, 
    fontWeight: '900', 
    color: Colors.text },
  pointsMe: { 
    color: Colors.primary },
  pointsLabel: { 
    fontSize: FontSize.xs, 
    color: Colors.textMuted },
  sends: { 
    fontSize: FontSize.lg, 
    fontWeight: '900', 
    color: Colors.text },
  sendsMe: { 
    color: Colors.primary },
  sendsLabel: { 
    fontSize: FontSize.xs, 
    color: Colors.textMuted },
  gradePill: { 
    backgroundColor: Colors.surfaceAlt, 
    borderRadius: BorderRadius.sm, 
    paddingHorizontal: 8, 
    paddingVertical: 4 },
  gradePillText: { 
    fontSize: FontSize.xs, 
    fontWeight: '800', 
    color: Colors.primary },
});

export default LeaderboardScreen;