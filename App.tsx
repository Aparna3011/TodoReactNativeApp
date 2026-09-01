import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import {initializeDatabase} from './src/database/database';

function App(): React.JSX.Element {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default App;