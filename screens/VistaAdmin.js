import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAppAlert } from '../components/AppAlert';

export default function VistaAdmin({ navigation }) {
  const Alert = useAppAlert();
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'productos'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        idDoc: doc.id, 
        ...doc.data()
      }));
      setProductos(lista);
    });

    return () => unsubscribe();
  }, []);

  // Función para eliminar un producto 
  const eliminarProducto = (idDoc, nombreProducto) => {
    Alert.alert(
      "Eliminar producto",
      `¿Estás seguro de que deseas eliminar "${nombreProducto}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "productos", idDoc));
            } catch (error) {
              console.error("Error al eliminar el producto: ", error);
              Alert.alert("Error", "No se pudo eliminar el producto.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Botón para Agregar Producto */}
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => navigation.navigate('nuevoProducto')}
        >
          <Text style={styles.textoBotonAgregar}>+ Agregar producto</Text>
        </TouchableOpacity>

        <FlatList
          data={productos}
          keyExtractor={(item) => item.idDoc}
          renderItem={({ item }) => {
            const imagen = item.imagen || item.Imagen;
            return (
              <View style={styles.card}>
                {typeof imagen === 'string' && imagen.trim() ? (
                  <Image source={{ uri: imagen }} style={styles.imagenProducto} resizeMode="contain" />
                ) : (
                  <View style={[styles.imagenProducto, styles.sinImagen]}>
                    <Ionicons name="image-outline" size={24} color="#99A2AE" />
                  </View>
                )}

                <View style={styles.infoContainer}>
                  <Text style={styles.nombre} numberOfLines={2}>{item.nombre || 'Producto'}</Text>
                  <Text style={styles.precio}>C$ {item.precio}</Text>
                  <Text style={styles.detalle}>Stock: {item.stock || 0}</Text>
                  <Text style={styles.detalle} numberOfLines={2}>
                    Descripción: {item.descripcion || 'Sin descripción'}
                  </Text>
                </View>

                <View style={styles.accionesContainer}>
                  {/* Botón Editar */}
                  <TouchableOpacity
                    style={styles.btnIcono}
                    onPress={() => navigation.navigate('nuevoProducto', { producto: item })}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${item.nombre || 'producto'}`}
                  >
                    <Ionicons name="pencil" size={18} color="#FFF" />
                  </TouchableOpacity>

                  {/* Botón Eliminar */}
                  <TouchableOpacity
                    style={styles.btnIcono}
                    onPress={() => eliminarProducto(item.idDoc, item.nombre)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.nombre || 'producto'}`}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#EAF2FB',
    flex: 1,
  },
  container: { 
    flex: 1,
    padding: 16,
    backgroundColor: '#EAF2FB',
  },
  botonAgregar: { 
    backgroundColor: '#0B2E59', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 16,
    elevation: 2,
  },
  textoBotonAgregar: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 12,
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E1E1E8',
    elevation: 2, 
  },
  imagenProducto: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    height: 72,
    marginRight: 12,
    width: 72,
  },
  sinImagen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  nombre: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 4,
  },
  precio: { 
    fontSize: 15,
    fontWeight: '600',
    color: '#0B2E59',
    marginBottom: 4,
  },
  detalle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  accionesContainer: { 
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnIcono: { 
    backgroundColor: '#0B2E59',
    padding: 10, 
    borderRadius: 25,
    elevation: 1,
  }
});