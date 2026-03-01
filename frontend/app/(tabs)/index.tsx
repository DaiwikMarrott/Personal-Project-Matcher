import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setError('');
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
        alert('Success! Check your email to verify your account.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  if (user) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              🧬 Project Jekyll & Hyde
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              The STEM Matchmaker
            </ThemedText>
          </View>

          <View style={styles.welcomeCard}>
            <ThemedText type="subtitle" style={styles.welcomeText}>
              Welcome back, {user.email}! 👋
            </ThemedText>
            <ThemedText style={styles.description}>
              Ready to find your perfect project partner?
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            
            <TouchableOpacity style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>👤</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                Create Your Profile
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Tell us about your skills and interests
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>💡</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                Post a Project Idea
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Share your vision and get an AI-generated roadmap
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>🔍</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                Find Matches
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Discover projects and teammates that fit your wavelength
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            🧬 Project Jekyll & Hyde
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Where brilliant ideas meet the perfect team
          </ThemedText>
        </View>

        <View style={styles.featureSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            How It Works
          </ThemedText>
          
          <View style={styles.featureCard}>
            <ThemedText style={styles.featureEmoji}>👤</ThemedText>
            <ThemedText type="defaultSemiBold">Create Your Profile</ThemedText>
            <ThemedText style={styles.featureText}>
              Share your major, skills, and availability
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <ThemedText style={styles.featureEmoji}>💡</ThemedText>
            <ThemedText type="defaultSemiBold">Post an Idea</ThemedText>
            <ThemedText style={styles.featureText}>
              Dr. Jekyll AI turns it into a professional roadmap
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <ThemedText style={styles.featureEmoji}>🤝</ThemedText>
            <ThemedText type="defaultSemiBold">Get Matched</ThemedText>
            <ThemedText style={styles.featureText}>
              AI finds complementary skills, not duplicates
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <ThemedText style={styles.featureEmoji}>🎤</ThemedText>
            <ThemedText type="defaultSemiBold">The Hyde Factor</ThemedText>
            <ThemedText style={styles.featureText}>
              Voice roasts boring profiles & hypes great projects
            </ThemedText>
          </View>
        </View>

        <View style={styles.authSection}>
          <ThemedText type="subtitle" style={styles.authTitle}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <ThemedText style={styles.error}>{error}</ThemedText>
          ) : null}

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAuth}
            disabled={loading}
          >
            <ThemedText style={styles.primaryButtonText}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
          >
            <ThemedText style={styles.googleButtonText}>
              Continue with Google
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <ThemedText style={styles.toggleText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginBottom: 20,
  },
  welcomeText: {
    marginBottom: 8,
  },
  description: {
    opacity: 0.8,
  },
  section: {
    marginBottom: 20,
  },
  featureSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 20,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    opacity: 0.8,
    marginTop: 4,
  },
  actionCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionDescription: {
    opacity: 0.8,
    marginTop: 4,
  },
  authSection: {
    marginTop: 20,
  },
  authTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  error: {
    color: '#ff5252',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 8,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
