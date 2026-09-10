import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import SafeAreaScreen, { FULL_SCREEN_EDGES } from '../components/SafeAreaScreen';
import TaskForm from '../components/TaskForm';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { addTodo } from '../database/todoRepository';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTask'>;
type AddRouteProp = RouteProp<RootStackParamList, 'AddTask'>;

/**
 * Add Task screen. All task form fields and behavior (name, end date, image
 * capture/remove, validation, save button) come from the shared TaskForm; this
 * screen only passes the pre-selected date, the label, and the insert logic.
 */
function AddTaskScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddRouteProp>();

  const initialDate = route.params?.initialDate;

  return (
    <SafeAreaScreen style={styles.safeArea} edges={FULL_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Add Task</Text>
        </View>

        <TaskForm
          initialEndDate={initialDate}
          submitLabel="Save Task"
          onSubmit={async ({ taskName, endDateString, imagePath }) => {
            await addTodo(taskName, endDateString, imagePath);
            navigation.goBack();
          }}
        />
      </View>
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 20,
  },
});

export default AddTaskScreen;