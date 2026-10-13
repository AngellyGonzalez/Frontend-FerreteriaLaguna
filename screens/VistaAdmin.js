import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function VistaAdmin({ navigation }) {
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.infoContainer}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.precio}>C$ {item.precio}</Text>
              <Text style={styles.detalle}>Stock: {item.stock || 0}</Text>
              <Text style={styles.detalle}>Descripción: {item.descripcion || 'Sin descripción'}</Text>
            </View>

            <View style={styles.accionesContainer}>
              {/* Botón Editar */}
              <TouchableOpacity 
                style={styles.btnIcono}
                onPress={() => navigation.navigate('nuevoProducto', { producto: item })}
              >
                <Ionicons name="pencil" size={18} color="#0B2E59" />
              </TouchableOpacity>

              {/* Botón Eliminar */}
              <TouchableOpacity 
                style={styles.btnIcono}
                onPress={() => eliminarProducto(item.idDoc, item.nombre)}
              >
                <Ionicons name="trash" size={18} color="#E63946" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#EAF2FB',
    marginTop: 10,
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
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E1E1E8',
    elevation: 2, 
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
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
    color: '#1E88E5', 
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
    backgroundColor: '#F1F2F6', 
    padding: 10, 
    borderRadius: 25,
    elevation: 1,
  }
});