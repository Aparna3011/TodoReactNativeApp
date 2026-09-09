import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import type { Todo } from '../../types/todo';

import { styles } from './calendarStyles';

type TaskEditorModalProps = {
  visible: boolean;
  editingTodo: Todo | null;
  taskName: string;
  onTaskNameChange: (taskName: string) => void;
  endDate: Date;
  endDateLabel: string;
  onEndDateChange: (endDate: Date) => void;
  showDatePicker: boolean;
  onShowDatePickerChange: (showDatePicker: boolean) => void;
  onRequestClose: () => void;
  onSave: () => void;
};

/**
 * Add/Edit task modal. CalendarScreen still owns editingTodo, taskName,
 * endDate, modal visibility and the save logic; this component only
 * renders the form and forwards changes through callbacks.
 *
 * Moved verbatim from CalendarScreen.
 */
function TaskEditorModal({
  visible,
  editingTodo,
  taskName,
  onTaskNameChange,
  endDate,
  endDateLabel,
  onEndDateChange,
  showDatePicker,
  onShowDatePickerChange,
  onRequestClose,
  onSave,
}: TaskEditorModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View style={styles.editorOverlay}>
        {/* BACKDROP */}

        <Pressable style={styles.editorBackdrop} onPress={onRequestClose} />

        {/* MODAL */}

        <View style={styles.editorModal}>
          {/* HEADER */}

          <View style={styles.editorHeader}>
            <View style={styles.editorHeaderText}>
              <Text style={styles.editorTitle}>
                {editingTodo ? 'Edit Task' : 'Add Task'}
              </Text>

              <Text style={styles.editorSubtitle}>
                {editingTodo
                  ? 'Update task details'
                  : 'Create a task for the selected date'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRequestClose}
              style={styles.editorCloseButton}
            >
              <Text style={styles.editorCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* FORM */}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editorContent}
          >
            {/* TASK NAME */}

            <Text style={styles.inputLabel}>Task Name</Text>

            <TextInput
              value={taskName}
              onChangeText={onTaskNameChange}
              placeholder="Enter task name"
              placeholderTextColor="#999999"
              style={styles.taskInput}
              returnKeyType="done"
            />

            {/* END DATE */}

            <Text style={styles.inputLabel}>End Date</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onShowDatePickerChange(true)}
              style={styles.dateInput}
            >
              <Text style={styles.dateInputText}>{endDateLabel}</Text>

              <Text style={styles.calendarEmoji}>📅</Text>
            </TouchableOpacity>

            {/* DATE PICKER */}

            {showDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="calendar"
                onChange={(event, selected) => {
                  /*
                   * Android sends a dismissed
                   * event when the user cancels.
                   *
                   * Do not change the current
                   * date in that case.
                   */
                  if (event.type === 'dismissed') {
                    onShowDatePickerChange(false);
                    return;
                  }

                  if (selected) {
                    onEndDateChange(selected);
                  }

                  onShowDatePickerChange(false);
                }}
              />
            )}

            {/* BUTTONS */}

            <View style={styles.editorButtons}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRequestClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onSave}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {editingTodo ? 'Update Task' : 'Add Task'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default TaskEditorModal;