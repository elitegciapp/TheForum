import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from './Button';
import { Input } from './Input';
import { uploadImageAsync } from '../lib/storage';
import { createPost } from '../lib/posts';
import { supabase } from '../lib/supabase';

const MAX_IMAGES = 5;

export function PostComposer({ roomId, onPosted }: { roomId?: string; onPosted: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<{ uri: string; mime: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const canPost = useMemo(() => title.trim().length > 0 && body.trim().length > 0, [title, body]);

  async function pickImages() {
    if (images.length >= MAX_IMAGES) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 1,
    });

    if (result.canceled) return;

    const picked = result.assets.map((a) => ({
      uri: a.uri,
      mime: a.mimeType ?? 'image/jpeg',
    }));

    setImages((prev: { uri: string; mime: string }[]) => [...prev, ...picked].slice(0, MAX_IMAGES));
  }

  function removeImage(uri: string) {
    setImages((prev: { uri: string; mime: string }[]) => prev.filter((i) => i.uri !== uri));
  }

  async function compress(uri: string) {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  }

  async function submit() {
    if (!canPost) return;

    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) throw new Error('Not authenticated');

      const userId = session.user.id;

      const urls: string[] = [];
      for (const img of images) {
        const compressedUri = await compress(img.uri);
        const url = await uploadImageAsync({
          userId,
          localUri: compressedUri,
          contentType: 'image/jpeg',
        });
        urls.push(url);
      }

      await createPost({ title: title.trim(), body: body.trim(), imageUrls: urls, roomId });

      setTitle('');
      setBody('');
      setImages([]);
      onPosted();
    } catch (e: any) {
      Alert.alert('Could not publish', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Start a discussion</Text>

      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Give this a clear title…"
        autoCapitalize="sentences"
      />

      <Input
        label="Body"
        value={body}
        onChangeText={setBody}
        placeholder="Share your perspective…"
        autoCapitalize="sentences"
      />

      <View style={styles.row}>
        <Button title="Add Images" variant="secondary" onPress={pickImages} />
      </View>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {images.map((i) => (
            <View key={i.uri} style={styles.thumbWrap}>
              <Image source={{ uri: i.uri }} style={styles.thumb} />
              <Pressable onPress={() => removeImage(i.uri)} style={styles.remove}>
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <Button title="Publish" onPress={submit} disabled={!canPost} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1E1A14', fontFamily: 'PlayfairDisplay_600SemiBold' },
  row: { marginTop: 6 },
  thumbWrap: { marginRight: 10, marginTop: 10 },
  thumb: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#EEE' },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
