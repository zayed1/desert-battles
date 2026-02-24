import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ParallaxLogin from '@/components/ParallaxLogin';
import { useAuth } from '@/lib/auth-context';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const { session, isLoading, signIn, signUp } = useAuth();

  useEffect(() => {
    if (session) {
      router.replace('/(game)');
    }
  }, [session]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <ParallaxLogin onSignIn={signIn} onSignUp={signUp} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
