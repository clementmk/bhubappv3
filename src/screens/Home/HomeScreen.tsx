import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Image, StatusBar, ScrollView, ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { MOCK_NEWS } from '../../api/mockData';
import { getCommunityPosts, deleteCommunityPost } from '../../database/queries';
import { Colors, Spacing, FontSize, BorderRadius, Shadow, Fonts } from '../../theme';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CreatePostModal from '../../components/Feed/CreatePostModal';
import { getDB } from '../../database/db';
import { communityAPI } from '../../api/cloudAPI'; // 👈 Add cloud API import
import { useWebSocket, WS_EVENTS } from '../../api/websocket';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── News Bar ────────────────────────────────────────────────────────────────
const NEWS_COLORS = [
  ['#FE8004', '#D96A00'],
  ['#D96A00', '#8B2500'],
  ['#1A1A2E', '#FE8004'],
];

const NEWS_IMAGES: Record<string, any> = {
  'src/assets/images/news_1.png': require('../../assets/images/news_1.png'),
  'src/assets/images/news_2.png': require('../../assets/images/news_2.png'),
  'src/assets/images/news_3.png': require('../../assets/images/news_3.png'),
};

const NewsBadgeCard = ({ item, index }: { item: any; index: number }) => {
  const uriStr = item.image_uri || item.imageKey;
  let source;

  if (uriStr && NEWS_IMAGES[uriStr]) {
    source = NEWS_IMAGES[uriStr];
  } else if (uriStr && uriStr.startsWith('http')) {
    source = { uri: uriStr };
  } else {
    source = undefined;
  }

  return (
    <ImageBackground
      source={source}
      style={[newsStyles.card, { backgroundColor: NEWS_COLORS[index % NEWS_COLORS.length][0] }]}
      imageStyle={{ borderRadius: BorderRadius.xl, opacity: 0.6 }}
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.xl }]}
      />
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Text style={newsStyles.subtitle}>ONLY AT BHUB</Text>
        <Text style={newsStyles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={newsStyles.sub} numberOfLines={1}>{item.subtitle}</Text>
        <View style={newsStyles.cta}>
          <Text style={newsStyles.ctaText}>Learn More →</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const newsStyles = StyleSheet.create({
  card: {
    width: SCREEN_W - Spacing.xl * 2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  subtitle: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.base },
  cta: { alignSelf: 'flex-start' },
  ctaText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '700' },
});

// ─── Feed Item ────────────────────────────────────────────────────────────────
const typeColors: Record<string, string> = {
  text: Colors.textMuted,
  beta: Colors.primary,
  thread: Colors.warning,
};

