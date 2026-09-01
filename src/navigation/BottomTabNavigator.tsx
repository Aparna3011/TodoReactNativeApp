import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  CheckSquare,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  UserRound,
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  Tasks: undefined;
  Calendar: undefined;
  Stats: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACTIVE_COLOR = '#222222';
const INACTIVE_COLOR = '#9a9a9a';

type TabIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type TabBarIconProps = {
  focused: boolean;
  color: string;
};

type TabBarIconRenderer = (props: TabBarIconProps) => React.ReactNode;

function makeTabBarIcon(Icon: TabIconComponent): TabBarIconRenderer {
  return function TabBarIcon({focused, color}: TabBarIconProps) {
    return (
      <Icon
        size={focused ? 24 : 22}
        color={color}
        strokeWidth={focused ? 2.4 : 1.9}
      />
    );
  };
}

const TAB_BAR_ICONS: Record<keyof MainTabParamList, TabBarIconRenderer> = {
  Tasks: makeTabBarIcon(CheckSquare),
  Calendar: makeTabBarIcon(CalendarDays),
  Stats: makeTabBarIcon(ChartNoAxesColumnIncreasing),
  Profile: makeTabBarIcon(UserRound),
};

function BottomTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      initialRouteName="Tasks"
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: TAB_BAR_ICONS[route.name],
      })}>
      <Tab.Screen name="Tasks" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    // Subtle elevation/shadow so the bar lifts above the screen content.
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  tabBarItem: {
    paddingTop: 4,
    paddingBottom: 4,
  },
});

export default BottomTabNavigator;