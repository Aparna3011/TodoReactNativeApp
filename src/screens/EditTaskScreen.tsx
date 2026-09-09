import React, {useState} from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeAreaScreen, {FULL_SCREEN_EDGES} from '../components/SafeAreaScreen';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

import {updateTodo} from '../database/todoRepository';
import type {RootStackParamList} from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditTask'
>;

type EditRouteProp = RouteProp<
  RootStackParamList,
  'EditTask'
>;

/**
 * Parses a YYYY-MM-DD string into a Date using local calendar values.
 * `new Date(string)` would interpret the string as UTC and can shift the
 * selected day in off-UTC timezones, so it must be avoided here.
 */
function parseDateLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  // Reject dates that JavaScript would silently roll over (e.g. 2026-02-31).
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

/**
 * Formats a Date as a local calendar date string in YYYY-MM-DD format,
 * matching the format used by AddTaskScreen, so values stay consistent.
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function EditTaskScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditRouteProp>();

  const {todo} = route.params;

  const [taskName, setTaskName] = useState(todo.task_name);

  // Restore the stored end date (YYYY-MM-DD) as a local-calendar Date so the
  // picker opens on the correct day; fall back to today if it is missing or
  // malformed.
  const [endDate, setEndDate] = useState<Date>(
    () => parseDateLocal(todo.end_date) ?? new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Start of today so today itself stays selectable.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If the task is already overdue, let the picker keep its current date
  // instead of clamping it to today.
  const minimumDate = endDate < today ? endDate : today;

  const handleSave = async () => {
    const task = taskName.trim();

    if (!task) {
      Alert.alert('Task required', 'Please enter a task name.');
      return;
    }

    try {
      await updateTodo(todo.id, task, formatDateLocal(endDate));
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Unable to update the task.');
    }
  };

  return (
    <SafeAreaScreen
        style={styles.safeArea}
        edges={FULL_SCREEN_EDGES}
      >
      <StatusBar
        barStyle="dark-content"
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Task</Text>
          <Text style={styles.subtitle}>
            Update your task details
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Task name</Text>

          <TextInput
            style={styles.input}
            value={taskName}
            onChangeText={setTaskName}
            placeholder="Enter task name"
            placeholderTextColor="#999999"
          />

          <Text style={styles.label}>End date</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>
              {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'default'}
              minimumDate={minimumDate}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);

                if (event.type === 'set' && selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              Save Changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
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

  form: {
    padding: 20,
  },

  label: {
    marginBottom: 8,
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#222222',
  },

  dateButton: {
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  dateText: {
    fontSize: 16,
    color: '#222222',
  },

  saveButton: {
    height: 50,
    marginTop: 25,
    borderRadius: 10,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    height: 50,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditTaskScreen;