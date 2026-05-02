import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Dimensions, Animated } from 'react-native';
import { Colors, Fonts } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const slideAnim = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(1000), // stop a while
      Animated.timing(slideAnim, {
        toValue: SCREEN_W, // slide out to the right
        duration: 800,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
  }, [onFinish, slideAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        <Image
          source={require('../assets/icons/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>BHUB Bouldering</Text>
        <Text style={styles.subtitle}>Indoor Bouldering Gym</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.koho,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.keaniaOne,
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default SplashScreen;

