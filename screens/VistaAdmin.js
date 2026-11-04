import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAppAlert } from '../components/AppAlert';
import EncabezadoAdmin from '../components/EncabezadoAdmin';
import Categoria from '../components/Categoria';

export default function VistaAdmin({ navigation }) {
  const Alert = useAppAlert();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'productos'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        idDoc: doc.id,
        ...doc.data()
      }));
      setProductos(lista);
    }, (error) => {
      console.error('Error al cargar productos de administración:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos.');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categorias'), (snapshot) => {
      setCategorias(snapshot.docs.map((categoriaDoc) => ({
        id: categoriaDoc.id,
        ...categoriaDoc.data(),
      })));
    }, (error) => {
      console.error('Error al cargar categorías de productos:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías.');
    });

    return () => unsubscribe();
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const termino = busqueda.trim().toLocaleLowerCase();
    const coincideBusqueda = !termino || [
      producto.nombre,
      producto.Nombre,
      producto.descripcion,
      producto.Descripcion,
    ].some((campo) => String(campo || '').toLocaleLowerCase().includes(termino));
    const coincideCategoria = categoriaSeleccionada === 'todos'
      || String(producto.categoria_id) === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

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
        <EncabezadoAdmin
          titulo="Productos"
          subtitulo="Administra el inventario de la tienda"
        />
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.idDoc}
          ListHeaderComponent={(
            <View>
              <TouchableOpacity
                style={styles.botonAgregar}
                onPress={() => navigation.navigate('nuevoProducto')}
              >
                <Text style={styles.textoBotonAgregar}>+ Agregar producto</Text>
              </TouchableOpacity>

              <View style={styles.buscador}>
                <Ionicons name="search-outline" size={18} color="#0B2E59" />
                <TextInput
                  placeholder="Buscar por nombre o descripción..."
                  placeholderTextColor="#A0A0A0"
                  style={styles.inputBusqueda}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  returnKeyType="search"
                  accessibilityLabel="Buscar productos"
                />
                {busqueda.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setBusqueda('')}
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar búsqueda"
                  >
                    <Ionicons name="close-circle" size={19} color="#7A8A9D" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.etiquetaCategoria}>Filtrar por categoría</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listaCategorias}
              >
                <Categoria
                  nombre="Todos"
                  activa={categoriaSeleccionada === 'todos'}
                  onPress={() => setCategoriaSeleccionada('todos')}
                />
                {categorias.map((categoria) => {
                  const idCategoria = String(categoria.id_categoria ?? categoria.id);
                  return (
                    <Categoria
                      key={categoria.id}
                      nombre={categoria.nombre_categoria || categoria.nombre || `Categoría ${idCategoria}`}
                      activa={categoriaSeleccionada === idCategoria}
                      onPress={() => setCategoriaSeleccionada(idCategoria)}
                    />
                  );
                })}
              </ScrollView>
              <Text style={styles.conteoProductos}>
                {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
              </Text>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.sinResultados}>
              <Ionicons name="search-outline" size={32} color="#99A2AE" />
              <Text style={styles.textoSinResultados}>
                {productos.length
                  ? 'No hay productos que coincidan con los filtros.'
                  : 'Aún no hay productos registrados.'}
              </Text>
            </View>
          )}
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
                  <Text style={styles.nombre} numberOfLines={2}>
                    {item.nombre || item.Nombre || 'Producto'}
                  </Text>
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
                    accessibilityLabel={`Editar ${item.nombre || item.Nombre || 'producto'}`}
                  >
                    <Ionicons name="pencil" size={18} color="#FFF" />
                  </TouchableOpacity>

                  {/* Botón Eliminar */}
                  <TouchableOpacity
                    style={styles.btnIcono}
                    onPress={() => eliminarProducto(item.idDoc, item.nombre || item.Nombre)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.nombre || item.Nombre || 'producto'}`}
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
    padding: 18,
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
  buscador: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputBusqueda: {
    color: '#333333',
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    padding: 0,
  },
  etiquetaCategoria: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
  },
  listaCategorias: {
    paddingBottom: 10,
  },
  conteoProductos: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 10,
  },
  sinResultados: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    padding: 24,
  },
  textoSinResultados: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
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