/**
 * Landing Screen
 * Inspired by collabb's landing page
 */
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function Landing() {
  const router = useRouter();

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Build the <Text style={styles.highlight}>future</Text> together.
          </Text>
          <Text style={styles.subtitle}>
            collabb is the premier platform for passionate creators, developers, and designers to find their perfect project match. Stop building alone.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/signin')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#e6f7ed',
  },
  content: {
    maxWidth: 640,
    alignItems: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#1c1917',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -2,
    lineHeight: 64,
  },
  highlight: {
    color: '#10B981',
  },
  subtitle: {
    fontSize: 20,
    color: '#78716c',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 32,
    fontWeight: '500',
    maxWidth: 560,
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 9999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
