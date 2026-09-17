import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';

type TaskImageProps = {
  /** The stored path — content:// URI, absolute path, or null/undefined */
  imagePath?: string | null;
  /** Style applied to the outer container (sets dimensions) */
  style?: StyleProp<ViewStyle>;
  /** Passed through to the <Image> — defaults to 'cover' */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** Optional override for the inner Image style */
  imageStyle?: StyleProp<ImageStyle>;
  /** Size of the placeholder icon (auto-scales for small containers) */
  placeholderIconSize?: number;
  /** When true, dynamically adjusts container aspect ratio to match the natural image size */
  autoAspectRatio?: boolean;
};

function TaskImage({
  imagePath,
  style,
  resizeMode = 'cover',
  imageStyle,
  placeholderIconSize,
  autoAspectRatio = false,
}: TaskImageProps): React.JSX.Element {
  const [loadError, setLoadError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const hasImage = !!imagePath && !loadError;

  /** Normalise the stored value to a URI the RN Image component accepts */
  const resolveUri = (path: string): string => {
    if (path.startsWith('content://') || path.startsWith('file://')) {
      return path;
    }
    return `file://${path}`;
  };

  useEffect(() => {
    if (!imagePath) {
      setAspectRatio(null);
      setLoadError(false);
      return;
    }

    setLoadError(false);
    const uri = resolveUri(imagePath);

    Image.getSize(
      uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      },
      () => {
        // Fallback: keep default aspectRatio if getSize fails
      },
    );
  }, [imagePath]);

  // Use a smaller icon for thumbnail-sized containers
  const iconSize = placeholderIconSize ?? 32;

  const dynamicAspectRatioStyle =
    autoAspectRatio && aspectRatio && hasImage
      ? { aspectRatio, height: undefined, minHeight: undefined }
      : null;

  return (
    <View style={[styles.container, style, dynamicAspectRatioStyle]}>
      {hasImage ? (
        <Image
          source={{ uri: resolveUri(imagePath!) }}
          style={[styles.image, dynamicAspectRatioStyle, imageStyle]}
          resizeMode={resizeMode}
          onError={() => setLoadError(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <ImageIcon size={iconSize} color="#9CA3AF" strokeWidth={1.8} />

          {iconSize >= 24 && (
            <Text style={styles.placeholderText}>No image</Text>
          )}
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

  placeholderText: {
    marginTop: 6,
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
});

export default TaskImage;

