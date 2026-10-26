import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAppAlert } from '../components/AppAlert';

export default function FinalizarPedido({ route, navigation }) {
  const Alert = useAppAlert();
  // Recibimos los datos enviados desde el Carrito
  const { productosCarrito = [], costoEnvio = 50 } = route.params || {};
  const subtotal = productosCarrito.reduce(
    (total, item) => total + Number(item.precio) * Number(item.cantidad),
    0
  );
  const totalPagar = subtotal + Number(costoEnvio);

  const [direccionesGuardadas, setDireccionesGuardadas] = useState([]);
  const [cargandoDirecciones, setCargandoDirecciones] = useState(true);
  const [mostrarDirecciones, setMostrarDirecciones] = useState(false);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [barrio, setBarrio] = useState('');
  const [direccion, setDireccion] = useState('');
  
  const [numeroTarjeta, setNumeroTarjeta] = useState('.... .... .... 4519');
  const [vencimiento, setVencimiento] = useState('12/28');
  const [cvv, setCvv] = useState('***');
  const [guardandoPedido, setGuardandoPedido] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarDirecciones = async () => {
      try {
        const usuario = auth.currentUser;
        if (!usuario) {
          throw new Error('No hay un usuario autenticado para cargar las direcciones.');
        }

        const usuarioSnapshot = await getDoc(doc(db, 'usuario', usuario.uid));
        if (!usuarioSnapshot.exists()) {
          throw new Error('No se encontró el perfil del usuario.');
        }

        const direcciones = usuarioSnapshot.data().direcciones || {};
        if (activo) {
          setDireccionesGuardadas(
            Object.entries(direcciones).map(([id, datos]) => ({ id, ...datos }))
          );
        }
      } catch (error) {
        console.error('Error al cargar direcciones para el pedido: ', error);
        if (activo) {
          Alert.alert('Error', 'No se pudieron cargar las direcciones guardadas.');
        }
      } finally {
        if (activo) setCargandoDirecciones(false);
      }
    };

    cargarDirecciones();
    return () => {
      activo = false;
    };
  }, []);

  const seleccionarDireccion = (direccionGuardada) => {
    setDireccionSeleccionada(direccionGuardada.id);
    setDepartamento(direccionGuardada.departamento || '');
    setMunicipio(direccionGuardada.Municipio || direccionGuardada.municipio || '');
    setBarrio(direccionGuardada.barrio || '');
    setDireccion(direccionGuardada.direccion || '');
    setMostrarDirecciones(false);
  };

  const handleConfirmarPedido = async () => {
    if (guardandoPedido) return;
    if (!auth.currentUser) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para registrar tu pedido.');
      return;
    }
    if (productosCarrito.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un producto antes de confirmar el pedido.');
      return;
    }
    if (![departamento, municipio, barrio, direccion].every((valor) => valor.trim())) {
      Alert.alert('Dirección incompleta', 'Completa todos los campos de la dirección de entrega.');
      return;
    }

    setGuardandoPedido(true);
    try {
      const usuario = auth.currentUser;
      const usuarioRef = doc(db, 'usuario', usuario.uid);
      const pedidoRef = doc(collection(db, 'pedidos'));
      const productosPedido = productosCarrito.map((producto) => ({
        id: String(producto.id),
        nombre: producto.nombre || 'Producto',
        imagen: producto.imagen || '',
        precio: Number(producto.precio) || 0,
        cantidad: Math.max(1, Math.floor(Number(producto.cantidad) || 1)),
      }));
      const cantidadesPorProducto = new Map();
      productosPedido.forEach((producto) => {
        cantidadesPorProducto.set(
          producto.id,
          (cantidadesPorProducto.get(producto.id) || 0) + producto.cantidad
        );
      });
      const productosAValidar = [...cantidadesPorProducto.entries()].map(([id, cantidad]) => ({
        id,
        cantidad,
        referencia: doc(db, 'productos', id),
      }));
      const pedido = {
        usuarioId: usuario.uid,
        correoUsuario: usuario.email || '',
        productos: productosPedido,
        subtotal,
        costoEnvio: Number(costoEnvio),
        total: totalPagar,
        direccion: {
          departamento: departamento.trim(),
          municipio: municipio.trim(),
          barrio: barrio.trim(),
          detalle: direccion.trim(),
        },
        estado: 'Pendiente',
        fecha: serverTimestamp(),
      };
      const productosCompradosIds = new Set(productosPedido.map((producto) => producto.id));

      await runTransaction(db, async (transaction) => {
        const usuarioSnapshot = await transaction.get(usuarioRef);
        if (!usuarioSnapshot.exists()) {
          throw new Error('No se encontró el perfil del usuario para guardar el pedido.');
        }

        const snapshotsProductos = await Promise.all(
          productosAValidar.map((producto) => transaction.get(producto.referencia))
        );
        snapshotsProductos.forEach((productoSnapshot, indice) => {
          const producto = productosAValidar[indice];
          const datosProducto = productoSnapshot.exists() ? productoSnapshot.data() : null;
          const stockActual = Math.max(0, Math.floor(Number(datosProducto?.stock) || 0));

          if (!datosProducto || stockActual < producto.cantidad) {
            const errorStock = new Error(
              !datosProducto
                ? `${productosPedido.find((item) => item.id === producto.id)?.nombre || 'El producto'} ya no está disponible.`
                : stockActual === 0
                  ? `${productosPedido.find((item) => item.id === producto.id)?.nombre || 'El producto'} está agotado.`
                  : `Solo quedan ${stockActual} unidades de ${productosPedido.find((item) => item.id === producto.id)?.nombre || 'este producto'}.`
            );
            errorStock.code = 'stock-insuficiente';
            throw errorStock;
          }
        });

        const carritoActual = usuarioSnapshot.data().carrito || {};
        const carritoRestante = Object.fromEntries(
          Object.entries(carritoActual).filter(([id]) => !productosCompradosIds.has(id))
        );

        snapshotsProductos.forEach((productoSnapshot, indice) => {
          const producto = productosAValidar[indice];
          const stockActual = Math.max(0, Math.floor(Number(productoSnapshot.data().stock) || 0));
          transaction.update(producto.referencia, {
            stock: stockActual - producto.cantidad,
          });
        });
        transaction.set(pedidoRef, pedido);
        transaction.update(usuarioRef, { carrito: carritoRestante });
      });

      Alert.alert('¡Pedido Exitoso!', 'Tu pedido quedó registrado correctamente.', [
        {
          text: 'Ver mis pedidos',
          onPress: () => navigation.navigate('HomeTabs', { screen: 'PedidosTab' }),
        },
      ]);
    } catch (error) {
      console.error('Error al registrar el pedido: ', error);
      if (error.code === 'stock-insuficiente') {
        Alert.alert('Stock no disponible', error.message);
      } else {
        Alert.alert('Error', 'No se pudo registrar el pedido. Inténtalo de nuevo.');
      }
    } finally {
      setGuardandoPedido(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SECCIÓN: DIRECCIÓN DE ENTREGA */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color="#0B2E59" />
            <Text style={styles.cardTitle}>Dirección de Entrega</Text>
          </View>

          <Text style={styles.label}>Direcciones guardadas en tu perfil</Text>
          <TouchableOpacity
            style={styles.selectorDireccion}
            onPress={() => setMostrarDirecciones(!mostrarDirecciones)}
            disabled={cargandoDirecciones || direccionesGuardadas.length === 0}
          >
            {cargandoDirecciones ? (
              <ActivityIndicator size="small" color="#0B2E59" />
            ) : (
              <>
                <Text style={styles.selectorDireccionTexto}>
                  {direccionesGuardadas.length === 0
                    ? 'No tienes direcciones guardadas'
                    : direccionSeleccionada
                      ? 'Cambiar dirección guardada'
                      : 'Elegir una dirección guardada'}
                </Text>
                <Ionicons
                  name={mostrarDirecciones ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#FFF"
                />
              </>
            )}
          </TouchableOpacity>

          {mostrarDirecciones && (
            <View style={styles.listaDirecciones}>
              {direccionesGuardadas.map((direccionGuardada) => {
                const municipioGuardado = direccionGuardada.Municipio || direccionGuardada.municipio || '';
                const seleccionada = direccionSeleccionada === direccionGuardada.id;
                return (
                  <TouchableOpacity
                    key={direccionGuardada.id}
                    style={[styles.opcionDireccion, seleccionada && styles.opcionDireccionSeleccionada]}
                    onPress={() => seleccionarDireccion(direccionGuardada)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: seleccionada }}
                  >
                    <View style={styles.opcionDireccionTexto}>
                      <Text style={[
                        styles.opcionDireccionPrincipal,
                        seleccionada && styles.opcionDireccionTextoSeleccionada,
                      ]}>
                        {direccionGuardada.direccion || 'Dirección sin detalle'}
                      </Text>
                      <Text style={[
                        styles.opcionDireccionSecundaria,
                        seleccionada && styles.opcionDireccionTextoSeleccionada,
                      ]}>
                        {[direccionGuardada.barrio, municipioGuardado, direccionGuardada.departamento]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    </View>
                    <Ionicons
                      name={seleccionada ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={seleccionada ? '#0B2E59' : '#999'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.rowInputs}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Departamento</Text>
              <TextInput style={styles.input} value={departamento} onChangeText={setDepartamento} />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Municipio</Text>
              <TextInput style={styles.input} value={municipio} onChangeText={setMunicipio} />
            </View>
          </View>

          <Text style={styles.label}>Barrio / Reparto</Text>
          <TextInput style={styles.input} value={barrio} onChangeText={setBarrio} />

          <Text style={styles.label}>Dirección Detallada</Text>
          <TextInput 
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]} 
            multiline 
            value={direccion} 
            onChangeText={setDireccion} 
          />
        </View>

        {/* SECCIÓN: MÉTODO DE PAGO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color="#0B2E59" />
            <Text style={styles.cardTitle}>Método de Pago (Tarjeta)</Text>
          </View>

          <Text style={styles.label}>Número de Tarjeta</Text>
          <TextInput style={styles.input} value={numeroTarjeta} onChangeText={setNumeroTarjeta} keyboardType="numeric" />

          <View style={styles.rowInputs}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Vencimiento</Text>
              <TextInput style={styles.input} value={vencimiento} onChangeText={setVencimiento} />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>CVV</Text>
              <TextInput style={styles.input} value={cvv} onChangeText={setCvv} secureTextEntry keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* SECCIÓN: RESUMEN DEL PEDIDO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del Pedido</Text>
          
          {/* Listamos los productos reales que traemos del carrito */}
          {productosCarrito.map((item, index) => (
            <View key={index} style={styles.resumenFila}>
              <Text style={styles.resumenTextoItem} numberOfLines={1}>
                {item.nombre} ({item.cantidad}x)
              </Text>
              <Text style={styles.resumenValorItem}>
                C$ {(Number(item.precio) * item.cantidad).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[styles.resumenFila, { borderTopWidth: 1, borderTopColor: '#EEE', marginTop: 8, paddingTop: 8 }]}>
            <Text style={styles.totalFinalLabel}>Subtotal:</Text>
            <Text style={styles.resumenValorItem}>C$ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenTextoItem}>Costo de envío:</Text>
            <Text style={styles.resumenValorItem}>C$ {Number(costoEnvio).toFixed(2)}</Text>
          </View>
          <View style={[styles.resumenFila, { borderTopWidth: 1, borderTopColor: '#EEE', marginTop: 8, paddingTop: 8 }]}>
            <Text style={styles.totalFinalLabel}>Total Final:</Text>
            <Text style={styles.totalFinalValor}>C$ {totalPagar.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* BOTÓN INFERIOR DE CONFIRMACIÓN */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.botonConfirmar}
          onPress={handleConfirmarPedido}
          disabled={guardandoPedido}
        >
          {guardandoPedido ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.textoBotonConfirmar}>Confirmar Pedido (C$ {totalPagar.toFixed(2)})</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { marginRight: 10 },
  botonConfirmar: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 14,
  },
  card: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  container: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  footerContainer: {
    backgroundColor: '#FFF',
    borderTopColor: '#EEE',
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderColor: '#DDD',
    borderRadius: 8,
    borderWidth: 1,
    color: '#333',
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputHalf: {
    flex: 1,
    marginRight: 8,
  },
  selectorDireccion: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderColor: '#0B2E59',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  selectorDireccionTexto: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listaDirecciones: {
    marginBottom: 12,
  },
  opcionDireccion: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#0B2E59',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 10,
  },
  opcionDireccionSeleccionada: {
    borderColor: '#0B2E59',
    backgroundColor: '#0B2E59',
  },
  opcionDireccionTexto: {
    flex: 1,
    marginRight: 8,
  },
  opcionDireccionPrincipal: {
    color: '#0B2E59',
    fontSize: 13,
    fontWeight: '600',
  },
  opcionDireccionSecundaria: {
    color: '#666',
    fontSize: 12,
    marginTop: 3,
  },
  opcionDireccionTextoSeleccionada: {
    color: '#FFF',
  },
  label: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  resumenTextoItem: {
    color: '#555',
    flex: 1,
    fontSize: 14,
  },
  resumenValorItem: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  textoBotonConfirmar: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalFinalLabel: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalFinalValor: {
    color: '#0B2E59',
    fontSize: 16,
    fontWeight: 'bold',
  },
});