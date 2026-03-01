/**
 * Sign Up Screen - Step 2
 * Skills and interests (with green header bar)
 */
import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProfile } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpStep2() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState('');
  const [loading, setLoading] = useState(false);

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter(i => i !== item));
  };

  const handleComplete = async () => {
    // Validate that at least one interest or expertise is provided
    if (interests.length === 0 && expertise.length === 0) {
      Alert.alert('Add Your Skills', 'Please add at least one interest or expertise to help us match you with projects.');
      return;
    }

    setLoading(true);
    try {
      // Get saved form data from step 1
      const savedData = await AsyncStorage.getItem('signupData');
      if (!savedData) {
        Alert.alert('Error', 'Registration data not found. Please start over.');
        router.push('/signup');
        return;
      }

      const formData = JSON.parse(savedData);

      // Step 1: Create Supabase auth user
      console.log('Creating Supabase user...');
      const signupResult = await signUpWithEmail(formData.email, formData.password);
      console.log('Signup result:', signupResult);
      
      // Check if we got a user back (might need email confirmation)
      if (!signupResult || !signupResult.user) {
        console.error('No user returned from signup');
        Alert.alert(
          'Account Created', 
          'Please check your email to verify your account before signing in.'
        );
        setLoading(false);
        router.replace('/signin');
        return;
      }

      console.log('User created, now creating profile...');
      
      // Step 2: Create profile immediately
      const urls: any = {};
      if (formData.github) urls.github = formData.github;
      if (formData.linkedin) urls.linkedin = formData.linkedin;
      if (formData.discord) urls.discord = formData.discord;
      if (formData.instagram) urls.instagram = formData.instagram;

      const result = await createProfile({
        auth_user_id: signupResult.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        major: formData.major || 'Undeclared',
        interests: interests.join(', '),
        skills: expertise,
        urls,
        experience_level: 'beginner',
      });

      // Clean up AsyncStorage
      await AsyncStorage.removeItem('signupData');

      if (result.error) {
        console.error('Profile creation error:', result.error);
        Alert.alert('Profile Creation Failed', result.error);
        setLoading(false);
      } else {
        console.log('Profile created successfully!');
        Alert.alert('Success', 'Your account has been created! Please sign in.');
        router.replace('/signin');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Sign Up Failed', error.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      {/* Green Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Skills</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
              <Text style={styles.title}>Your Skills</Text>
              <Text style={styles.subtitle}>What are you passionate about?</Text>

              {/* Interests */}
              <View style={styles.section}>
                <Text style={styles.label}>Interests</Text>
                <View style={styles.tagContainer}>
                  {interests.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.tag}
                      onPress={() => removeInterest(item)}
                    >
                      <Text style={styles.tagText}>{item}</Text>
                      <Text style={styles.tagRemove}>  ×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addContainer}>
                  <TextInput
                    style={[styles.input, styles.addInput]}
                    placeholder="Add an interest (e.g. UI Design)"
                    placeholderTextColor="#a8a29e"
                    value={newInterest}
                    onChangeText={setNewInterest}
                    onSubmitEditing={addInterest}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addInterest}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expertise */}
              <View style={styles.section}>
                <Text style={styles.label}>Expertise</Text>
                <View style={styles.tagContainer}>
                  {expertise.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.tag, styles.tagExpertise]}
                      onPress={() => removeExpertise(item)}
                    >
                      <Text style={styles.tagTextExpertise}>{item}</Text>
                      <Text style={styles.tagRemoveExpertise}>  ×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addContainer}>
                  <TextInput
                    style={[styles.input, styles.addInput]}
                    placeholder="Add expertise (e.g. AI, ML, Backend)"
                    placeholderTextColor="#a8a29e"
                    value={newExpertise}
                    onChangeText={setNewExpertise}
                    onSubmitEditing={addExpertise}
                  />
                  <TouchableOpacity
                    style={[styles.addButton, styles.addButtonExpertise]}
                    onPress={addExpertise}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Complete Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#e6f7ed',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 32,
    padding: 40,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#78716c',
    marginBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534e',
    marginBottom: 12,
    marginLeft: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '700',
  },
  tagRemove: {
    color: '#065f46',
    fontSize: 18,
    fontWeight: '700',
  },
  tagExpertise: {
    backgroundColor: '#f5f5f4',
    borderColor: '#d6d3d1',
  },
  tagTextExpertise: {
    color: '#1c1917',
  },
  tagRemoveExpertise: {
    color: '#1c1917',
  },
  addContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addInput: {
    flex: 1,
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
  addButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    width: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonExpertise: {
    backgroundColor: '#f5f5f4',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
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
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
