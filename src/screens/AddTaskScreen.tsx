import React, { useEffect, useRef, useState } from 'react';
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
import TaskImage from '../components/TaskImage';
import SafeAreaScreen, {
  FULL_SCREEN_EDGES,
} from '../components/SafeAreaScreen';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { addTodo } from '../database/todoRepository';
import AndroidCamera from '../native/AndroidCamera';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTask'>;
type AddRouteProp = RouteProp<RootStackParamList, 'AddTask'>;

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
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddRouteProp>();

  const initialDateString = route.params?.initialDate;

  const [taskName, setTaskName] = useState('');
  const [endDate, setEndDate] = useState<Date>(() => {
    if (initialDateString) {
      const parsed = parseDateLocal(initialDateString);
      if (parsed) {
        return parsed;
      }
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);

  const unsavedCapturedPathRef = useRef<string | null>(null);
  const isSavedRef = useRef(false);

  // Clean up any unsaved captured image if user exits without saving
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && unsavedCapturedPathRef.current) {
        AndroidCamera.deleteImageFile(unsavedCapturedPathRef.current).catch(() => {});
      }
    };
  }, []);

  // Minimum selectable date = start of today or selected date if earlier
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minimumDate = endDate < today ? endDate : today;

  //camera function
  const handleCaptureImage = async () => {
    try {
      const capturedPath = await AndroidCamera.captureImage();

      // Delete previously captured unsaved image if retaking
      if (
        unsavedCapturedPathRef.current &&
        unsavedCapturedPathRef.current !== capturedPath
      ) {
        AndroidCamera.deleteImageFile(unsavedCapturedPathRef.current).catch(() => {});
      }

      unsavedCapturedPathRef.current = capturedPath;
      setImagePath(capturedPath);
    } catch (error) {
      console.log('Camera capture error:', error);
    }
  };

  const handleRemoveImage = () => {
    if (unsavedCapturedPathRef.current) {
      AndroidCamera.deleteImageFile(unsavedCapturedPathRef.current).catch(() => {});
      unsavedCapturedPathRef.current = null;
    }
    setImagePath(null);
  };

  const handleSave = async () => {
    if (!taskName.trim()) {
      Alert.alert('Required', 'Please enter a task name.');
      return;
    }

    // if (!imagePath) {
    //   Alert.alert('Required', 'Please capture an image.');
    //   return;
    // }

    const formattedDate = formatDateLocal(endDate);

    isSavedRef.current = true;
    await addTodo(taskName.trim(), formattedDate, imagePath);

    navigation.goBack();
  };

  return (
    <SafeAreaScreen style={styles.container} edges={FULL_SCREEN_EDGES}>
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
        <Text style={styles.label}>Task image</Text>

        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCaptureImage}
        >
          <Text style={styles.cameraButtonText}>
            {imagePath ? 'Retake Image' : 'Take Image'}
          </Text>
        </TouchableOpacity>

        {/* Always show image area — placeholder before capture, real image after */}
        <View style={styles.imageContainer}>
          <TaskImage
            imagePath={imagePath}
            style={styles.imagePreview}
          />

          {imagePath && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaScreen>
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
  cameraButton: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  imageContainer: {
    marginBottom: 20,
  },

  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
  },

  removeImageButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },

  removeImageText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddTaskScreen;
