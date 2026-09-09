import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  BottomTabBarHeightCallbackContext,
} from '@react-navigation/bottom-tabs';
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

const ACTIVE_COLOR = '#120ef8';
const INACTIVE_COLOR = '#463c3c';

/** Fixed height of the interactive/clickable application tab bar. */
export const VISIBLE_TAB_BAR_HEIGHT = 56;

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

const TAB_BAR_LABELS: Record<keyof MainTabParamList, string> = {
  Tasks: 'Tasks',
  Calendar: 'Calendar',
  Stats: 'Stats',
  Profile: 'Profile',
};

/**
 * Controlled custom tab bar that explicitly isolates the application's visible
 * clickable tab buttons from the physical Android 3-button / gesture system
 * navigation bar.
 *
 * Physical Layout Structure:
 * ┌────────────────────────────────────────────────────────┐
 * │ Tab bar container (Height: 56 + insets.bottom)         │
 * │  ┌──────────────────────────────────────────────────┐  │
 * │  │ Visible Tab Content (Height: 56dp)               │  │
 * │  │  Tasks      Calendar      Stats       Profile    │  │
 * │  └──────────────────────────────────────────────────┘  │
 * │  ┌──────────────────────────────────────────────────┐  │
 * │  │ System Navigation Spacer (Height: insets.bottom) │  │
 * │  │ (Non-clickable space reserved for Android        │  │
 * │  │  3-button [Back | Home | Recents] / gesture bar) │  │
 * │  └──────────────────────────────────────────────────┘  │
 * └────────────────────────────────────────────────────────┘
 */
function ControlledBottomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps): React.JSX.Element {
  const bottomInset = insets.bottom;
  const leftInset = insets.left;
  const rightInset = insets.right;

  // Temporary development logging to verify runtime safe area insets
  console.log('BOTTOM TAB SAFE AREA INSETS', insets);
  console.log('BOTTOM TAB TOTAL HEIGHT', VISIBLE_TAB_BAR_HEIGHT + insets.bottom);

  return (
    <BottomTabBarHeightCallbackContext.Consumer>
      {onHeightChange => (
        <View
          style={[
            styles.tabBarContainer,
            {
              height: VISIBLE_TAB_BAR_HEIGHT + bottomInset,
              paddingLeft: leftInset,
              paddingRight: rightInset,
            },
          ]}
          onLayout={event => {
            const {height} = event.nativeEvent.layout;
            onHeightChange?.(height);
          }}
          accessibilityRole="tablist"
        >
          {/* 1. Visible Application Tab Bar */}
          <View style={styles.visibleTabBarContent}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const {options} = descriptors[route.key];
              const routeName = route.name as keyof MainTabParamList;
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : options.title ?? TAB_BAR_LABELS[routeName] ?? route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const iconRenderer = TAB_BAR_ICONS[routeName];
              const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityState={isFocused ? {selected: true} : {}}
                  accessibilityLabel={
                    typeof options.tabBarAccessibilityLabel === 'string'
                      ? options.tabBarAccessibilityLabel
                      : typeof label === 'string'
                      ? label
                      : route.name
                  }
                  testID={options.tabBarButtonTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    {iconRenderer ? iconRenderer({focused: isFocused, color}) : null}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      {color},
                      isFocused && styles.tabLabelFocused,
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Bottom System Navigation Spacer (Physical reservation for 3-button nav / gesture nav) */}
          {bottomInset > 0 && (
            <View
              style={[styles.systemNavigationSpacer, {height: bottomInset}]}
              pointerEvents="none"
              aria-hidden={true}
            />
          )}
        </View>
      )}
    </BottomTabBarHeightCallbackContext.Consumer>
  );
}

function BottomTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      initialRouteName="Tasks"
      tabBar={ControlledBottomTabBar}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Tasks" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  visibleTabBarContent: {
    height: VISIBLE_TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  tabLabelFocused: {
    fontWeight: '700',
  },

  systemNavigationSpacer: {
    width: '100%',
    backgroundColor: '#ffffff',
  },
});

export default BottomTabNavigator;