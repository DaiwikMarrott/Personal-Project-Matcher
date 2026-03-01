/**
 * Sign Up Screen - Step 1
 * Basic account information
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

export default function SignUp() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    institution: '',
    major: '',
    github: '',
    linkedin: '',
    discord: '',
    instagram: '',
  });
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Save form data temporarily
    await AsyncStorage.setItem('signupData', JSON.stringify(formData));
    
    // Navigate to step 2
    router.push('/signup-step2');
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Let's get to know you better.</Text>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Jane"
                    placeholderTextColor="#a8a29e"
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor="#a8a29e"
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="jane@university.edu"
                  placeholderTextColor="#a8a29e"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#a8a29e"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Institution</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Stanford University"
                  placeholderTextColor="#a8a29e"
                  value={formData.institution}
                  onChangeText={(text) => setFormData({ ...formData, institution: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Major</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor="#a8a29e"
                  value={formData.major}
                  onChangeText={(text) => setFormData({ ...formData, major: text })}
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Social Links</Text>
              <Text style={styles.sectionSubtitle}>
                These links help you connect with teammates (optional)
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>GitHub URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://github.com/..."
                  placeholderTextColor="#a8a29e"
                  value={formData.github}
                  onChangeText={(text) => setFormData({ ...formData, github: text })}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>LinkedIn URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://linkedin.com/in/..."
                  placeholderTextColor="#a8a29e"
                  value={formData.linkedin}
                  onChangeText={(text) => setFormData({ ...formData, linkedin: text })}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Discord Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="username#1234"
                  placeholderTextColor="#a8a29e"
                  value={formData.discord}
                  onChangeText={(text) => setFormData({ ...formData, discord: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Instagram URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://instagram.com/..."
                  placeholderTextColor="#a8a29e"
                  value={formData.instagram}
                  onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 60,
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
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#78716c',
    fontWeight: '600',
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
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
  divider: {
    height: 1,
    backgroundColor: '#a7f3d0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 24,
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
