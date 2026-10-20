import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, onSnapshot, runTransaction, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const migrarCarritoAnterior = async (usuarioRef, usuarioId) => {
  const carritoAnteriorRef = collection(db, 'usuario', usuarioId, 'carrito');
  const snapshotAnterior = await getDocs(carritoAnteriorRef);
  if (snapshotAnterior.empty) return;

  await runTransaction(db, async (transaction) => {
    const usuarioSnapshot = await transaction.get(usuarioRef);
    if (!usuarioSnapshot.exists()) {
      throw new Error('No existe el documento del usuario para migrar su carrito.');
    }

    const carritoActual = usuarioSnapshot.data().carrito || {};
    const carritoMigrado = { ...carritoActual };
    snapshotAnterior.docs.forEach((productoDoc) => {
      if (!carritoMigrado[productoDoc.id]) {
        carritoMigrado[productoDoc.id] = productoDoc.data();
      }
    });
    transaction.update(usuarioRef, { carrito: carritoMigrado });
  });

  for (let inicio = 0; inicio < snapshotAnterior.docs.length; inicio += 500) {
    const lote = writeBatch(db);
    snapshotAnterior.docs.slice(inicio, inicio + 500).forEach((productoDoc) => {
      lote.delete(productoDoc.ref);
    });
    await lote.commit();
  }
};

