import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { updateUserMembership } from '../../database/queries';
import { userAPI } from '../../api/cloudAPI';

// Membership plans mapping
const MEMBERSHIP_PLANS: Record<string, { type: string; durationMonths: number }> = {
  'Monthly Pass': { type: 'Monthly Pass', durationMonths: 1 },
  'Monthly Pass Renewal': { type: 'Monthly Pass', durationMonths: 1 },
  'Day Pass': { type: 'Day Pass', durationMonths: 0.1 },
  'Student Pass': { type: 'Student Pass', durationMonths: 1 },
  'Student Pass Renewal': { type: 'Student Pass', durationMonths: 1 },
};

// Simulate payment gateway with various error scenarios
// Testing scenarios:
// - Card ending in 0000: Card declined
// - Card ending in 1111: Insufficient funds
// - Card ending in 2222: Invalid card
// - Card ending in 3333: Network error
// - Random 5% chance: Gateway error
// - Random 3% chance: Timeout (5 second delay)
const simulatePaymentGateway = async (cardNumber: string, expiry: string, cvv: string): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate different error scenarios based on card number patterns
  if (cardNumber.endsWith('0000')) {
    throw { code: 'CARD_DECLINED', message: 'Your card was declined by the issuer.' };
  }

  if (cardNumber.endsWith('1111')) {
    throw { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds available.' };
  }

  if (cardNumber.endsWith('2222')) {
    throw { code: 'INVALID_CARD', message: 'Card number is invalid.' };
  }

  if (cardNumber.endsWith('3333')) {
    throw { code: 'NETWORK_ERROR', message: 'Network connection failed. Please try again.' };
  }

  // Simulate random failures (5% chance)
  if (Math.random() < 0.05) {
    throw { code: 'GATEWAY_ERROR', message: 'Payment gateway temporarily unavailable.' };
  }

  // Simulate occasional network timeouts
  if (Math.random() < 0.03) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Long delay
    throw { code: 'TIMEOUT', message: 'Payment request timed out. Please try again.' };
  }

  // Success case - no error thrown
};

