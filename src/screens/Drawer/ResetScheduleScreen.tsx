import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MOCK_RESET_SCHEDULE } from '../../api/mockData';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

const ResetScheduleScreen = ({ navigation }: any) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>
    <Text style={styles.title}>📋 Route Reset Schedule</Text>
    <Text style={styles.subtitle}>Routes are replaced monthly by sector</Text>

    {MOCK_RESET_SCHEDULE.map((item, i) => {
      const isOverdue = new Date(item.nextReset) < new Date();
      return (
        <View key={i} style={[styles.card, isOverdue && styles.cardOverdue]}>
          <View style={styles.cardTop}>
            <View style={[styles.dot, isOverdue && styles.dotOverdue]} />
            <Text style={styles.sectorName}>{item.sector}</Text>
            <View style={styles.routeCountBadge}>
              <Text style={styles.routeCountText}>{item.routeCount} routes</Text>
            </View>
          </View>
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>LAST RESET</Text>
              <Text style={styles.dateValue}>{item.lastReset}</Text>
            </View>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>NEXT RESET</Text>
              <Text style={[styles.dateValue, isOverdue && styles.overdueDate]}>{item.nextReset}</Text>
            </View>
          </View>
          {isOverdue && (
            <View style={styles.overdueBanner}>
              <Text style={styles.overdueBannerText}>⚠️ Reset overdue — new routes coming soon!</Text>
            </View>
          )}
        </View>
      );
    })}
    <View style={{ height: 100 }} />
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.base },
  backText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardOverdue: { borderColor: Colors.warning },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success, marginRight: Spacing.sm },
  dotOverdue: { backgroundColor: Colors.warning },
  sectorName: { flex: 1, fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  routeCountBadge: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  routeCountText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  datesRow: { flexDirection: 'row', alignItems: 'center' },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1, fontWeight: '700', marginBottom: 2 },
  dateValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  overdueDate: { color: Colors.warning },
  arrow: { paddingHorizontal: Spacing.base },
  arrowText: { fontSize: 20, color: Colors.textMuted },
  overdueBanner: { backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: Spacing.sm },
  overdueBannerText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '600' },
});

export default ResetScheduleScreen;
