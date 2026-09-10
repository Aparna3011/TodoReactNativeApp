import { NativeModules, Platform } from 'react-native';

type AndroidCameraModule = {
  captureImage(): Promise<string>;
};

const { AndroidCamera } = NativeModules;

if (Platform.OS === 'android' && !AndroidCamera) {
  throw new Error(
    'AndroidCamera native module is not available.',
  );
}

export default AndroidCamera as AndroidCameraModule;