import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { Colors, Shadow } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_MARGIN = 32;
const W = SCREEN_W - BAR_MARGIN * 2;
const H = 60;
const TAB_W = W / 4;
const SVG_W = W * 3;
const CX = SVG_W / 2;

const pathD = `
  M 0 0
  L ${CX - 40} 0
  C ${CX - 15} 0, ${CX - 20} 28, ${CX} 28
  C ${CX + 20} 28, ${CX + 15} 0, ${CX + 40} 0
  L ${SVG_W} 0
  L ${SVG_W} ${H}
  L 0 ${H}
  Z
`;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const animatedIndex = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.timing(animatedIndex, {
      toValue: state.index,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [state.index, animatedIndex]);

  const translateX = animatedIndex.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => (i + 0.5) * TAB_W - CX),
  });

  return (
    <View style={tabStyles.wrapper}>
      {/* Background with Notch */}
      <View style={[StyleSheet.absoluteFillObject, tabStyles.barContainer]}>
        <AnimatedSvg
          width={SVG_W}
          height={H}
          viewBox={`0 0 ${SVG_W} ${H}`}
          style={{ transform: [{ translateX }] }}
        >
          <Path d={pathD} fill={Colors.primary} />
        </AnimatedSvg>
      </View>

      {/* Tabs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <View style={tabStyles.tabsRow} pointerEvents="box-none">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const isActiveAnim = animatedIndex.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });

            const translateIconY = isActiveAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -18],
            });

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={tabStyles.tab}
                activeOpacity={1}
              >
                <Animated.View style={[tabStyles.iconBubble, { transform: [{ translateY: translateIconY }] }]}>
                  {options.tabBarIcon?.({ focused: isFocused, color: '', size: 24 })}
                </Animated.View>
                <Animated.View style={[tabStyles.dot, { opacity: isActiveAnim }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: BAR_MARGIN,
    right: BAR_MARGIN,
    height: H,
    ...Shadow.md,
  },
  barContainer: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default CustomTabBar;
