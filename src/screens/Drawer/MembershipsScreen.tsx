import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

const PASSES = [
  { type: 'Monthly Pass', price: 'RM 99/month', icon: '💳', features: ['Unlimited climbs', 'Locker access', 'Guest passes x2'], active: true },
  { type: 'Day Pass', price: 'RM 25/visit', icon: '🎟️', features: ['Single day access', 'Equipment rental available'], active: false },
  { type: 'Student Pass', price: 'RM 75/month', icon: '🎓', features: ['Valid student ID required', 'Weekday access only'], active: false },
];

const MembershipsScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>My Memberships</Text>
      <Text style={styles.subtitle}>Manage your passes and plans</Text>

      {/* Active Membership */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.activeCard}>
        <Text style={styles.activeLabel}>ACTIVE</Text>
        <Text style={styles.activeName}>{user?.membershipType}</Text>
        <Text style={styles.activeExpiry}>Expires: {user?.membershipExpiry}</Text>
        <View style={styles.activeFeatures}>
          <Text style={styles.featureItem}>✓ Unlimited Climbs</Text>
          <Text style={styles.featureItem}>✓ Locker Access</Text>
          <Text style={styles.featureItem}>✓ 2× Guest Passes</Text>
        </View>
        <TouchableOpacity 
          style={styles.renewBtn} 
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Payment', { planName: `${user?.membershipType} Renewal` })}
        >
          <Text style={styles.renewBtnText}>Renew Pass</Text>
        </TouchableOpacity>
      </LinearGradient>

      <Text style={styles.sectionHeader}>Other Plans</Text>

      {PASSES.filter(p => !p.active).map((pass, i) => (
        <View key={i} style={styles.passCard}>
          <View style={styles.passHeader}>
            <Text style={styles.passIcon}>{pass.icon}</Text>
            <View style={styles.passInfo}>
              <Text style={styles.passType}>{pass.type}</Text>
              <Text style={styles.passPrice}>{pass.price}</Text>
            </View>
          </View>
          {pass.features.map((f, j) => (
            <View key={j} style={styles.featureRow}>
              <Text style={styles.featureDot}>•</Text>
              <Text style={styles.passFeatureText}>{f}</Text>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.selectBtn} 
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Payment', { planName: pass.type })}
          >
            <Text style={styles.selectBtnText}>Select Plan</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.base },
  backText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  activeCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadow.orange },
  activeLabel: { fontSize: FontSize.xs, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 3, marginBottom: 4 },
  activeName: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  activeExpiry: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.lg },
  activeFeatures: { gap: 6, marginBottom: Spacing.lg },
  featureItem: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600' },
  renewBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  renewBtnText: { fontSize: FontSize.base, fontWeight: '800', color: Colors.text },
  sectionHeader: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.base },
  passCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  passHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  passIcon: { fontSize: 28, marginRight: Spacing.base },
  passInfo: { flex: 1 },
  passType: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  passPrice: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  featureDot: { color: Colors.primary, fontSize: 16, marginRight: Spacing.sm, lineHeight: 20 },
  passFeatureText: { fontSize: FontSize.md, color: Colors.textSecondary },
  selectBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md, ...Shadow.orange },
  selectBtnText: { fontSize: FontSize.base, fontWeight: '800', color: Colors.text },
});

export default MembershipsScreen;
