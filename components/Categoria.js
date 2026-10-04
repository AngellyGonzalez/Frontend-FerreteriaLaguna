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
    backgroundColor: '#F5F4FC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E1E1E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});