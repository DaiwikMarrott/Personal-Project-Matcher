import { StyleSheet, ScrollView, View, TouchableOpacity, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Image, Alert } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';

// Use hardcoded URL for web, env variable for native
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
};

const API_URL = getApiUrl();

export default function PostProjectScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState('');
  const [availability, setAvailability] = useState('');
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!title.trim()) {
      setError('Please enter a project title');
      return false;
    }
    
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long');
      return false;
    }
    
    if (!description.trim()) {
      setError('Please enter a project description');
      return false;
    }
    
    if (description.trim().length < 50) {
      setError('Description must be at least 50 characters to generate a quality roadmap. Please provide more details about your project goals, required skills, and expected outcomes.');
      return false;
    }

    if (description.trim().length > 2000) {
      setError('Description is too long (max 2000 characters)');
      return false;
    }
    
    return true;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.base64 
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setProjectImage(imageUri);
        setImageFile(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to post a project');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const projectData = {
        owner_id: user.id,
        title: title.trim(),
        description: description.trim(),
        tags: tagsArray,
        duration: duration.trim() || null,
        availability_needed: availability.trim() || null,
        project_image_url: projectImage || null,
      };

      console.log('Submitting project:', projectData);

      const response = await fetch(`${API_URL}/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create project');
      }

      const result = await response.json();
      console.log('Project created:', result);

      setSuccess(true);
      setTitle('');
      setDescription('');
      setTags('');
      setDuration('');
      setAvailability('');
      setProjectImage(null);
      setImageFile(null);

      // Show success message for 3 seconds to allow AI processing, then navigate to explore
      setTimeout(() => {
        setSuccess(false);
        router.push('/explore');
      }, 3000);

    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setDuration('');
    setAvailability('');
    setProjectImage(null);
    setImageFile(null);
    setError('');
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Post a Project 💡
          </ThemedText>
          <View style={styles.errorCard}>
            <ThemedText style={styles.errorText}>
              Please sign in to post a project idea
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  if (success) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successCard}>
            <ActivityIndicator size="large" color="#4CAF50" style={styles.successSpinner} />
            <ThemedText style={styles.successEmoji}>🎉</ThemedText>
            <ThemedText type="subtitle" style={styles.successTitle}>
              Project Created Successfully!
            </ThemedText>
            <ThemedText style={styles.successText}>
              ✨ Dr. Jekyll is generating your AI-powered roadmap...
            </ThemedText>
            <ThemedText style={styles.successText}>
              🔄 Loading your project into the explore page...
            </ThemedText>
            <ThemedText style={styles.successSubtext}>
              Please wait...
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Post a Project 💡
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Share your vision - Dr. Jekyll will generate a technical roadmap
            </ThemedText>
          </View>

          <View style={styles.infoCard}>
            <ThemedText style={styles.infoEmoji}>🤖</ThemedText>
            <ThemedText style={styles.infoText}>
              Our AI will analyze your project and create a professional roadmap to help others understand how to contribute.
            </ThemedText>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Project Title <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., AI-Powered Health Tracker App"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <ThemedText style={styles.helper}>
                {title.length}/100 characters
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Project Description <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <ThemedText style={styles.helper}>
                Be specific! Include: goals, required skills, target users, and key features.
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={`Example: "I want to build a mobile app that helps college students track their health metrics using AI. The app should:
• Track daily exercise, sleep, and nutrition
• Use machine learning to provide personalized recommendations
• Have a clean, intuitive UI with data visualization
• Integrate with wearable devices

Looking for: Frontend developer (React Native), Backend developer (Python/FastAPI), and someone with ML experience."`}
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={10}
                maxLength={2000}
                textAlignVertical="top"
              />
              <View style={styles.helperRow}>
                <ThemedText style={[
                  styles.helper,
                  description.length < 50 && styles.helperWarning
                ]}>
                  {description.length}/2000 characters
                </ThemedText>
                {description.length < 50 && (
                  <ThemedText style={styles.helperWarning}>
                    (minimum 50 for AI roadmap)
                  </ThemedText>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Tags (Optional)
              </ThemedText>
              <ThemedText style={styles.helper}>
                Comma-separated: e.g., "AI, Mobile, Health, React Native"
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="AI, Mobile, Health, React Native"
                placeholderTextColor="#999"
                value={tags}
                onChangeText={setTags}
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Project Duration (Optional)
              </ThemedText>
              <ThemedText style={styles.helper}>
                How long do you expect this project to take?
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2 weeks, 3 months, 1 semester"
                placeholderTextColor="#999"
                value={duration}
                onChangeText={setDuration}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Availability Needed (Optional)
              </ThemedText>
              <ThemedText style={styles.helper}>
                When do you need team members to be available?
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10 hours/week, Weekends, Flexible"
                placeholderTextColor="#999"
                value={availability}
                onChangeText={setAvailability}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Project Image (Optional)
              </ThemedText>
              <ThemedText style={styles.helper}>
                Upload a schematic, diagram, or mockup for your project
              </ThemedText>
              
              {projectImage ? (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: projectImage }} 
                    style={styles.projectImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.changeImageButton}
                    onPress={pickImage}
                  >
                    <ThemedText style={styles.changeImageText}>Change Image</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <ThemedText style={styles.uploadEmoji}>📷</ThemedText>
                  <ThemedText style={styles.uploadText}>Tap to Upload Image</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClear}
                disabled={loading}
              >
                <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled
                ]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    Create Project 🚀
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tipsCard}>
            <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
              💡 Tips for a Great Project Post
            </ThemedText>
            <ThemedText style={styles.tipText}>
              ✓ Be specific about what you want to build
            </ThemedText>
            <ThemedText style={styles.tipText}>
              ✓ Mention required skills and technologies
            </ThemedText>
            <ThemedText style={styles.tipText}>
              ✓ Explain the problem you're solving
            </ThemedText>
            <ThemedText style={styles.tipText}>
              ✓ Include timeline or scope expectations
            </ThemedText>
            <ThemedText style={styles.tipText}>
              ✓ The more detail, the better the AI roadmap!
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  infoCard: {
    backgroundColor: Colors.info,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  infoText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: Colors.success,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 100,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  successSpinner: {
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  successTitle: {
    color: Colors.text.inverse,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: Colors.text.inverse,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    color: Colors.text.inverse,
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  required: {
    color: Colors.error,
  },
  helper: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginBottom: 8,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperWarning: {
    color: Colors.warning,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 200,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  imageContainer: {
    marginTop: 12,
  },
  projectImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  changeImageText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 12,
  },
  uploadEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    marginBottom: 8,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