const PaymentScreen = ({ navigation, route }: any) => {
  const { user, refreshUser } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const planName = route.params?.planName || 'Membership Pass';
  const planConfig = MEMBERSHIP_PLANS[planName] || MEMBERSHIP_PLANS['Monthly Pass'];

  const handleConfirmPayment = async () => {
    try {
      // Validation
      if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
        Alert.alert('Missing Details', 'Please fill in all credit card details.');
        return;
      }

      if (cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert('Invalid Card', 'Card number must be at least 16 digits.');
        return;
      }

      // Validate expiry date format and future date
      if (expiry.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter expiry date in MM/YY format.');
        return;
      }

      const [monthStr, yearStr] = expiry.split('/');
      const month = parseInt(monthStr, 10);
      const year = parseInt('20' + yearStr, 10); // Convert YY to YYYY

      if (month < 1 || month > 12) {
        Alert.alert('Invalid Expiry', 'Month must be between 01 and 12.');
        return;
      }

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        Alert.alert('Card Expired', 'Your card has expired. Please use a valid card.');
        return;
      }

      if (cvv.length < 3) {
        Alert.alert('Invalid CVV', 'CVV must be at least 3 digits.');
        return;
      }

      if (!user?.username) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      setIsProcessing(true);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject({ code: 'TIMEOUT', message: 'Payment request timed out. Please try again.' }), 10000); // 10 second timeout
      });

      // Race between payment gateway and timeout
      try {
        await Promise.race([
          simulatePaymentGateway(cardNumber.replace(/\s/g, ''), expiry, cvv),
          timeoutPromise
        ]);
      } catch (paymentError: any) {
        // Handle specific payment gateway errors
        if (paymentError.code === 'CARD_DECLINED') {
          Alert.alert('Payment Declined', 'Your card was declined. Please check with your bank or try a different card.');
          setIsProcessing(false);
          return;
        } else if (paymentError.code === 'INSUFFICIENT_FUNDS') {
          Alert.alert('Insufficient Funds', 'Your card has insufficient funds. Please try a different payment method.');
          setIsProcessing(false);
          return;
        } else if (paymentError.code === 'INVALID_CARD') {
          Alert.alert('Invalid Card', 'The card details provided are invalid. Please check and try again.');
          setIsProcessing(false);
          return;
        } else if (paymentError.code === 'NETWORK_ERROR') {
          Alert.alert('Connection Error', 'Unable to connect to payment processor. Please check your internet connection and try again.');
          setIsProcessing(false);
          return;
        } else if (paymentError.code === 'TIMEOUT') {
          Alert.alert('Request Timeout', 'The payment request timed out. Please check your connection and try again.');
          setIsProcessing(false);
          return;
        } else {
          Alert.alert('Payment Failed', paymentError.message || 'An error occurred while processing your payment. Please try again.');
          setIsProcessing(false);
          return;
        }
      }

      // Calculate membership expiry date
      const membershipExpiryDate = new Date();
      membershipExpiryDate.setMonth(membershipExpiryDate.getMonth() + planConfig.durationMonths);
      const expiryString = membershipExpiryDate.toISOString().split('T')[0];

      // Update membership in cloud
      try {
        await userAPI.updateMembership(user.username, planConfig.type, expiryString);
      } catch (cloudErr) {
        console.warn('Failed to update membership in cloud', cloudErr);
      }

      // Update membership in local database
      await updateUserMembership(
        user.username,
        planConfig.type,
        expiryString,
      );

      // Refresh user context
      await refreshUser();

      // Success alert
      Alert.alert(
        'Payment Successful! 🎉',
        `Your ${planConfig.type} has been activated until ${expiryString}.`,
        [
          {
            text: 'Awesome!',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, ''); // Remove non-numbers
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim(); // Add space every 4 digits
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, ''); // Remove non-numbers
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Purchasing: {planName}</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Card Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="card-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={19}
            value={cardNumber}
            onChangeText={handleCardNumberChange}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: Spacing.sm }]}>
            <Text style={styles.label}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={5}
              value={expiry}
              onChangeText={handleExpiryChange}
            />
          </View>

          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.label}>CVV</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={cvv}
                onChangeText={setCvv}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.payBtn, isProcessing && styles.payBtnDisabled]} 
          onPress={handleConfirmPayment} 
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.processingText}>Processing Payment...</Text>
            </View>
          ) : (
            <Text style={styles.payBtnText}>Confirm Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background },
  header: { 
    paddingTop: Spacing.xxxl, 
    paddingHorizontal: Spacing.xl, 
    paddingBottom: Spacing.xl },
  backBtn: { 
    marginBottom: Spacing.base },
  backText: { 
    color: Colors.primary, 
    fontSize: FontSize.base, 
    fontWeight: '600' },
  title: { 
    fontSize: FontSize.xxl, 
    fontWeight: '900', 
    color: Colors.text },
  subtitle: { 
    fontSize: FontSize.md, 
    color: Colors.textSecondary, 
    marginTop: 4 },
  formContainer: { 
    padding: Spacing.xl },
  label: { 
    color: Colors.textSecondary, 
    fontSize: FontSize.sm, 
    fontWeight: '700', 
    marginBottom: 8, 
    letterSpacing: 1 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.surfaceAlt, 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    marginBottom: Spacing.lg, 
    paddingHorizontal: Spacing.md },
  icon: { 
    marginRight: 10 },
  input: { 
    flex: 1, 
    height: 50, 
    fontSize: FontSize.base, 
    fontWeight: '600' ,
    color: Colors.text },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: Spacing.xl },
  inputGroup: { 
    flex: 1, 
    backgroundColor: Colors.surfaceAlt, 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    paddingHorizontal: Spacing.md, 
    paddingTop: 8 },
  payBtn: { 
    backgroundColor: Colors.primary, 
    borderRadius: BorderRadius.md, 
    paddingVertical: 16, 
    alignItems: 'center', 
    marginTop: Spacing.xl },
  payBtnDisabled: { 
    opacity: 0.6 },
  payBtnText: { 
    color: '#fff', 
    fontSize: FontSize.lg, 
    fontWeight: '900', 
    letterSpacing: 1 },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  processingText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '700',
  },
});

export default PaymentScreen;