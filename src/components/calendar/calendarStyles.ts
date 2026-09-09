import { StyleSheet } from 'react-native';

/*
 * Calendar screen shared styles.
 * Moved verbatim from src/screens/CalendarScreen.tsx.
 */
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  /* ========================================================
     HEADER
     ======================================================== */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ece8f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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

  /* ========================================================
     CALENDAR
     ======================================================== */

  calendarWrapper: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 4,
  },

  calendar: {
    backgroundColor: '#f7f7f7',
  },

  calendarDay: {
    width: '100%',
    height: 82,
    paddingHorizontal: 2,
    paddingTop: 3,
    paddingBottom: 3,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  calendarDaySelected: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },

  dayNumberContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  dayNumberContainerSelected: {
    alignSelf: 'center',
    minWidth: 32,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#120ef8',
    marginBottom: 0,
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },

  dayNumberSelected: {
    color: '#ffffff',
  },

  dayNumberDisabled: {
    color: '#aaaaaa',
  },

  /*
   * Ring around today's day number so the calendar always "points
   * at" the real current date. The filled pill still wins when the
   * user selects today itself.
   */
  dayNumberContainerToday: {
    alignSelf: 'center',
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#120ef8',
    marginBottom: 0,
  },

  dayNumberToday: {
    color: '#120ef8',
  },

  calendarTaskList: {
    width: '100%',
  },

  calendarTask: {
    width: '100%',
    minHeight: 16,
    borderRadius: 4,
    paddingHorizontal: 3,
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  calendarTaskPending: {
    backgroundColor: '#4fa7a0',
  },

  calendarTaskCompleted: {
    backgroundColor: '#708bd0',
  },

  calendarTaskCheck: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    marginRight: 2,
  },

  calendarTaskText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '500',
  },

  moreTasksContainer: {
    paddingHorizontal: 2,
    marginTop: 1,
  },

  moreTasksText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666666',
    lineHeight: 11,
  },

  /* ========================================================
     SELECTED DATE HEADER
     ======================================================== */

  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  selectedDateInfo: {
    flex: 1,
    paddingRight: 10,
  },

  selectedDateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  selectedDateSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#777777',
  },

  selectedDateActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    marginRight: 8,
  },

  countBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  addTaskButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#120ef8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addTaskButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ========================================================
     TASK SECTION
     ======================================================== */

  taskSection: {
    padding: 16,
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  taskRowCompleted: {
    backgroundColor: '#fafafa',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#d0a52f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  checkboxCompleted: {
    backgroundColor: '#4caf6d',
    borderColor: '#4caf6d',
  },

  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  taskTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  taskNameCompleted: {
    color: '#777777',
    textDecorationLine: 'line-through',
  },

  taskStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },

  taskStatusPending: {
    color: '#b8860b',
  },

  taskStatusCompleted: {
    color: '#4caf6d',
  },

  editButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  editButtonText: {
    color: '#3346a3',
    fontSize: 12,
    fontWeight: '700',
  },

  deleteButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  deleteButtonText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ========================================================
     EMPTY
     ======================================================== */

  empty: {
    alignItems: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#333333',
  },

  emptySubtitle: {
    marginTop: 7,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },

  emptyAddButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#120ef8',
  },

  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ========================================================
     ADD / EDIT MODAL
     ======================================================== */

  editorOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  editorBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  editorModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: 330,
    paddingBottom: 20,
  },

  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  editorHeaderText: {
    flex: 1,
  },

  editorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  editorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#777777',
  },

  editorCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  editorCloseText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#333333',
  },

  editorContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    marginTop: 5,
  },

  taskInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
    backgroundColor: '#fafafa',
  },

  dateInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },

  dateInputText: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
  },

  calendarEmoji: {
    fontSize: 20,
    marginLeft: 10,
  },

  editorButtons: {
    flexDirection: 'row',
    marginTop: 25,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
  },

  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#120ef8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

