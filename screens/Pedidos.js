import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Pedidos() { 
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Pantalla de Pedidos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texto: { fontSize: 20, fontWeight: 'bold' }
});