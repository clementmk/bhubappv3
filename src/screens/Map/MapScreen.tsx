import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, ScrollView, Modal, FlatList, StatusBar,
  Animated, ActivityIndicator, SafeAreaView, Alert, ImageBackground
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';
import { initDB } from '../../database/db';
import { getRoutesBySector, getRouteDetail, getSectorById, logRouteCompletion } from '../../database/queries';
import { Sector, Route, RouteDetail } from '../../database/schema';
import LinearGradient from 'react-native-linear-gradient';
import GymMapSvg from '../../components/GymMapSvg';
import { useAuth } from '../../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { useIsFocused } from '@react-navigation/native';
import { useWebSocket, wsHelpers } from '../../api/websocket'; // 👈 Add WebSocket import
import { betaAPI } from '../../api/cloudAPI';
import { routeAPI } from '../../api/cloudAPI';

const SECTOR_IMAGES: Record<string, any> = {
  I: require('../../assets/images/Sector/Sector-I.png'),
  II: require('../../assets/images/Sector/Sector-II.png'),
  III: require('../../assets/images/Sector/Sector-III.png'),
  IV: require('../../assets/images/Sector/Sector-IV.png'),
  V: require('../../assets/images/Sector/Sector-V.png'),
  VI: require('../../assets/images/Sector/Sector-VI.png'),
  VII: require('../../assets/images/Sector/Sector-VII.png'),
  VIII: require('../../assets/images/Sector/Sector-VIII.png'),
  IX: require('../../assets/images/Sector/Sector-IX.png'),
  X: require('../../assets/images/Sector/Sector-X.png'),
  XI: require('../../assets/images/Sector/Sector-XI.png'),
  XII: require('../../assets/images/Sector/Sector-XII.png'),
  XIII: require('../../assets/images/Sector/Sector-XIII.png'),
  K: require('../../assets/images/Sector/Sector-K.png'),
  M: require('../../assets/images/Sector/Sector-M.png'),
};

const ROUTE_IMAGES = [
  require('../../assets/images/Route/Route_1.png'),
  require('../../assets/images/Route/Route_2.png'),
  require('../../assets/images/Route/Route_3.png'),
];

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Floorplan image dimensions (aspect ratio: 391×956 from original)
const PLAN_W = SCREEN_W - Spacing.xl * 2;
const PLAN_H = PLAN_W * (956 / 391);

// Sector hotspot definitions
const SECTOR_HOTSPOTS: Record<string, { left: number; top: number; w: number; h: number; label: string }> = {
  I: { left: 0.01, top: 0.42, w: 0.16, h: 0.12, label: 'I' },
  II: { left: 0.18, top: 0.07, w: 0.22, h: 0.11, label: 'II' },
  III: { left: 0.44, top: 0.07, w: 0.22, h: 0.11, label: 'III' },
  IV: { left: 0.73, top: 0.17, w: 0.18, h: 0.09, label: 'IV' },
  V: { left: 0.73, top: 0.30, w: 0.18, h: 0.10, label: 'V' },
  VI: { left: 0.73, top: 0.44, w: 0.18, h: 0.10, label: 'VI' },
  VII: { left: 0.73, top: 0.57, w: 0.18, h: 0.10, label: 'VII' },
  VIII: { left: 0.68, top: 0.70, w: 0.20, h: 0.09, label: 'VIII' },
  IX: { left: 0.50, top: 0.39, w: 0.19, h: 0.12, label: 'IX' },
  X: { left: 0.50, top: 0.54, w: 0.19, h: 0.10, label: 'X' },
  XI: { left: 0.34, top: 0.66, w: 0.20, h: 0.10, label: 'XI' },
  XII: { left: 0.32, top: 0.54, w: 0.18, h: 0.10, label: 'XII' },
  XIII: { left: 0.32, top: 0.40, w: 0.18, h: 0.11, label: 'XIII' },
  K: { left: 0.02, top: 0.21, w: 0.14, h: 0.09, label: 'K' },
  M: { left: 0.32, top: 0.30, w: 0.18, h: 0.09, label: 'M' },
};

// ─── Route Tag Chip ──────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  Strength: '#E53935',
  Dynamic: '#FE8004',
  Slab: '#43A047',
  Technical: '#1E88E5',
  Crimpy: '#8E24AA',
};

