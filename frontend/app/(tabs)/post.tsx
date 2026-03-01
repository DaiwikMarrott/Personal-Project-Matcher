/**
 * Create Project Screen
 * Post a new project idea
 */
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { createProject, uploadProjectImage } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PostProjectScreen() {
  const { user, checkProfileExists } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post a project');
      return;
    }

    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    if (description.length < 50) {
      Alert.alert(
        'Error',
        'Description must be at least 50 characters to generate a quality roadmap.'
      );
      return;
    }

    setLoading(true);
    try {
      // Get user profile
      const { exists, profile } = await checkProfileExists(user.id);
      if (!exists || !profile) {
        console.log('[CreateProject] No profile found');
        Alert.alert('Error', 'Profile not found. Please restart the app.');
        setLoading(false);
        return;
      }

      // Parse tags
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Upload image if selected
      let projectImageUrl: string | undefined = undefined;
      if (imageUri) {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          const uploadResult = await uploadProjectImage(profile.id, blob);
          
          if (uploadResult.data) {
            projectImageUrl = uploadResult.data.url;
            console.log('Image uploaded successfully:', projectImageUrl);
          } else {
            console.error('Image upload failed:', uploadResult.error);
            Alert.alert('Warning', 'Failed to upload image. Project will be created without image.');
          }
        } catch (error) {
          console.error('Image upload error:', error);
          Alert.alert('Warning', 'Failed to upload image. Project will be created without image.');
        }
      }

      // Create project
      const result = await createProject({
        owner_id: profile.id,
        title: title.trim(),
        description: description.trim(),
        tags: tagArray,
        duration: duration.trim() || undefined,
        availability_needed: availability.trim() || undefined,
        project_image_url: projectImageUrl,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        setLoading(false);
      } else {
        // Clear form
        setTitle('');
        setDescription('');
        setTags('');
        setDuration('');
        setAvailability('');
        setImageUri(null);
        setLoading(false);
        
        // Show success message and navigate
        Alert.alert(
          '🎉 Success!', 
          'Your project has been posted successfully. Check out the Explore tab to see it!',
          [
            {
              text: 'View in Explore',
              onPress: () => {
                router.push('/(tabs)/explore');
              },
            },
            {
              text: 'Post Another',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AI Study Buddy"
              placeholderTextColor="#a8a29e"
              value={title}
              onChangeText={setTitle}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your project, goals, and what you're looking for..."
              placeholderTextColor="#a8a29e"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.hint}>
              {description.length}/2000 characters (min. 50)
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="React, Python, Design"
              placeholderTextColor="#a8a29e"
              value={tags}
              onChangeText={setTags}
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3 months"
                placeholderTextColor="#a8a29e"
                value={duration}
                onChangeText={setDuration}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Availability Needed</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10 hrs/week"
                placeholderTextColor="#a8a29e"
                value={availability}
                onChangeText={setAvailability}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Image</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
              disabled={loading}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>📷 Tap to add image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Post Project</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7ed',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 32,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534e',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1c1917',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 8,
    marginLeft: 4,
  },
  imagePickerButton: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 18,
    color: '#78716c',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 20,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
