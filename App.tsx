import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Platform, PermissionsAndroid} from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import {initializeDatabase} from './src/database/database';
import {checkStartupNotifications} from './src/database/notificationRepository';

async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } catch {
      // Ignore permission request error - app functionality is unaffected
    }
  }
}

function App(): React.JSX.Element {
  useEffect(() => {
    async function initApp() {
      await initializeDatabase();
      await requestNotificationPermission();
      await checkStartupNotifications();
    }
    initApp();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;