const TagChip = ({ tag }: { tag: string }) => (
  <View style={[tagStyles.chip, { backgroundColor: (TAG_COLORS[tag] ?? Colors.primary) + '22' }]}>
    <Text style={[tagStyles.text, { color: TAG_COLORS[tag] ?? Colors.primary }]}>{tag}</Text>
  </View>
);

const tagStyles = StyleSheet.create({
  chip: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6 },
  text: { fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 0.5 },
});

// ─── Route Detail Modal ────────────────────────────────────────────────────
const RouteDetailModal = ({ route, routeIndex, visible, onClose }: { route: RouteDetail | null; routeIndex: number; visible: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'beta'>('info');
  const [attempts, setAttempts] = useState<string>('Flash');
  const [videoFileUri, setVideoFileUri] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();
  const isFocused = useIsFocused();
  const { sendMessage, isConnected } = useWebSocket(user?.username); // 👈 Add WebSocket hook

  const [cloudBetas, setCloudBetas] = useState<any[]>([]);
  const [loadingBetas, setLoadingBetas] = useState(false);
  const [likedBetas, setLikedBetas] = useState<Set<number>>(new Set());

  const handleLikeBeta = async (betaId: number) => {
    const isLiked = likedBetas.has(betaId);

    // Optimistic UI update
    setLikedBetas(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(betaId);
      else newSet.add(betaId);
      return newSet;
    });

    try {
      await betaAPI.toggleBetaLike(betaId, !isLiked);
    } catch (e) {
      console.error('Failed to like beta:', e);
      // Revert optimistic update
      setLikedBetas(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(betaId);
        else newSet.delete(betaId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (visible && route?.id && activeTab === 'beta') {
      setLoadingBetas(true);
      betaAPI.getBetasForRoute(route.id)
        .then(res => {
          if (Array.isArray(res)) setCloudBetas(res);
        })
        .catch(console.error)
        .finally(() => setLoadingBetas(false));
    } else if (!visible) {
      setCloudBetas([]);
      setActiveTab('info');
    }
  }, [visible, route?.id, activeTab]);

  if (!route) return null;

  const handlePickVideo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
    });
    if (result.assets && result.assets.length > 0) {
      setVideoFileUri(result.assets[0].uri || '');
      setVideoFileName(result.assets[0].fileName || 'video.mp4');
    }
  };

  const handleSubmitLog = async () => {
    if (!route || !user) return;
    setIsSubmitting(true);

    try {
      // 1. Save to LOCAL SQLite (Current behavior)
      await logRouteCompletion(route.id, user.username, attempts, videoFileUri || undefined);

      // 2. Save to CLOUD Laptop (Missing behavior)
      // Map your local data to the format your Express controller expects
      const cloudData = {
        routeId: route.id,
        username: user.username,
        attempts: attempts,
        videoUrl: videoFileUri ? videoFileName : null // Placeholder or actual URL logic
      };

      // This will trigger the POST request to your laptop
      await routeAPI.submitRouteCompletion(cloudData);

      // 3. Handle Video Upload if exists
      if (videoFileUri) {
        const formData = new FormData();
        formData.append('video', {
          uri: videoFileUri,
          type: 'video/mp4',
          name: videoFileName || 'beta.mp4',
        } as any);
        formData.append('routeId', route.id.toString());
        formData.append('username', user.username);

        await betaAPI.uploadBetaVideo(formData);
      }

      await refreshUser();

      // WebSocket notification
      if (isConnected) {
        sendMessage(wsHelpers.notifyRouteCompletion(route.id, user.username, route.grade));
      }

      Alert.alert('Success', 'Route completion logged to Cloud!');
      setVideoFileUri('');
      setVideoFileName('');
      onClose(); // Close modal on success
    } catch (e) {
      console.error('Log error:', e);
      Alert.alert('Error', 'Could not sync with laptop server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={rdStyles.overlay}>
        <TouchableOpacity style={rdStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={rdStyles.sheet}>
          {/* Handle */}
          <View style={rdStyles.handle} />

          {/* Hero Image */}
          <Image
            source={ROUTE_IMAGES[routeIndex % ROUTE_IMAGES.length] || ROUTE_IMAGES[0]}
            style={{ width: '100%', height: 220, resizeMode: 'cover' }}
          />

          {/* Route Title Header */}
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.base }}>
            <View style={rdStyles.gradeCircle}>
              <Text style={rdStyles.gradeText}>{route.grade}</Text>
            </View>
            <View style={rdStyles.heroInfo}>
              <Text style={rdStyles.routeCode}>{route.code}</Text>
              <Text style={rdStyles.routeName}>{route.name}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={rdStyles.tagsRow}>
            {route.tags?.map(t => <TagChip key={t} tag={t} />)}
          </View>

          {/* Tabs */}
          <View style={rdStyles.tabs}>
            {(['info', 'beta'] as const).map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[rdStyles.tab, activeTab === tab && rdStyles.tabActive]}>
                <Text style={[rdStyles.tabText, activeTab === tab && rdStyles.tabTextActive]}>
                  {tab === 'info' ? 'Details' : 'Community Beta'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={rdStyles.body}>
            {activeTab === 'info' ? (
              <View style={rdStyles.infoSection}>
                <Text style={rdStyles.descLabel}>Description</Text>
                <Text style={rdStyles.descText}>{route.description}</Text>
                <View style={rdStyles.metaGrid}>
                  <View style={rdStyles.metaItem}>
                    <Text style={rdStyles.metaLabel}>Set Date</Text>
                    <Text style={rdStyles.metaValue}>{route.set_date}</Text>
                  </View>
                  <View style={rdStyles.metaItem}>
                    <Text style={rdStyles.metaLabel}>Grade</Text>
                    <Text style={[rdStyles.metaValue, { color: Colors.primary }]}>{route.grade}</Text>
                  </View>
                </View>

                {/* Log Ascent Form */}
                <View style={rdStyles.logSection}>
                  <Text style={rdStyles.descLabel}>Log Ascent</Text>
                  <View style={rdStyles.attemptsRow}>
                    {['Flash', '2nd Attempt', '3rd+', 'Project'].map(opt => (
                      <TouchableOpacity key={opt} onPress={() => setAttempts(opt)} style={[rdStyles.attemptBtn, attempts === opt && rdStyles.attemptBtnActive]}>
                        <Text style={[rdStyles.attemptText, attempts === opt && rdStyles.attemptTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Video Picker Button */}
                  <TouchableOpacity style={rdStyles.videoPickerBtn} onPress={handlePickVideo} activeOpacity={0.75}>
                    <Ionicons name="videocam-outline" size={22} color={Colors.primary} />
                    <Text style={rdStyles.videoPickerText}>
                      {videoFileName ? `📎 ${videoFileName}` : 'Pick Video (optional)'}
                    </Text>
                  </TouchableOpacity>
                  {videoFileUri ? (
                    <TouchableOpacity onPress={() => { setVideoFileUri(''); setVideoFileName(''); }}>
                      <Text style={rdStyles.removeVideoText}>✕ Remove video</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={rdStyles.submitBtn} onPress={handleSubmitLog} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={rdStyles.submitText}>Submit Log</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ paddingTop: Spacing.sm }}>
                {loadingBetas ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
                ) : (
                  <>
                    {/* Local SQLite betas */}
                    {route.betas?.map((beta) => {
                      let videoSource;
                      if (beta.video_local_path === 'beta_1') videoSource = require('../../assets/betas/beta1.mp4');
                      else if (beta.video_local_path === 'beta_2') videoSource = require('../../assets/betas/beta2.mp4');
                      else if (beta.video_local_path === 'beta_3') videoSource = require('../../assets/betas/beta3.mp4');
                      else if (beta.video_local_path === 'beta_4') videoSource = require('../../assets/betas/beta4.mp4');
                      else if (beta.video_local_path) videoSource = { uri: `file://${beta.video_local_path}` };
                      else if (beta.video_url) videoSource = { uri: beta.video_url };
                      else return null;

                      return (
                        <View key={`local-${beta.id}`} style={{ marginBottom: Spacing.lg }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                            <Text style={rdStyles.betaUploader}>@{beta.username}</Text>
                            <TouchableOpacity onPress={() => handleLikeBeta(beta.id)} activeOpacity={0.7}>
                              <Text style={rdStyles.betaLikes}>
                                {likedBetas.has(beta.id) ? '❤️' : '🤍'} {beta.likes + (likedBetas.has(beta.id) ? 1 : 0)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ borderRadius: BorderRadius.md, overflow: 'hidden' }}>
                            <Video
                              source={videoSource}
                              style={{ width: '100%', height: 250, backgroundColor: '#000' }}
                              controls={true}
                              resizeMode="contain"
                              paused={!visible || !isFocused || activeTab !== 'beta'}
                              muted={false}
                              ignoreSilentSwitch="ignore"
                            />
                          </View>
                        </View>
                      );
                    })}

                    {/* Cloud betas */}
                    {cloudBetas.map((beta) => (
                      <View key={`cloud-${beta.id}`} style={{ marginBottom: Spacing.lg }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                          <Text style={rdStyles.betaUploader}>@{beta.username} ☁️</Text>
                          <TouchableOpacity onPress={() => handleLikeBeta(beta.id)} activeOpacity={0.7}>
                            <Text style={rdStyles.betaLikes}>
                              {likedBetas.has(beta.id) ? '❤️' : '🤍'} {beta.likes + (likedBetas.has(beta.id) ? 1 : 0)}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ borderRadius: BorderRadius.md, overflow: 'hidden' }}>
                          <Video
                            source={{ uri: beta.video_url }}
                            style={{ width: '100%', height: 250, backgroundColor: '#000' }}
                            controls={true}
                            resizeMode="contain"
                            paused={!visible || !isFocused || activeTab !== 'beta'}
                            muted={false}
                            ignoreSilentSwitch="ignore"
                          />
                        </View>
                      </View>
                    ))}

                    {(!route.betas?.length && !cloudBetas.length) && (
                      <Text style={rdStyles.noBeta}>No betas available for this route yet.</Text>
                    )}
                  </>
                )}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const rdStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: SCREEN_H * 0.85, overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, gap: Spacing.base },
  gradeCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.orange },
  gradeText: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text },
  heroInfo: { flex: 1 },
  routeCode: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 2 },
  routeName: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary, fontWeight: '800' },
  body: { flex: 1, padding: Spacing.xl },
  infoSection: {},
  descLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  descText: { fontSize: FontSize.base, color: Colors.text, lineHeight: 24, marginBottom: Spacing.lg },
  metaGrid: { flexDirection: 'row', gap: Spacing.xl },
  metaItem: {},
  metaLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  noBeta: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.md },
  betaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  betaIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  betaMeta: { flex: 1 },
  betaUploader: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  betaLikes: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logSection: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderColor: Colors.border },
  attemptsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md, flexWrap: 'wrap' },
  attemptBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  attemptBtnActive: { backgroundColor: Colors.primary + '33', borderColor: Colors.primary },
  attemptText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  attemptTextActive: { color: Colors.primary, fontWeight: '800' },
  videoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  videoPickerText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  removeVideoText: { color: '#E53935', fontSize: FontSize.sm, marginBottom: Spacing.md, fontWeight: '600' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
});

