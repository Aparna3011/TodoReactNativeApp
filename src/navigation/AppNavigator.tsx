import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import BottomTabNavigator from './BottomTabNavigator';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import DateTasksScreen from '../screens/DateTasksScreen';
import type {Todo} from '../types/todo';

export type RootStackParamList = {
  Home: undefined;
  AddTask:
    | {
        initialDate?: string;
      }
    | undefined;
  EditTask: {
    todo: Todo;
  };
  DateTasks: {
    date: string;
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

      <Stack.Screen
        name="DateTasks"
        component={DateTasksScreen}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;