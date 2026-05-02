import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { MOCK_ACHIEVEMENTS } from '../../api/mockData';
import { getUserBetaVideos } from '../../database/queries';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

// ─── Achievement Badge ─────────────────────────────────────────────────────
const AchievementBadge = ({ item }: { item: any }) => (
  <View style={[achStyles.badge, !item.unlocked && achStyles.locked]}>
    <View style={[achStyles.iconCircle, !item.unlocked && achStyles.iconCircleLocked]}>
      <Text style={achStyles.icon}>{item.unlocked ? item.icon : '🔒'}</Text>
    </View>
    <Text style={[achStyles.title, !item.unlocked && achStyles.lockedText]} numberOfLines={2}>
      {item.title}
    </Text>
    {item.unlocked && item.date && (
      <Text style={achStyles.date}>{item.date}</Text>
    )}
  </View>
);

const achStyles = StyleSheet.create({
  badge: {
    width: '30%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,128,4,0.4)',
    margin: '1.5%',
    ...Shadow.sm,
  },
  locked: { borderColor: Colors.border, opacity: 0.5 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(254,128,4,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(254,128,4,0.3)',
  },
  iconCircleLocked: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.border },
  icon: { fontSize: 26 },
  title: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 15 },
  lockedText: { color: Colors.textMuted },
  date: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
});

// ─── Helper Row Component ──────────────────────────────────────────────────
const ProfileRow = ({ 
  icon, title, value, badge, isDestructive, hideChevron, isLast, active, onPress 
}: any) => {
  return (
    <TouchableOpacity 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.rowItem, isLast && styles.rowItemLast, active && styles.rowItemActive]}
    >
      <View style={styles.rowIconContainer}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#C62828' : Colors.text} />
      </View>
      <Text style={[styles.rowText, isDestructive && styles.rowTextDestructive]}>{title}</Text>
      
      {badge ? (
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{badge}</Text>
        </View>
      ) : null}
      
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : null}
      
      {!hideChevron && !isDestructive && onPress && (
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState(0);
  const [myBetaVideos, setMyBetaVideos] = React.useState<any[]>([]);

  const unlockedCount = MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length;

  React.useEffect(() => {
    if (user?.username) {
      getUserBetaVideos(user.username).then(videos => {
        setMyBetaVideos(videos);
      });
    }
  }, [user?.username]);

  const toggleTab = (tabIndex: number) => {
    if (activeTab === tabIndex) setActiveTab(0);
    else setActiveTab(tabIndex);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Area */}
        <LinearGradient colors={[Colors.primary, Colors.primary]} style={styles.headerGradient}>
          <Image source={require('../../assets/icons/logo.png')} style={styles.logoImage} resizeMode="contain" />
          
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() ?? 'U'}
            </Text>
          </View>

          <Text style={styles.displayName}>{user?.name}</Text>
          <Text style={styles.username}>{user?.email || `@${user?.username}`}</Text>
        </LinearGradient>

        <View style={styles.bodyContainer}>
          {/* Inventories (Activity) */}
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.cardGroup}>
            <ProfileRow 
              icon="rocket-outline" title="Total Sends" value={user?.posts ?? 0} 
              onPress={() => navigation.navigate('SendsHistory')}
            />
            <ProfileRow 
              icon="trophy-outline" title="Achievements" badge={unlockedCount} 
              active={activeTab === 2} onPress={() => toggleTab(2)} 
            />
          </View>

          {/* Dynamic Content Displayed Below List */}
          {activeTab === 1 && (
            <View style={styles.tabContentBlock}>
              <View style={styles.myBetaGrid}>
                {myBetaVideos.map((v: any) => (
                  <View key={v.id} style={styles.betaThumb}>
                    <View style={styles.betaThumbBg}>
                      <Text style={{ fontSize: 28 }}>▶</Text>
                      <Text style={styles.betaThumbRoute}>{v.routeName}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 2 && (
            <View style={styles.tabContentBlock}>
              <View style={achStyles2.container}>
                <Text style={achStyles2.sectionHeader}>
                  🏆 {unlockedCount} Unlocked · {MOCK_ACHIEVEMENTS.length - unlockedCount} Remaining
                </Text>
                <View style={achStyles2.grid}>
                  {MOCK_ACHIEVEMENTS.map(item => (
                    <AchievementBadge key={item.id} item={item} />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Preferences */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.cardGroup}>
            <ProfileRow 
              icon="card-outline" title="Membership" value={user?.membershipType} hideChevron
            />
            <ProfileRow 
              icon="log-out-outline" title="Logout" isDestructive isLast onPress={logout} 
            />
          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

    </View>
  );
};

const achStyles2 = StyleSheet.create({
  container: { padding: Spacing.base },
  sectionHeader: { fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)", fontWeight: '700', marginBottom: Spacing.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark },
  scrollContent: { paddingBottom: 40 },
  headerGradient: { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logoImage: { width: 40, height: 40, position: 'absolute', top: 60 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#8FD9A8',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 50, marginBottom: 16,
    ...Shadow.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#1A1A2E' },
  displayName: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  username: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  bodyContainer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.base },
  sectionTitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 24,
  },
  cardGroup: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowItemActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rowItemLast: { borderBottomWidth: 0 },
  rowIconContainer: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  rowText: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '500' },
  rowTextDestructive: { color: '#C62828' },
  rowBadge: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
  },
  rowBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  rowValue: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginRight: 8 },
  tabContentBlock: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -16,
    paddingTop: 16,
    marginBottom: Spacing.md,
  },
  myBetaGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.base, gap: 2 },
  betaThumb: { width: '32.5%', aspectRatio: 0.75 },
  betaThumbBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', gap: 6 },
  betaThumbRoute: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 4 },

});

export default ProfileScreen;
