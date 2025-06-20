import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/postService';
import { useNavigation } from '@react-navigation/native';

export default function CreatePostScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applicable, setApplicable] = useState(false);

  const pickImage = async () => {
    setError('');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handlePost = async () => {
    setError('');
    if (!user) {
      setError('You must be logged in to create a post.');
      return;
    }
    if (!image) {
      setError('Please select an image.');
      return;
    }
    if (!caption.trim()) {
      setError('Please enter a caption.');
      return;
    }
    setLoading(true);
    try {
      const postData: any = {
        userId: user.uid,
        username: user.username,
        userType: user.userType,
        caption: caption.trim().slice(0, 256),
        imageBase64: image,
      }
      if (user.userType === 'employer') {
        postData.applicable = applicable;
      }
      await createPost(postData);
      setImage(null);
      setCaption('');
      (navigation as any).navigate('Home');
    } catch (e) {
      console.log('Create post error:', e);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
        </View>
        <View style={styles.content}>
          {user && (
            <Text style={styles.userTypeText}>
              Posting as: <Text style={{ fontWeight: 'bold' }}>{user.username}</Text> ({user.userType})
            </Text>
          )}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imagePickerText}>Pick an image</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption (max 256 chars)"
            value={caption}
            onChangeText={text => setCaption(text.slice(0, 256))}
            maxLength={256}
            multiline
          />
          {user && user.userType === 'employer' && (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
              onPress={() => setApplicable(!applicable)}
              activeOpacity={0.7}
            >
              <View style={{
                width: 20,
                height: 20,
                borderWidth: 1,
                borderColor: '#007AFF',
                borderRadius: 4,
                backgroundColor: applicable ? '#007AFF' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {applicable && (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
                )}
              </View>
              <Text style={{ marginLeft: 8 }}>Applicable</Text>
            </TouchableOpacity>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  userTypeText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  imagePicker: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f7f7f7',
  },
  imagePickerText: {
    color: '#888',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  captionInput: {
    width: '100%',
    minHeight: 60,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
}); 