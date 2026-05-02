import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

const menuItems = [
  { name: 'Home', label: 'Home', icon: '⌂' },
  { name: 'ResetSchedule', label: 'Route Reset Schedule', icon: '📋' },
  { name: 'Leaderboard', label: 'Leaderboard', icon: '🏆' },
  { name: 'Memberships', label: 'My Memberships', icon: '💳' },
  { name: 'Information', label: 'Information', icon: 'ℹ' },
];

const CustomDrawerContent = (props: any) => {
  const { state, navigation } = props;
  const activeRoute = state.routes[state.index]?.name;

  return (
    <DrawerContentScrollView
      {...props}
      style={drawerStyles.container}
      contentContainerStyle={drawerStyles.content}
    >
      {/* Header */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.logoBox}>
          <Text style={drawerStyles.logoText}>B</Text>
        </View>
        <Text style={drawerStyles.brandName}>BHUB</Text>
        <Text style={drawerStyles.brandSub}>Bouldering</Text>
      </View>

      <View style={drawerStyles.divider} />

      {/* Menu Items */}
      {menuItems.map((item) => {
        const isActive = activeRoute === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={[drawerStyles.menuItem, isActive && drawerStyles.menuItemActive]}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
            <Text style={[drawerStyles.menuLabel, isActive && drawerStyles.menuLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </DrawerContentScrollView>
  );
};

const drawerStyles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 40 },
  header: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  brandName: { fontSize: FontSize.xl, fontWeight: '800', color: '#333333', letterSpacing: 1 },
  brandSub: { fontSize: FontSize.sm, color: '#888888', letterSpacing: 1, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginHorizontal: Spacing.base, marginBottom: Spacing.base },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  menuItemActive: { backgroundColor: 'rgba(254,128,4,0.15)' },
  menuIcon: { fontSize: 20, marginRight: Spacing.base, color: '#555555' },
  menuLabel: { fontSize: FontSize.base, color: '#555555', fontWeight: '500' },
  menuLabelActive: { color: Colors.primary, fontWeight: '700' },
});

export default CustomDrawerContent;
