import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/Home/HomeScreen';
import LeaderboardScreen from '../screens/Drawer/LeaderboardScreen';
import ResetScheduleScreen from '../screens/Drawer/ResetScheduleScreen';
import MembershipsScreen from '../screens/Drawer/MembershipsScreen';
import InformationScreen from '../screens/Drawer/InformationScreen';
import CustomDrawerContent from '../components/Drawer/CustomDrawerContent';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280, borderTopRightRadius: 20, borderBottomRightRadius: 20 },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="ResetSchedule" component={ResetScheduleScreen} />
      <Drawer.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Drawer.Screen name="Memberships" component={MembershipsScreen} />
      <Drawer.Screen name="Information" component={InformationScreen} />
    </Drawer.Navigator>
  );
};
