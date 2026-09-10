import React from 'react';
import { Alert, StatusBar, StyleSheet, Text, View } from 'react-native';
import SafeAreaScreen, { FULL_SCREEN_EDGES } from '../components/SafeAreaScreen';
import TaskForm from '../components/TaskForm';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { updateTodo } from '../database/todoRepository';
import AndroidCamera from '../native/AndroidCamera';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditTask'>;
type EditRouteProp = RouteProp<RootStackParamList, 'EditTask'>;

/**
 * Edit Task screen. All task form fields (name, end date, image capture/
 * remove, validation, save button) come from the shared TaskForm; this screen
 * only provides the initial values, the labels, the Cancel action, and the
 * update + replaced-original-image cleanup logic.
 */
function EditTaskScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditRouteProp>();

  const { todo } = route.params;

  return (
    <SafeAreaScreen style={styles.safeArea} edges={FULL_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Task</Text>
          <Text style={styles.subtitle}>Update your task details</Text>
        </View>

        <TaskForm
          initialName={todo.task_name}
          initialEndDate={todo.end_date}
          initialImagePath={todo.image_path ?? null}
          submitLabel="Save Changes"
          retakeImageLabel="Replace / Retake Image"
          renderImageWhenEmpty={false}
          emptyNameAlertTitle="Task required"
          showCancel
          onCancel={() => navigation.goBack()}
          onSubmit={async ({ taskName, endDateString, imagePath }) => {
            try {
              await updateTodo(todo.id, taskName, endDateString, imagePath);

              // Delete the replaced/removed original AFTER the DB update succeeds.
              if (todo.image_path && todo.image_path !== imagePath) {
                await AndroidCamera.deleteImageFile(todo.image_path).catch(
                  () => {},
                );
              }

              navigation.goBack();
            } catch (error) {
              console.error('Failed to update task:', error);
              Alert.alert('Error', 'Unable to update the task.');
              throw error;
            }
          }}
        />
      </View>
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  header: {
    padding: 22,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#777777',
  },
});

export default EditTaskScreen;