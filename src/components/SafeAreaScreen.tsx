import React from 'react';
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';

/**
 * Edges a screen inside the BOTTOM TAB navigator must pad with.
 *
 * The tab bar owns the bottom inset (it grows into the Android gesture /
 * 3-button navigation area and pads its own content by the measured inset),
 * so tab screens must NOT add the bottom edge here — doing so creates an
 * empty strip above the tab bar.
 *
 * Layout hierarchy:
 *   SYSTEM WINDOW → SafeAreaProvider → NAVIGATION → SCREEN CONTENT → TAB BAR
 */
export const TAB_SCREEN_EDGES: readonly Edge[] = ['top', 'left', 'right'];

/**
 * Edges a FULL-WINDOW (stack) screen must pad with.
 *
 * These screens are not inside the bottom tab navigator, so no other layer
 * consumes the system bottom inset (gesture/navigation bar, home indicator,
 * display cutout). The content must be fully inset on every edge.
 */
export const FULL_SCREEN_EDGES: readonly Edge[] = [
  'top',
  'bottom',
  'left',
  'right',
];

type SafeAreaScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Which device insets (from `react-native-safe-area-context`, backed by the
   * real runtime `WindowInsets` / iOS safe-area API) to pad the screen with.
   *
   * Defaults to [TAB_SCREEN_EDGES]. Pass [FULL_SCREEN_EDGES] for stack screens.
   */
  edges?: readonly Edge[];
};

function SafeAreaScreen({
  children,
  style,
  edges = TAB_SCREEN_EDGES,
}: SafeAreaScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={[styles.base, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default SafeAreaScreen;
