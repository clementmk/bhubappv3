import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { getUserSends } from '../../database/queries';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { routeAPI } from '../../api/cloudAPI'; // Import the Cloud API

const SendsHistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [sends, setSends] = useState<any[]>([]);

useFocusEffect(
  useCallback(() => {
    const fetchSends = async () => {
      if (!user?.username) return;

      try {
        // 1. TRY CLOUD: Fetch from your laptop server
        const cloudSends = await routeAPI.getUserSends(user.username);
        if (cloudSends && cloudSends.length > 0) {
          // CORRECTED: Update state with data from laptop
          setSends(cloudSends); 
          return;
        }
      } catch (error) {
        console.log("Cloud unavailable, loading local sends:", error);
      }

      // 2. FALLBACK: Load from tablet's local SQLite
      const localSends = await getUserSends(user.username);
      setSends(localSends);
    };

    fetchSends();
  }, [user?.username])
);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.routeName}>{item.routeName} <Text style={styles.routeGrade}>{item.routeGrade}</Text></Text>
        <Text style={styles.date}>{item.created_at}</Text>
      </View>
      <Text style={styles.sectorName}>Sector: {item.sectorName}</Text>
      <Text style={styles.attempts}>Attempts: {item.attempts}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sends History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* List */}
      <FlatList
        data={sends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="rocket-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No sends yet.</Text>
            <Text style={styles.emptySub}>Time to go crushing!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.primaryDark,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  listContent: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routeName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  routeGrade: { color: Colors.primary, fontSize: FontSize.md },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  sectorName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  attempts: { fontSize: FontSize.sm, color: Colors.textSecondary },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
});

export default SendsHistoryScreen;
