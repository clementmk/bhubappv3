import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { getAllBetas } from '../../database/queries';
import { Colors, FontSize, Spacing } from '../../theme';
import { useIsFocused } from '@react-navigation/native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Map of bundled local beta videos in src/assets/betas/
const LOCAL_BETA_VIDEOS: Record<string, any> = {
  beta_1: require('../../assets/betas/beta1.mp4'),
  beta_2: require('../../assets/betas/beta2.mp4'),
  beta_3: require('../../assets/betas/beta3.mp4'),
  beta_4: require('../../assets/betas/beta4.mp4'),
};

interface BetaItem {
  id: string;
  username: string;
  uploaderName: string;
  routeName: string;
  sectorName: string;
  videoSource: any; // could be require() or { uri: string }
  likes: number;
  description: string;
}

const VideoCard = ({ item, isActive }: { item: BetaItem; isActive: boolean }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.5, duration: 120, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setLiked(v => !v);
    setLikes(l => liked ? l - 1 : l + 1);
  };

  const initials = (item.uploaderName || item.username || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <View style={cardStyles.container}>
      {/* Video Layer */}
      <Video
        source={item.videoSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        paused={!isActive}
        muted={false}
        ignoreSilentSwitch="ignore" // 
      />

      {/* Gradient overlay */}
      <View style={cardStyles.gradientOverlay} />

      {/* Right Action Bar */}
      <View style={cardStyles.actionBar}>
        <TouchableOpacity style={cardStyles.actionItem} onPress={handleLike} activeOpacity={0.8}>
          <Animated.View style={[{ transform: [{ scale: heartScale }] }]}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={32} color={liked ? '#B30000' : '#FFFFFF'} />
          </Animated.View>
          <Text style={cardStyles.actionCount}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cardStyles.actionItem} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={32} color="#FFFFFF" />
          <Text style={cardStyles.actionCount}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cardStyles.actionItem} activeOpacity={0.8}>
          <Ionicons name="repeat-outline" size={34} color="#FFFFFF" />
          <Text style={cardStyles.actionCount}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cardStyles.actionItem} activeOpacity={0.8}>
          <Ionicons name="paper-plane-outline" size={32} color="#FFFFFF" />
          <Text style={cardStyles.actionCount}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={cardStyles.bottomInfo}>
        {/* Avatar + Username */}
        <View style={cardStyles.userRow}>
          <View style={cardStyles.avatar}>
            <Text style={cardStyles.avatarText}>{initials}</Text>
          </View>
          <Text style={cardStyles.username}>@{item.username}</Text>
        </View>

        {/* Route tag */}
        <View style={cardStyles.routeTag}>
          <Text style={cardStyles.routeTagText}>📍 {item.routeName} · {item.sectorName}</Text>
        </View>

        {/* Description */}
        <Text style={cardStyles.description} numberOfLines={2}>{item.description}</Text>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: { width: SCREEN_W, height: SCREEN_H, backgroundColor: Colors.background },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    paddingTop: SCREEN_H * 0.5,
  },
  actionBar: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 120,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  actionItem: { alignItems: 'center', gap: 2 },
  actionIcon: { fontSize: 30 },
  actionCount: { fontSize: FontSize.xs, color: Colors.text, fontWeight: '700' },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.base,
    right: 80,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.text,
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  username: { fontSize: FontSize.base, fontWeight: '800', color: Colors.text },
  routeTag: {
    backgroundColor: 'rgba(254,128,4,0.8)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  routeTagText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text },
  description: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
});

// ─── Beta Screen ─────────────────────────────────────────────────────────────
const BetaScreen = () => {
  const [videos, setVideos] = useState<BetaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });

  const isFocused = useIsFocused();

  React.useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getAllBetas();
        const formatted: BetaItem[] = data.map((v: any) => {
          // Determine the video source: local bundled asset, local file path, or remote URL
          let videoSource: any;
          if (v.video_local_path && LOCAL_BETA_VIDEOS[v.video_local_path]) {
            // Bundled asset (e.g. 'beta_1' matches require())
            videoSource = LOCAL_BETA_VIDEOS[v.video_local_path];
          } else if (v.video_local_path && v.video_local_path.startsWith('/')) {
            // Absolute path on filesystem (user-uploaded video)
            videoSource = { uri: 'file://' + v.video_local_path };
          } else if (v.video_url) {
            videoSource = { uri: v.video_url };
          } else {
            videoSource = LOCAL_BETA_VIDEOS['beta_1']; // fallback
          }

          return {
            id: v.id.toString(),
            username: v.username || 'unknown',
            uploaderName: v.uploaderName || v.username || 'Unknown',
            routeName: v.routeName || 'Community Beta',
            sectorName: v.sectorName || 'BHUB',
            videoSource,
            likes: v.likes || 0,
            description: `Beta for ${v.routeName || 'route'} at ${v.sectorName || 'BHUB'} 🔥`,
          };
        });
        setVideos(formatted);
      } catch (err) {
        console.log('Failed to fetch betas', err);
      }
    };
    fetchVideos();
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  return (
    <View style={betaStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={betaStyles.header}>
        <Text style={betaStyles.title}>Beta</Text>
        <TouchableOpacity style={betaStyles.uploadBtn} activeOpacity={0.8}>
          <Ionicons name="add" size={36} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <VideoCard item={item} isActive={index === activeIndex && isFocused} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
};

const betaStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    position: 'absolute',
    top: Spacing.xxxl,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  uploadBtn: {
    padding: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadIcon: { fontSize: 22, color: Colors.text, fontWeight: '700', lineHeight: 28 },
});

export default BetaScreen;
