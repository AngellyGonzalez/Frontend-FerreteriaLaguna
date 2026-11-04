import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Categoria({ nombre, onPress, activa = true }) {
  return (
    <TouchableOpacity
      style={[styles.container, !activa && styles.containerInactiva]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
    >
      <Text style={[styles.texto, !activa && styles.textoInactivo]}>{nombre}</Text>
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
  containerInactiva: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
  },
  texto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  textoInactivo: {
    color: '#0B2E59',
  },
});