/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// The custom AndroidSQLite native module is only available on a device
// (emulator/real hardware), so mock the database layer for the Jest render test.
jest.mock('../src/database/database', () => ({
  initializeDatabase: jest.fn(async () => {}),
  db: {
    getTodos: jest.fn(async () => []),
    addTodo: jest.fn(async () => {}),
    updateTodo: jest.fn(async () => {}),
    setCompleted: jest.fn(async () => {}),
    deleteTodo: jest.fn(async () => {}),
  },
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
