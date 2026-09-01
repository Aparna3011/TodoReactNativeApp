import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

import { addTodo } from '../database/todoRepository';

/**
 * Formats a Date as a local calendar date string in YYYY-MM-DD format
 * using local timezone values. This avoids the UTC shift introduced by
 * toISOString(), which can change the selected day in off-UTC timezones.
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function AddTaskScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const [taskName, setTaskName] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Minimum selectable date = today's local calendar date (start of day, so today stays selectable..
  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);

  const handleSave = async () => {
    if (!taskName.trim()) {
      Alert.alert('Required', 'Please enter a task name.');
      return;
    }

    const formattedDate = formatDateLocal(endDate);

    await addTodo(taskName.trim(), formattedDate);

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <Text style={styles.title}>Add Task</Text>

        <Text style={styles.label}>Task name</Text>

        <TextInput
          style={styles.input}
          value={taskName}
          onChangeText={setTaskName}
          placeholder="Enter task name"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>End date</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#222',
    marginBottom: 20,
  },

  dateButton: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 25,
  },

  dateText: {
    fontSize: 16,
    color: '#222',
  },

  saveButton: {
    height: 50,
    backgroundColor: '#222',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTaskScreen;
