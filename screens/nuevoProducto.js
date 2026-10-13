import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { db } from '../firebase/config'; 
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

export default function FormularioProductoScreen({ route, navigation }) {
  const productoEditando = route.params?.producto;

  const [categoriaId, setCategoriaId] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [imagen, setImagen] = useState('');

  useEffect(() => {
    if (productoEditando) {
      setCategoriaId(productoEditando.categoria_id ? productoEditando.categoria_id.toString() : '');
      setNombre(productoEditando.nombre || '');
      setPrecio(productoEditando.precio ? productoEditando.precio.toString() : '');
      setStock(productoEditando.stock ? productoEditando.stock.toString() : '');
      setImagen(productoEditando.imagen || '');
    }
  }, [productoEditando]);

  const guardarOActualizarProducto = async () => {
    if (!nombre || !precio || !categoriaId) {
      Alert.alert('Error', 'Por favor completa al menos Categoría ID, Nombre y Precio.');
      return;
    }
    
    try {
      const datosProducto = {
        categoria_id: Number(categoriaId) || 0,
        nombre: nombre.trim(),
        precio: Number(precio) || 0,
        stock: Number(stock) || 0,
        imagen: imagen.trim(),
      };

      if (productoEditando) {
        const docRef = doc(db, 'productos', productoEditando.idDoc);
        await updateDoc(docRef, datosProducto);
        Alert.alert('Éxito', 'Producto actualizado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await addDoc(collection(db, 'productos'), datosProducto);
        Alert.alert('Éxito', 'Producto agregado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error("Error al guardar: ", error);
      Alert.alert('Error', 'No se pudo guardar el producto.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ID Categoría</Text>
      <TextInput style={styles.input} placeholder="Ej. 4" keyboardType="numeric" value={categoriaId} onChangeText={setCategoriaId} />

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} placeholder="Nombre del producto" value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Precio</Text>
      <TextInput style={styles.input} placeholder="Ej. 200" keyboardType="numeric" value={precio} onChangeText={setPrecio} />

      <Text style={styles.label}>Stock</Text>
      <TextInput style={styles.input} placeholder="Ej. 100" keyboardType="numeric" value={stock} onChangeText={setStock} />

      <Text style={styles.label}>Imagen (URL)</Text>
      <TextInput style={styles.input} placeholder="https://..." value={imagen} onChangeText={setImagen} autoCapitalize="none" />

      <TouchableOpacity style={styles.botonGuardar} onPress={guardarOActualizarProducto}>
        <Text style={styles.textoBoton}>
          {productoEditando ? 'ACTUALIZAR PRODUCTO' : 'GUARDAR PRODUCTO'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  label: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 4 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 10, 
    borderRadius: 8, 
    fontSize: 15, 
    marginBottom: 12, 
    backgroundColor: '#fafafa' 
  },
  botonGuardar: { 
    backgroundColor: '#0B2E59', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 40 
  },
  textoBoton: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});