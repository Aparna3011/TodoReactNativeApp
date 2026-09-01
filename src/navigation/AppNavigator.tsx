import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';

export type RootStackParamList = {
  Home: undefined;
  AddTask: undefined;
  EditTask: {
    todo: {
      id: number;
      task_name: string;
      end_date: string;
      completed: number;
      created_at: string;
    };
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
        component={HomeScreen}
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