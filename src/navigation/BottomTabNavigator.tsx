import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DrawerNavigator } from './DrawerNavigator';
import MapScreen from '../screens/Map/MapScreen';
import BetaScreen from '../screens/Beta/BetaScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CustomTabBar from '../components/TabBar/CustomTabBar';
import { HomeIcon, BookmarkIcon, PlayIcon, PersonIcon } from '../components/TabBar/TabBarIcons';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="HomeTab"
        component={DrawerNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <HomeIcon focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <BookmarkIcon focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="BetaTab"
        component={BetaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <PlayIcon focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <PersonIcon focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
