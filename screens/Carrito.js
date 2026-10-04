import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Carrito() { // (o Pedidos / Perfil según corresponda)
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Pantalla de Carrito</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texto: { fontSize: 20, fontWeight: 'bold' }
});