export default function Carrito({ route, navigation }) {
  const [carrito, setCarrito] = useState([]);
  const [productosNoSeleccionados, setProductosNoSeleccionados] = useState(new Set());
  const [usuarioId, setUsuarioId] = useState(auth.currentUser?.uid || null);
  const [sesionVerificada, setSesionVerificada] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUsuarioId(user?.uid || null);
      setSesionVerificada(true);
    });
  }, []);

  useEffect(() => {
    setProductosNoSeleccionados(new Set());
  }, [usuarioId]);

  useEffect(() => {
    if (!sesionVerificada) return undefined;

    if (!usuarioId) {
      setCarrito([]);
      setProductosNoSeleccionados(new Set());
      setCargando(false);
      return undefined;
    }

    setCargando(true);
    const usuarioRef = doc(db, 'usuario', usuarioId);
    let activo = true;
    let cancelarEscucha = () => {};

    migrarCarritoAnterior(usuarioRef, usuarioId)
      .then(() => {
        if (!activo) return;
        cancelarEscucha = onSnapshot(usuarioRef, (usuarioSnapshot) => {
          const carritoGuardado = usuarioSnapshot.data()?.carrito || {};
          const productos = Object.entries(carritoGuardado).map(([id, producto]) => ({
            ...producto,
            id,
          }));
          const idsDisponibles = new Set(productos.map((producto) => producto.id));
          setCarrito(productos);
          setProductosNoSeleccionados((actuales) => (
            new Set([...actuales].filter((id) => idsDisponibles.has(id)))
          ));
          setCargando(false);
        }, (error) => {
          console.error('Error al cargar el carrito: ', error);
          Alert.alert('Error', 'No se pudo cargar tu carrito.');
          setCargando(false);
        });
      })
      .catch((error) => {
        if (!activo) return;
        console.error('Error al migrar el carrito: ', error);
        Alert.alert('Error', 'No se pudo cargar o migrar tu carrito.');
        setCargando(false);
      });

    return () => {
      activo = false;
      cancelarEscucha();
    };
  }, [sesionVerificada, usuarioId]);

  useEffect(() => {
    const nuevoProducto = route.params?.productoAgregado;
    if (!nuevoProducto || (!usuarioId && !sesionVerificada)) return;

    navigation.setParams({ productoAgregado: undefined, keyTimestamp: undefined });
    if (!usuarioId) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para agregar productos al carrito.');
      return;
    }

    const agregarProducto = async () => {
      try {
        const usuarioRef = doc(db, 'usuario', usuarioId);
        const productoId = String(nuevoProducto.id);
        const cantidadAAgregar = Number(nuevoProducto.cantidad) || 1;

        await runTransaction(db, async (transaction) => {
          const usuarioSnapshot = await transaction.get(usuarioRef);
          if (!usuarioSnapshot.exists()) {
            throw new Error('No existe el documento del usuario para guardar el carrito.');
          }

          const carritoActual = usuarioSnapshot.data().carrito || {};
          const productoActual = carritoActual[productoId];
          transaction.update(usuarioRef, {
            carrito: {
              ...carritoActual,
              [productoId]: {
                ...nuevoProducto,
                cantidad: (Number(productoActual?.cantidad) || 0) + cantidadAAgregar,
              },
            },
          });
        });
        setProductosNoSeleccionados((actuales) => {
          const siguiente = new Set(actuales);
          siguiente.delete(productoId);
          return siguiente;
        });
      } catch (error) {
        console.error('Error al agregar producto al carrito: ', error);
        Alert.alert('Error', 'No se pudo agregar el producto al carrito.');
      }
    };

    agregarProducto();
  }, [navigation, route.params?.productoAgregado, sesionVerificada, usuarioId]);

  const actualizarCantidad = async (id, cambio) => {
    if (!usuarioId) return;
    try {
      const usuarioRef = doc(db, 'usuario', usuarioId);
      await runTransaction(db, async (transaction) => {
        const usuarioSnapshot = await transaction.get(usuarioRef);
        if (!usuarioSnapshot.exists()) return;

        const carritoActual = usuarioSnapshot.data().carrito || {};
        const productoActual = carritoActual[id];
        if (!productoActual) return;

        transaction.update(usuarioRef, {
          carrito: {
            ...carritoActual,
            [id]: {
              ...productoActual,
              cantidad: Math.max(1, (Number(productoActual.cantidad) || 1) + cambio),
            },
          },
        });
      });
    } catch (error) {
      console.error('Error al actualizar cantidad del carrito: ', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad.');
    }
  };

  const eliminarProducto = async (id) => {
    if (!usuarioId) return;
    try {
      const usuarioRef = doc(db, 'usuario', usuarioId);
      await runTransaction(db, async (transaction) => {
        const usuarioSnapshot = await transaction.get(usuarioRef);
        if (!usuarioSnapshot.exists()) return;

        const carritoActual = usuarioSnapshot.data().carrito || {};
        if (!carritoActual[id]) return;

        const carritoActualizado = { ...carritoActual };
        delete carritoActualizado[id];
        transaction.update(usuarioRef, { carrito: carritoActualizado });
      });
    } catch (error) {
      console.error('Error al eliminar producto del carrito: ', error);
      Alert.alert('Error', 'No se pudo eliminar el producto del carrito.');
    }
  };

  const vaciarCarrito = () => {
    Alert.alert('Vaciar carrito', '¿Quieres eliminar todos los productos del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Vaciar',
        style: 'destructive',
        onPress: async () => {
          try {
            const usuarioRef = doc(db, 'usuario', usuarioId);
            await runTransaction(db, async (transaction) => {
              const usuarioSnapshot = await transaction.get(usuarioRef);
              if (usuarioSnapshot.exists()) {
                transaction.update(usuarioRef, { carrito: {} });
              }
            });
          } catch (error) {
            console.error('Error al vaciar el carrito: ', error);
            Alert.alert('Error', 'No se pudieron eliminar todos los productos.');
          }
        },
      },
    ]);
  };

  const alternarSeleccion = (id) => {
    setProductosNoSeleccionados((actuales) => {
      const siguiente = new Set(actuales);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  };

  const alternarSeleccionTodos = () => {
    setProductosNoSeleccionados((actuales) => (
      actuales.size === carrito.length
        ? new Set()
        : new Set(carrito.map((producto) => producto.id))
    ));
  };

  const productosSeleccionados = carrito.filter(
    (producto) => !productosNoSeleccionados.has(producto.id)
  );
  const subtotal = productosSeleccionados.reduce(
    (acc, item) => acc + (Number(item.precio) * Number(item.cantidad)),
    0
  );
  const costoEnvio = 50;
  const totalNeto = subtotal + costoEnvio;

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito ({carrito.length})</Text>
        <TouchableOpacity onPress={vaciarCarrito} disabled={carrito.length === 0}>
          <Ionicons name="trash-outline" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.vacioContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : !usuarioId ? (
        <View style={styles.vacioContainer}>
          <Ionicons name="person-circle-outline" size={70} color="#CCC" />
          <Text style={styles.vacioTexto}>Inicia sesión para ver tu carrito</Text>
        </View>
      ) : carrito.length === 0 ? (
        <View style={styles.vacioContainer}>
          <Ionicons name="cart-outline" size={80} color="#CCC" />
          <Text style={styles.vacioTexto}>Tu carrito está vacío</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.seleccionarTodo} onPress={alternarSeleccionTodos}>
            <Ionicons
              name={productosNoSeleccionados.size === 0 ? 'checkbox' : 'square-outline'}
              size={22}
              color="#1E88E5"
            />
            <Text style={styles.seleccionarTodoTexto}>
              {productosNoSeleccionados.size === 0 ? 'Quitar selección' : 'Seleccionar todos'}
            </Text>
            <Text style={styles.seleccionConteo}>
              {productosSeleccionados.length} de {carrito.length}
            </Text>
          </TouchableOpacity>
          <FlatList
            data={carrito}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listaContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => alternarSeleccion(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !productosNoSeleccionados.has(item.id) }}
                  accessibilityLabel={`Seleccionar ${item.nombre}`}
                >
                  <Ionicons
                    name={productosNoSeleccionados.has(item.id) ? 'square-outline' : 'checkbox'}
                    size={22}
                    color="#1E88E5"
                  />
                </TouchableOpacity>
                <Image source={{ uri: item.imagen }} style={styles.image} resizeMode="contain" />

                <View style={styles.infoContainer}>
                  <View style={styles.rowTop}>
                    <Text style={styles.nombreProducto} numberOfLines={2}>{item.nombre}</Text>
                    <TouchableOpacity onPress={() => eliminarProducto(item.id)}>
                      <Ionicons name="trash-bin-outline" size={18} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.precioUnitario}>C$ {Number(item.precio).toFixed(2)}</Text>

                  <View style={styles.rowBottom}>
                    <Text style={styles.subtotalTexto}>
                      Subtotal: <Text style={styles.subtotalValor}>C$ {(item.precio * item.cantidad).toFixed(2)}</Text>
                    </Text>

                    <View style={styles.contadorContainer}>
                      <TouchableOpacity onPress={() => actualizarCantidad(item.id, -1)} style={styles.btnContador}>
                        <Text style={styles.btnContadorTexto}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.cantidadTexto}>{item.cantidad}</Text>
                      <TouchableOpacity onPress={() => actualizarCantidad(item.id, 1)} style={styles.btnContador}>
                        <Text style={styles.btnContadorTexto}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Resumen de Compra ordenado abajo */}
          <View style={styles.footerResumen}>
            <View style={styles.filaResumen}>
              <Text style={styles.textoResumenLabel}>Subtotal</Text>
              <Text style={styles.textoResumenValor}>C$ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.filaResumen}>
              <Text style={styles.textoResumenLabel}>Costo de Envío</Text>
              <Text style={styles.textoResumenValor}>C$ {costoEnvio.toFixed(2)}</Text>
            </View>
            <View style={[styles.filaResumen, styles.totalNetoFila]}>
              <Text style={styles.totalNetoLabel}>Total Neto</Text>
              <Text style={styles.totalNetoValor}>C$ {totalNeto.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.botonPagar}
              onPress={() => {
                if (productosSeleccionados.length === 0) {
                  Alert.alert('Selecciona productos', 'Selecciona al menos un producto para continuar.');
                  return;
                }
                navigation.navigate('FinalizarPedido', {
                  productosCarrito: productosSeleccionados,
                  totalPagar: totalNeto,
                  costoEnvio
                });
              }}
            >
              <Ionicons name="card-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.textoBotonPagar}>Proceder al Pago</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vacioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vacioTexto: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  listaContainer: {
    padding: 16,
  },
  seleccionarTodo: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  seleccionarTodoTexto: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  seleccionConteo: {
    color: '#777',
    fontSize: 12,
    marginLeft: 'auto',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 70,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  checkbox: {
    padding: 2,
  },
  infoContainer: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nombreProducto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  precioUnitario: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subtotalTexto: {
    fontSize: 12,
    color: '#666',
  },
  subtotalValor: {
    fontWeight: 'bold',
    color: '#333',
  },
  contadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    overflow: 'hidden',
  },
  btnContador: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F1F3F5',
  },
  btnContadorTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cantidadTexto: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerResumen: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  textoResumenLabel: {
    fontSize: 14,
    color: '#666',
  },
  textoResumenValor: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalNetoFila: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  totalNetoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalNetoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  botonPagar: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  textoBotonPagar: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});