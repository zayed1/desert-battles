import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  I18nManager,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

interface ParallaxLoginProps {
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
}

function Star({ delay, top, left, size }: { delay: number; top: number; left: number; size: number }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFDE7',
        },
        animatedStyle,
      ]}
    />
  );
}

function DuneLayer({ color, height, speed, yOffset }: { color: string; height: number; speed: number; yOffset: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-SCREEN_WIDTH * 0.3, { duration: speed, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: yOffset,
          left: -SCREEN_WIDTH * 0.15,
          width: SCREEN_WIDTH * 1.6,
          height: height,
        },
        animatedStyle,
      ]}
    >
      <View style={{
        width: '100%',
        height: '100%',
        borderTopLeftRadius: SCREEN_WIDTH * 0.8,
        borderTopRightRadius: SCREEN_WIDTH * 0.4,
        backgroundColor: color,
      }} />
    </Animated.View>
  );
}

function CamelCaravan() {
  const translateX = useSharedValue(SCREEN_WIDTH + 100);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-300, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const camelSize = 18;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: SCREEN_HEIGHT * 0.32,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 12,
        },
        animatedStyle,
      ]}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ alignItems: 'center' }}>
          <Ionicons
            name="trail-sign-outline"
            size={camelSize + (i === 2 ? 4 : 0)}
            color="rgba(30, 15, 5, 0.7)"
          />
        </View>
      ))}
    </Animated.View>
  );
}

export default function ParallaxLogin({ onSignIn, onSignUp }: ParallaxLoginProps) {
  const insets = useSafeAreaInsets();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) }));
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    formOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (isSignUp && !username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const result = isSignUp
        ? await onSignUp(email, password, username)
        : await onSignIn(email, password);

      if (result.error) {
        setError(result.error);
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    top: Math.random() * SCREEN_HEIGHT * 0.35,
    left: Math.random() * SCREEN_WIDTH,
    size: Math.random() * 2.5 + 1,
    delay: Math.random() * 3000,
  }));

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1628', '#1B2D4F', '#2C3E6B', '#4A3520', '#8B6914']}
        locations={[0, 0.25, 0.45, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {stars.map((star) => (
        <Star key={star.id} delay={star.delay} top={star.top} left={star.left} size={star.size} />
      ))}

      <DuneLayer color="#6B4F1D" height={SCREEN_HEIGHT * 0.25} speed={40000} yOffset={SCREEN_HEIGHT * 0.15} />
      <DuneLayer color="#8B6B2E" height={SCREEN_HEIGHT * 0.2} speed={30000} yOffset={SCREEN_HEIGHT * 0.08} />
      <DuneLayer color="#A07830" height={SCREEN_HEIGHT * 0.18} speed={20000} yOffset={0} />

      <CamelCaravan />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
        style={styles.contentContainer}
      >
        <View style={[styles.innerContent, { paddingTop: insets.top + webTopInset + 20 }]}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.logoTitle}>معارك الصحراء</Text>
            <Text style={styles.logoSubtitle}>ابنِ مملكتك وسيطر على الصحراء</Text>
          </Animated.View>

          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            <View style={styles.formCard}>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="اسم المستخدم"
                    placeholderTextColor={Colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="كلمة المرور"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </Pressable>
              </View>

              {!!error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                  loading && styles.submitButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                style={styles.switchButton}
              >
                <Text style={styles.switchText}>
                  {isSignUp ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
                  <Text style={styles.switchTextBold}>
                    {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
  innerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 165, 71, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 71, 0.3)',
  },
  logoTitle: {
    fontSize: 28,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 14,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(26, 14, 5, 0.85)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.15)',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontFamily: 'Tajawal_400Regular',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: 'Tajawal_400Regular',
    flex: 1,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'center',
  },
  switchTextBold: {
    color: Colors.primary,
    fontFamily: 'Tajawal_700Bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'Tajawal_400Regular',
  },
});
