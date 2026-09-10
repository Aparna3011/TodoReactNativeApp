import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import TaskImage from './TaskImage';
import AndroidCamera from '../native/AndroidCamera';

export type TaskFormValues = {
  taskName: string;
  endDate: Date;
  endDateString: string;
  imagePath: string | null;
};

type TaskFormProps = {
  initialName?: string;
  initialEndDate?: Date | string | null;
  initialImagePath?: string | null;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  showCancel?: boolean;
  onCancel?: () => void;
  renderImageWhenEmpty?: boolean;
  retakeImageLabel?: string;
  emptyNameAlertTitle?: string;
};

/**
 * Parses a YYYY-MM-DD string into a Date using local calendar values.
 * new Date(string) would interpret the string as UTC and can shift
 * off-UTC timezones, so it is parsed explicitly.
 */
function parseDateLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

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
 * avoiding the UTC shift of toISOString() in off-UTC timezones.
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Single reusable Add/Edit task form. Owns the common fields and behavior:
 * task name, end date picker, image capture/remove and the submit action.
 * Used by AddTaskScreen and EditTaskScreen (and therefore indirectly by
 * Home/Calendar via navigation); per-screen differences are passed via props.
 */
function TaskForm({
  initialName,
  initialEndDate,
  initialImagePath,
  submitLabel,
  onSubmit,
  showCancel = false,
  onCancel,
  renderImageWhenEmpty = true,
  retakeImageLabel = 'Retake Image',
  emptyNameAlertTitle = 'Required',
}: TaskFormProps): React.JSX.Element {
  const [taskName, setTaskName] = useState(initialName ?? '');

  const [endDate, setEndDate] = useState<Date>(() => {
    if (typeof initialEndDate === 'string') {
      return parseDateLocal(initialEndDate) ?? new Date();
    }

    if (initialEndDate instanceof Date) {
      return initialEndDate;
    }

    return new Date();
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [imagePath, setImagePath] = useState<string | null>(
    initialImagePath ?? null,
  );

  /*
   * Path of the image the user captured in this session (still unsaved).
   * The pre-existing image of an edit task is NOT tracked here: it may only
   * be deleted by the screen after a successful DB update.
   */
  const capturedPathRef = useRef<string | null>(null);
  const isSavedRef = useRef(false);

  // Clean up any unsaved captured image if the user exits without saving.
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && capturedPathRef.current) {
        AndroidCamera.deleteImageFile(capturedPathRef.current).catch(() => {});
      }
    };
  }, []);

  // Minimum selectable date = start of today, or the selected date if earlier.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minimumDate = endDate < today ? endDate : today;

  const handleCaptureImage = async () => {
    try {
      const capturedPath = await AndroidCamera.captureImage();

      // Delete the previously captured unsaved image when retaking.
      if (capturedPathRef.current && capturedPathRef.current !== capturedPath) {
        AndroidCamera.deleteImageFile(capturedPathRef.current).catch(() => {});
      }

      capturedPathRef.current = capturedPath;
      setImagePath(capturedPath);
    } catch (error) {
      console.log('Camera capture error:', error);
    }
  };

  const handleRemoveImage = () => {
    if (capturedPathRef.current) {
      AndroidCamera.deleteImageFile(capturedPathRef.current).catch(() => {});
      capturedPathRef.current = null;
    }
    setImagePath(null);
  };

  const handleSubmit = async () => {
    const trimmedName = taskName.trim();

    if (!trimmedName) {
      Alert.alert(emptyNameAlertTitle, 'Please enter a task name.');
      return;
    }

    isSavedRef.current = true;

    try {
      await onSubmit({
        taskName: trimmedName,
        endDate,
        endDateString: formatDateLocal(endDate),
        imagePath,
      });
    } catch {
      // Persistence failed: let the cleanup effect remove the captured file.
      isSavedRef.current = false;
    }
  };

  const showImageArea = renderImageWhenEmpty || imagePath !== null;

  return (
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

      <TouchableOpacity style={styles.cameraButton} onPress={handleCaptureImage}>
        <Text style={styles.cameraButtonText}>
          {imagePath ? retakeImageLabel : 'Take Image'}
        </Text>
      </TouchableOpacity>

      {showImageArea && (
        <View style={styles.imageContainer}>
          <TaskImage imagePath={imagePath} style={styles.imagePreview} />

          {imagePath && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}>
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
        <Text style={styles.saveText}>{submitLabel}</Text>
      </TouchableOpacity>

      {showCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 15,
  },

  dateText: {
    fontSize: 16,
    color: '#222222',
  },

  cameraButton: {
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },

  imageContainer: {
    marginBottom: 15,
  },

  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 8,
  },

  removeImageButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },

  removeImageText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },

  saveButton: {
    height: 50,
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
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

export default TaskForm;