import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle, ImageStyle } from 'react-native';

type TaskImageProps = {
  /** The stored path — content:// URI, absolute path, or null/undefined */
  imagePath?: string | null;
  /** Style applied to the outer container (sets dimensions) */
  style?: StyleProp<ViewStyle>;
  /** Passed through to the <Image> — defaults to 'cover' */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** Optional override for the inner Image style */
  imageStyle?: StyleProp<ImageStyle>;
};

/**
 * Displays a task image from any storage path the app uses:
 *   • content://media/...  (MediaStore, Android 10+)
 *   • /absolute/path/...   (bare file path, Android 7–9)
 *   • file:///absolute/... (already-prefixed file path)
 *
 * Shows a neutral grey placeholder when:
 *   • imagePath is null / undefined / empty
 *   • the URI fails to load (onError)
 */
function TaskImage({
  imagePath,
  style,
  resizeMode = 'cover',
  imageStyle,
}: TaskImageProps): React.JSX.Element {
  const [loadError, setLoadError] = useState(false);

  const hasImage = !!imagePath && !loadError;

  /** Normalise the stored value to a URI the RN Image component accepts */
  const resolveUri = (path: string): string => {
    if (path.startsWith('content://') || path.startsWith('file://')) {
      return path;
    }
    return `file://${path}`;
  };

  return (
    <View style={[styles.container, style]}>
      {hasImage ? (
        <Image
          source={{ uri: resolveUri(imagePath!) }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
          onError={() => setLoadError(true)}
        />
      ) : (
        /* Placeholder shown when there is no image or loading fails */
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🖼️</Text>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eeeeee',
  },
  placeholderIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
});

export default TaskImage;
