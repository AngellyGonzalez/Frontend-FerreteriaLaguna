import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function Producto({ nombre, precio, categoria, imagen }) {
  return (
    <View>
      <Image 
        source={{ uri: imagen }} 
        style={styles.image} 
        resizeMode="contain" 
      />
      <Text style={styles.stock}>{categoria}</Text>
      <Text style={styles.name} numberOfLines={2}>{nombre}</Text>
      <Text style={styles.price}>{precio}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 120,
    marginBottom: 8,
  },
  stock: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
});