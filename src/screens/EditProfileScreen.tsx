import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

interface FormData extends Partial<User> {
  skillsInput: string;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    bio: '',
    location: '',
    phoneNumber: '',
    website: '',
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      instagram: '',
    },
    skills: [],
    skillsInput: '',
    profileImageUrl: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        location: user.location || '',
        phoneNumber: user.phoneNumber || '',
        website: user.website || '',
        socialLinks: user.socialLinks || {
          linkedin: '',
          github: '',
          twitter: '',
          instagram: '',
        },
        skills: user.skills || [],
        skillsInput: user.skills?.join(', ') || '',
        profileImageUrl: user.profileImageUrl || '',
      });
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        try {
          const base64Image = result.assets[0].base64;
          if (!base64Image) {
            throw new Error('Failed to get base64 data from image');
          }
          setFormData(prev => ({
            ...prev,
            profileImageUrl: `data:image/jpeg;base64,${base64Image}`
          }));
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const skills = formData.skillsInput
        ? formData.skillsInput
            .split(/[,;]/)
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0)
        : [];

      const updateData = {
        bio: formData.bio,
        location: formData.location,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        socialLinks: {
          linkedin: formData.socialLinks?.linkedin || '',
          github: formData.socialLinks?.github || '',
          twitter: formData.socialLinks?.twitter || '',
          instagram: formData.socialLinks?.instagram || '',
        },
        skills,
        profileImageUrl: formData.profileImageUrl,
      };

      console.log('Saving profile data:', JSON.stringify(updateData, null, 2));
      await updateUser(updateData);

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleSkillsChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      skillsInput: text,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ 
              uri: formData.profileImageUrl || 'https://via.placeholder.com/100'
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={pickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.changePhotoText}>Change Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9+\-() ]/g, '');
              setFormData(prev => ({ ...prev, phoneNumber: cleaned }));
            }}
            keyboardType="phone-pad"
            maxLength={15}
          />
          <TextInput
            style={styles.input}
            placeholder="Website"
            value={formData.website}
            onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>
          <TextInput
            style={styles.input}
            placeholder="LinkedIn URL"
            value={formData.socialLinks?.linkedin}
            onChangeText={(text) => handleSocialLinkChange('linkedin', text)}
            keyboardType="url"
          />
          <TextInput
            style={styles.input}
            placeholder="GitHub URL"
            value={formData.socialLinks?.github}
            onChangeText={(text) => handleSocialLinkChange('github', text)}
            keyboardType="url"
          />
          <TextInput
            style={styles.input}
            placeholder="Twitter URL"
            value={formData.socialLinks?.twitter}
            onChangeText={(text) => handleSocialLinkChange('twitter', text)}
            keyboardType="url"
          />
          <TextInput
            style={styles.input}
            placeholder="Instagram URL"
            value={formData.socialLinks?.instagram}
            onChangeText={(text) => handleSocialLinkChange('instagram', text)}
            keyboardType="url"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter skills separated by commas"
            value={formData.skillsInput}
            onChangeText={handleSkillsChange}
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>
            Example: JavaScript, React, Node.js, TypeScript
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  formContainer: {
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 