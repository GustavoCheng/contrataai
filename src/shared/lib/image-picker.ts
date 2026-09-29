import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { AppError } from './errors';
import type { PickedImage } from './storage';

type Source = 'camera' | 'library';

/** Pergunta se é câmera ou galeria, recorta na proporção pedida e devolve a foto (ou null). */
export async function pickImage(aspect: [number, number]): Promise<PickedImage | null> {
  const source = Platform.OS === 'web' ? 'library' : await chooseSource();
  if (!source) return null;

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.7,
  };
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new AppError('camera_denied');
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;

  const [asset] = result.assets;
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}

function chooseSource(): Promise<Source | null> {
  return new Promise((resolve) =>
    Alert.alert(
      'Adicionar foto',
      undefined,
      [
        { text: 'Tirar foto', onPress: () => resolve('camera') },
        { text: 'Escolher da galeria', onPress: () => resolve('library') },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    ),
  );
}