// ─── Sector Modal ─────────────────────────────────────────────────────────────
const SectorModal = ({
  sectorId, visible, onClose, onSelectRoute,
}: {
  sectorId: string; visible: boolean; onClose: () => void; onSelectRoute: (r: Route, index: number) => void;
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [sector, setSector] = useState<Sector | null>(null);
  const [loading, setLoading] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && sectorId) {
      setLoading(true);
      getSectorById(sectorId).then(setSector);
      getRoutesBySector(sectorId)
        .then(r => { setRoutes(r); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [visible, sectorId]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={smStyles.overlay}>
        <TouchableOpacity style={smStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={smStyles.sheet}>
          <View style={smStyles.handle} />
          {SECTOR_IMAGES[sectorId] ? (
            <ImageBackground source={SECTOR_IMAGES[sectorId]} style={[smStyles.header, { height: 250, justifyContent: 'flex-end' }]} imageStyle={{ opacity: 0.8 }}>
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
              <Text style={[smStyles.sectorLabel, { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }]}>Sector {sectorId}</Text>
              <Text style={[smStyles.routeCount, { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }]}>{routes.length} Active Routes</Text>
            </ImageBackground>
          ) : (
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={smStyles.header}>
              <Text style={smStyles.sectorLabel}>Sector {sectorId}</Text>
              <Text style={smStyles.routeCount}>{routes.length} Active Routes</Text>
            </LinearGradient>
          )}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.xl }} />
          ) : routes.length === 0 ? (
            <View style={{ padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <Text style={{ fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 }}>
                {sectorId === 'K' ? 'please connect Kilter board using bluetooth. Thanks!' :
                  sectorId === 'M' ? 'please connect Moon board using bluetooth. Thanks!' :
                    'No active routes yet.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={routes}
              keyExtractor={r => r.id.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={smStyles.routeRow}
                  onPress={() => onSelectRoute(item, index)}
                  activeOpacity={0.75}
                >
                  <View style={smStyles.routeCode}>
                    <Text style={smStyles.routeCodeText}>{item.code}</Text>
                  </View>
                  <View style={smStyles.routeInfo}>
                    <Text style={smStyles.routeName}>{item.name}</Text>
                    <View style={smStyles.tagsRow}>
                      {(item.tags || []).slice(0, 2).map(t => <TagChip key={t} tag={t} />)}
                    </View>
                  </View>
                  <View style={[smStyles.gradeBadge]}>
                    <Text style={smStyles.gradeText}>{item.grade}</Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const smStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.6, overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { padding: Spacing.xl, paddingTop: Spacing.base },
  sectorLabel: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text },
  routeCount: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', margin: Spacing.base, marginBottom: 0, backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  routeCode: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.base },
  routeCodeText: { fontSize: FontSize.sm, fontWeight: '900', color: Colors.text },
  routeInfo: { flex: 1 },
  routeName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  tagsRow: { flexDirection: 'row' },
  gradeBadge: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  gradeText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary },
});

// ─── Map Screen ───────────────────────────────────────────────────────────────
const useRef = React.useRef;

const MapScreen = () => {
  const [dbReady, setDbReady] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [sectorModalVisible, setSectorModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  useEffect(() => {
    initDB().then(() => setDbReady(true)).catch(console.error);
  }, []);

  const handleSectorPress = (sectorId: string) => {
    setSelectedSector(sectorId);
    setSectorModalVisible(true);
  };

  const handleRouteSelect = async (route: Route, index: number) => {
    setSectorModalVisible(false);
    const detail = await getRouteDetail(route.id);
    if (detail) {
      setSelectedRoute(detail);
      setSelectedRouteIndex(index);
      setRouteModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={mapStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={mapStyles.header}>
        <Text style={mapStyles.title}>Gym Map</Text>
        <Text style={mapStyles.subtitle}>Tap a sector to explore routes</Text>
      </View>

      {/* Floorplan */}
      <ScrollView
        contentContainerStyle={mapStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[mapStyles.planContainer, { width: PLAN_W, height: PLAN_H }]}>
          <GymMapSvg
            width={PLAN_W}
            height={PLAN_H}
            viewBox="0 0 518 1278"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFillObject as any}
            activeSector={selectedSector}
            onSectorPress={handleSectorPress}
          />
        </View>

        {/* Legend */}
        <View style={mapStyles.legend}>
          <Text style={mapStyles.legendTitle}>Sectors</Text>
          <View style={mapStyles.legendGrid}>
            {Object.entries(SECTOR_HOTSPOTS).map(([id]) => (
              <TouchableOpacity
                key={id}
                style={mapStyles.legendItem}
                onPress={() => handleSectorPress(id)}
              >
                <View style={mapStyles.legendDot} />
                <Text style={mapStyles.legendText}>Sector {id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sector Modal */}
      {selectedSector && (
        <SectorModal
          sectorId={selectedSector}
          visible={sectorModalVisible}
          onClose={() => setSectorModalVisible(false)}
          onSelectRoute={handleRouteSelect}
        />
      )}

      {/* Route Detail Modal */}
      <RouteDetailModal
        route={selectedRoute}
        routeIndex={selectedRouteIndex}
        visible={routeModalVisible}
        onClose={() => setRouteModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const mapStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.base },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scrollContent: { alignItems: 'center', paddingTop: Spacing.base },
  planContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planLabel: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.textMuted, letterSpacing: 4 },
  planLabelSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  hotspot: {
    position: 'absolute',
    backgroundColor: 'rgba(254, 128, 4, 0.35)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotActive: {
    backgroundColor: 'rgba(254, 128, 4, 0.65)',
    borderWidth: 2,
  },
  hotspotLabel: { fontSize: FontSize.xs, fontWeight: '900', color: Colors.text },
  legend: { width: PLAN_W, marginTop: Spacing.xl, paddingHorizontal: Spacing.sm },
  legendTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 2, marginBottom: Spacing.base, textTransform: 'uppercase' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: (PLAN_W - Spacing.sm * 2 - 50) / 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 6 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
});

export default MapScreen;
