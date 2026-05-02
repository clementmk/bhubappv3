import React from 'react';
import Svg, { Path, G, Circle } from 'react-native-svg';

export const HomeIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="44" height="44" viewBox="0 0 44 44">
    {focused && <Circle cx="22" cy="22" r="22" fill="rgba(255, 255, 255, 0.3)" />}
    <G x="10" y="10">
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="#FFFFFF" />
    </G>
  </Svg>
);

export const BookmarkIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="44" height="44" viewBox="0 0 44 44">
    {focused && <Circle cx="22" cy="22" r="22" fill="rgba(255, 255, 255, 0.3)" />}
    <G x="10" y="10">
      <Path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="#FFFFFF" />
    </G>
  </Svg>
);

export const PlayIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="44" height="44" viewBox="0 0 44 44">
    {focused && <Circle cx="22" cy="22" r="22" fill="rgba(255, 255, 255, 0.3)" />}
    <G x="10" y="10">
      <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
    </G>
  </Svg>
);

export const PersonIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="44" height="44" viewBox="0 0 44 44">
    {focused && <Circle cx="22" cy="22" r="22" fill="rgba(255, 255, 255, 0.3)" />}
    <G x="10" y="10">
      <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#FFFFFF" />
    </G>
  </Svg>
);
