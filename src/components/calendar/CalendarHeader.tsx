import React from 'react';
import { Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

import { styles } from './calendarStyles';

/**
 * Calendar screen page header.
 *
 * Moved verbatim from CalendarScreen.
 */
function CalendarHeader(): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <CalendarDays size={24} color="#222222" />
      </View>

      <View>
        <Text style={styles.title}>Calendar</Text>

        <Text style={styles.subtitle}>View your tasks by date</Text>
      </View>
    </View>
  );
}

export default CalendarHeader;