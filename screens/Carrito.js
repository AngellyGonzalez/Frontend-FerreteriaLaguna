import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Carrito({ route, navigation }) {
  const [carrito, setCarrito] = useState([]);

useEffect(() => {
    if (route.params?.productoAgregado) {
      const nuevoProd = route.params.productoAgregado;
      
      setCarrito(prevCarrito => {
        const index = prevCarrito.findIndex(item => item.id === nuevoProd.id);
        if (index !== -1) {
          const actualizado = [...prevCarrito];
          actualizado[index].cantidad += nuevoProd.cantidad;
          return actualizado;
        } else {
          return [...prevCarrito, nuevoProd];
        }
      });
    }
  }, [route.params?.productoAgregado])

  const incrementarCantidad = (id) => {
    setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item));
  };

  const decrementarCantidad = (id) => {
    setCarrito(carrito.map(item => item.id === id && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item));
  };

  const eliminarProducto = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const subtotal = carrito.reduce((acc, item) => acc + (Number(item.precio) * item.cantidad), 0);
  const costoEnvio = 0;
  const totalNeto = subtotal + costoEnvio;

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito ({carrito.length})</Text>
        <TouchableOpacity onPress={() => setCarrito([])}>
          <Ionicons name="trash-outline" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>

      {carrito.length === 0 ? (
        <View style={styles.vacioContainer}>
          <Ionicons name="cart-outline" size={80} color="#CCC" />
          <Text style={styles.vacioTexto}>Tu carrito está vacío</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={carrito}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listaContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
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
                      <TouchableOpacity onPress={() => decrementarCantidad(item.id)} style={styles.btnContador}>
                        <Text style={styles.btnContadorTexto}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.cantidadTexto}>{item.cantidad}</Text>
                      <TouchableOpacity onPress={() => incrementarCantidad(item.id)} style={styles.btnContador}>
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
              <Text style={[styles.textoResumenValor, { color: '#2E7D32', fontWeight: 'bold' }]}>Gratis</Text>
            </View>
            <View style={[styles.filaResumen, styles.totalNetoFila]}>
              <Text style={styles.totalNetoLabel}>Total Neto</Text>
              <Text style={styles.totalNetoValor}>C$ {totalNeto.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.botonPagar} onPress={() => alert('¡Proceso de pago iniciado!')}>
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
    marginRight: 12,
    borderRadius: 8,
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