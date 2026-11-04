import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function LogoMarca({ size = 42 }) {
  return (
    <Image
      source={require('../assets/logo (3).png')}
      style={[styles.logo, { height: size, width: size }]}
      resizeMode="contain"
      accessibilityLabel="Logo de Ferretería Laguna"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    marginHorizontal: 4,
  },
});
