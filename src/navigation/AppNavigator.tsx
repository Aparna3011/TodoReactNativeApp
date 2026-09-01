import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import BottomTabNavigator from './BottomTabNavigator';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import type {Todo} from '../types/todo';

export type RootStackParamList = {
  Home: undefined;
  AddTask: undefined;
  EditTask: {
    todo: Todo;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="Home"
        component={BottomTabNavigator}
      />

      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
      />

      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;