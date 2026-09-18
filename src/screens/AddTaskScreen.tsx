import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SafeAreaScreen, {
  FULL_SCREEN_EDGES,
} from '../components/SafeAreaScreen';
import TaskForm from '../components/TaskForm';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { addTodo } from '../database/todoRepository';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTask'>;
type AddRouteProp = RouteProp<RootStackParamList, 'AddTask'>;

/**
 * Add Task screen. All task form fields and behavior (name, start date,
 * due date, image capture/remove, validation, save button) come from the
 * shared TaskForm; this screen only passes the pre-selected date(s), the
 * label, and the insert logic.
 */
function AddTaskScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddRouteProp>();

  /*
   * The Calendar and Date Tasks screens pre-select the start date and the due
   * date to the exact date the user tapped, so the task is associated with
   * that calendar date. Both names are explicit (initialStartDate /
   * initialEndDate) rather than an ambiguous initialDate, so it is always
   * clear which field receives the selected date. The user can still adjust
   * either date in the form.
   */
  const initialStartDate = route.params?.initialStartDate;
  const initialEndDate = route.params?.initialEndDate;

  return (
    <SafeAreaScreen style={styles.safeArea} edges={FULL_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Add Task</Text>
        </View>

        {/* 
          Keyboard-safe, scrollable form area.

          The Android activity already uses windowSoftInputMode="adjustResize"
          (AndroidManifest.xml), so when the keyboard opens the window resizes
          to the visible area above it. KeyboardAvoidingView (behavior="height")
          makes sure this area is sized to exactly the visible space, and the
          single vertical ScrollView allows the whole form to be scrolled while
          the keyboard is open. The ScrollView's native keyboard handling keeps
          the focused Task Name input visible above the keyboard.

          Structure:
            SafeAreaScreen
              └── View.container
                    ├── titleRow ("Add Task", fixed header)
                    └── KeyboardAvoidingView (flex: 1)
                          └── ScrollView (flex: 1)
                                └── TaskForm (all fields + Save/Cancel)
        */}
        <KeyboardAvoidingView behavior="height" style={styles.formArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TaskForm
              initialStartDate={initialStartDate}
              initialEndDate={initialEndDate}
              submitLabel="Save Task"
              onSubmit={async ({
                taskName,
                startDateString,
                endDateString,
                imagePath,
              }) => {
                try {
                  await addTodo(
                    taskName,
                    startDateString,
                    endDateString,
                    imagePath,
                  );
                  navigation.goBack();
                } catch (error) {
                  console.error('Failed to add task:', error);
                  Alert.alert('Error', 'Unable to save the task.');
                  // Rethrow so TaskForm can clean up the unsaved captured image.
                  throw error;
                }
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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

  /*
   * KeyboardAvoidingView area: fills the space between the fixed header and
   * the bottom edge. Uses flex (no fixed heights), so it adapts to any screen
   * size; with behavior="height" it shrinks to the space above the keyboard
   * while the keyboard is open and returns to full height when it closes.
   */
  formArea: {
    flex: 1,
  },

  /*
   * The single main vertical ScrollView for the form. flex: 1 fills the
   * KeyboardAvoidingView area on every screen size.
   */
  scrollView: {
    flex: 1,
  },

  /*
   * flexGrow: 1 lets the content fill the scroll viewport naturally on large
   * screens; paddingBottom gives a small keyboard-safe buffer (for 3-button
   * nav bars / gesture hints) without adding blank space when the keyboard is
   * closed. No fixed heights anywhere.
   */
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});

export default AddTaskScreen;
