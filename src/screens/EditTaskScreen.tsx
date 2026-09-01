import React, {useState} from 'react';
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

function EditTaskScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditRouteProp>();

  const {todo} = route.params;

  const [taskName, setTaskName] = useState(todo.task_name);
  const [endDate, setEndDate] = useState(todo.end_date);

  const handleSave = async () => {
    const task = taskName.trim();
    const date = endDate.trim();

    if (!task) {
      Alert.alert('Task required', 'Please enter a task name.');
      return;
    }

    if (!date) {
      Alert.alert('End date required', 'Please enter an end date.');
      return;
    }

    try {
      await updateTodo(todo.id, task, date);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Unable to update the task.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999999"
          />

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
    </SafeAreaView>
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