const FeedItem = ({ item, onLike, onVideoPress, onDelete, currentUsername }: { item: any; onLike: (id: string, isLiked: boolean) => void; onVideoPress?: (item: any) => void; onDelete?: (id: string) => void; currentUsername?: string }) => {
  const [liked, setLiked] = useState(item.liked);
  const [likes, setLikes] = useState(item.likes);
  const scale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setLiked(!liked);
    setLikes((l: number) => liked ? l - 1 : l + 1);
    onLike(item.id, !liked);
  };

  const initials = item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <View style={feedStyles.card}>
      <View style={feedStyles.header}>
        <View style={feedStyles.avatar}>
          <Text style={feedStyles.avatarText}>{initials}</Text>
        </View>
        <View style={feedStyles.userInfo}>
          <Text style={feedStyles.userName}>{item.user.name}</Text>
          <View style={feedStyles.metaRow}>
            <Text style={feedStyles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
        {onDelete && currentUsername && item.user.username === currentUsername && (
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={feedStyles.deleteBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={feedStyles.content}>{item.content}</Text>

      {item.image_uri ? (
        <Image source={{ uri: item.image_uri }} style={feedStyles.mediaBlock} />
      ) : null}

      {item.video_uri ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onVideoPress?.(item)} style={[feedStyles.mediaBlock, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      ) : null}

      <View style={feedStyles.actions}>
        <TouchableOpacity onPress={handleLike} style={feedStyles.actionBtn} activeOpacity={0.7}>
          <Animated.View style={[{ transform: [{ scale }] }]}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? '#B30000' : '#FFFFFF'} />
          </Animated.View>
          <Text style={[feedStyles.actionCount, liked && feedStyles.likedCount]}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedStyles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
          <Text style={feedStyles.actionCount}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedStyles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="repeat-outline" size={22} color="#FFFFFF" />
          <Text style={feedStyles.actionCount}>{item.shares}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedStyles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const feedStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: { fontSize: FontSize.md, fontWeight: '800', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.md, fontWeight: '700', color: '#FFFFFF' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  typeBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },
  timestamp: { fontSize: FontSize.xs, color: '#FFFFFF' },
  content: { fontSize: FontSize.md, color: '#FFFFFF', lineHeight: 22, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 6 },
  mediaBlock: { width: '100%', height: 260, borderRadius: BorderRadius.md, marginBottom: Spacing.base, backgroundColor: 'rgba(0,0,0,0.2)' },
  actionIcon: { fontSize: 18 },
  actionCount: { fontSize: FontSize.sm, color: '#FFFFFF' },
  likedIcon: {},
  likedCount: { color: '#B30000' },
  deleteBtn: { padding: 6 },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [newsData, setNewsData] = useState<any[]>(MOCK_NEWS);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatePostVisible, setCreatePostVisible] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const newsRef = useRef<FlatList>(null);
  const newsTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // WebSocket hook for real-time updates
  const { lastMessage } = useWebSocket(user?.username);

const fetchFeed = async () => {
  try {
    const response = await communityAPI.getPosts(1, 30);
    
    // Check if the response has the "posts" property
    if (response && response.posts) {
      // ✅ This is the fix: extract the array from the object
      setFeedData(response.posts); 
    } else {
      // Fallback if the cloud fails or returns local array format
      const localPosts = await getCommunityPosts();
      setFeedData(localPosts);
    }
  } catch (e) {
    console.log('Failed to fetch feed:', e);
  }
};

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFeed();
    setIsRefreshing(false);
  };

  // Listen for real-time post creation
  useEffect(() => {
    if (lastMessage?.type === WS_EVENTS.POST_CREATED) {
      const newPost = lastMessage.payload;
      setFeedData(prev => {
        // Prevent duplicates
        if (prev.some(p => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    }
  }, [lastMessage]);

  useEffect(() => {
    let isMounted = true;
    const fetchNews = async () => {
      try {
        const db = await getDB();
        const [result] = await db.executeSql('SELECT * FROM news ORDER BY id ASC');
        const count = result.rows.length;
        if (count > 0 && isMounted) {
          const loadedNews = [];
          for (let i = 0; i < count; i++) {
            loadedNews.push(result.rows.item(i));
          }
          setNewsData(loadedNews);
        }
      } catch (e) {
        console.log('Failed to fetch news from DB:', e);
      }
    };
    fetchNews();
    fetchFeed();
    return () => { isMounted = false; };
  }, []);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex >= 0 && roundIndex !== currentNewsIndex) {
      setCurrentNewsIndex(roundIndex);
    }
  };

  useEffect(() => {
    if (newsData.length === 0) return;
    newsTimer.current = setInterval(() => {
      setCurrentNewsIndex(prev => {
        const next = (prev + 1) % newsData.length;
        newsRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => { if (newsTimer.current) clearInterval(newsTimer.current); };
  }, [newsData.length]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      await communityAPI.togglePostLike(postId, isLiked);
    } catch (e) {
      console.log('Failed to toggle post like:', e);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteCommunityPost(Number(postId));
      setFeedData(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      console.log('Failed to delete post:', e);
    }
  };

  const listHeaderNode = (
    <>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.hamburger}>
          <View style={styles.hLine} />
          <View style={[styles.hLine, { width: 18 }]} />
          <View style={styles.hLine} />
        </TouchableOpacity>
        <Image
          source={require('../../assets/icons/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={{ width: 32 }} />
      </View>

      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || 'Climber'}</Text>
        <Text style={styles.subGreeting}>Ready to crush some problems?</Text>
      </View>

      {/* News Bar */}
      <Text style={styles.sectionTitle}>What's On</Text>
      <FlatList
        ref={newsRef}
        data={newsData}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item, index }) => <NewsBadgeCard item={item} index={index} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        onScrollToIndexFailed={() => { }}
      />
      {/* Pagination Dots */}
      <View style={styles.dotsRow}>
        {newsData.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentNewsIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.feedHeaderRow}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0, paddingHorizontal: 0 }]}>Community Feed</Text>
        <TouchableOpacity style={styles.addPostBtn} onPress={() => setCreatePostVisible(true)}>
          <Ionicons name="add-circle" size={32} color="#8B2500" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgb(254,128,4)" />
      <FlatList
        data={feedData}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <FeedItem 
            item={item} 
            onLike={handleLike}
            onDelete={handleDelete}
            currentUsername={user?.username}
            onVideoPress={(v) => navigation.navigate('BetaTab')}
          />
        )}
        ListHeaderComponent={listHeaderNode}
        ListFooterComponent={<View style={{ height: 100 }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      <CreatePostModal 
        visible={isCreatePostVisible} 
        onClose={() => setCreatePostVisible(false)} 
        onPostCreated={handleRefresh} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(254,128,4)' },
  listContent: { paddingBottom: Spacing.base },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.base,
  },
  addPostBtn: { padding: 4 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  hamburger: { gap: 5, padding: 4 },
  hLine: { width: 24, height: 2, backgroundColor: Colors.text, borderRadius: 1 },
  logoImage: {
    width: 40,
    height: 40,
  },
  welcomeSection: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },
  greeting: { fontSize: 40, color: Colors.text, fontFamily: Fonts.kodchasan },
  subGreeting: { fontSize: FontSize.md, color: '#FFFFFF', marginTop: 4 },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '800', color: '#8B2500',
    letterSpacing: 2, paddingHorizontal: Spacing.xl, marginBottom: Spacing.base,
    textTransform: 'uppercase',
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.base, marginBottom: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },
});

export default HomeScreen;
