import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Categoria({ nombre, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.texto}>{nombre}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B2E59',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#0B2E59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});