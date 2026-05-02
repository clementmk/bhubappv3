import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

const SignUpScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Check for valid domains
    const validDomains = ['bhub.app', 'gmail.com', 'hotmail.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain || !validDomains.includes(emailDomain)) {
      Alert.alert('Invalid Email Domain', 'Email must be from bhub.app, gmail.com, or hotmail.com');
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Registration Failed', result.message || 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <LinearGradient
        colors={['#0F0F0F', '#D96A00', '#FE8004']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
      />

      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>Join the BHUB climbing community</Text>
          </View>

          <View style={styles.card}>
            {[
              { label: 'Full Name', placeholder: 'Alex Tan', value: name, onChange: setName, secure: false, keyboardType: 'default' },
              { label: 'Email', placeholder: 'you@email.com', value: email, onChange: setEmail, secure: false, keyboardType: 'email-address' },
              { label: 'Password', placeholder: '••••••••', value: password, onChange: setPassword, secure: true, keyboardType: 'default' },
              { label: 'Confirm Password', placeholder: '••••••••', value: confirm, onChange: setConfirm, secure: true, keyboardType: 'default' },
            ].map(field => (
              <View key={field.label}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={field.secure}
                  
                  autoCapitalize="none"
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.text} />
                : <Text style={styles.registerBtnText}>Create Account</Text>
              }
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
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
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.base },
  backText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },
  header: { marginBottom: Spacing.xl },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
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
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
    ...Shadow.orange,
  },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { color: Colors.text, fontSize: FontSize.base, fontWeight: '800', letterSpacing: 1 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  loginLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});

export default SignUpScreen;
