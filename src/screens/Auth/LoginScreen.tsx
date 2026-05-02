import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.message || 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <LinearGradient
        colors={['#FE8004', '#D96A00', '#0F0F0F']}
        locations={[0, 0.3, 0.7]}
        style={styles.gradient}
      />

      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>B</Text>
            </View>
            <Text style={styles.brandName}>BHUB</Text>
            <Text style={styles.tagline}>Indoor Bouldering Gym</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.text} />
                : <Text style={styles.loginBtnText}>Sign In</Text>
              }
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New to BHUB? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  body: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  logoSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.text, alignItems: 'center', justifyContent: 'center',
    ...Shadow.orange, marginBottom: Spacing.md,
  },
  logoLetter: { fontSize: 40, fontWeight: '900', color: Colors.primary },
  brandName: { fontSize: 32, fontWeight: '900', color: Colors.text, letterSpacing: 6 },
  tagline: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  cardTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    color: Colors.text,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.orange,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: Colors.text, fontSize: FontSize.base, fontWeight: '800', letterSpacing: 1 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm },
  signupText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  signupLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});

export default LoginScreen;
