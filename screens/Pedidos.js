import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAppAlert } from '../components/AppAlert';

const obtenerImagen = (producto) => (
  [producto?.imagen, producto?.Imagen]
    .find((imagen) => typeof imagen === 'string' && imagen.trim())
    ?.trim() || ''
);

const obtenerDireccion = (direccion) => {
  if (!direccion) return 'Dirección no disponible';
  if (typeof direccion === 'string') return direccion;

  return [
    direccion.detalle || direccion.direccion,
    direccion.barrio,
    direccion.municipio || direccion.Municipio,
    direccion.departamento,
  ].filter(Boolean).join(', ') || 'Dirección no disponible';
};

const obtenerFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  const fechaPedido = typeof fecha.toDate === 'function' ? fecha.toDate() : new Date(fecha);
  if (Number.isNaN(fechaPedido.getTime())) return 'Fecha no disponible';
  return fechaPedido.toLocaleDateString();
};

const obtenerEstiloEstado = (estado) => {
  const estadoNormalizado = String(estado || 'Pendiente').toLowerCase();
  if (estadoNormalizado.includes('camino')) return styles.estadoEnCamino;
  if (estadoNormalizado.includes('entregado') || estadoNormalizado.includes('recibido')) {
    return styles.estadoEntregado;
  }
  return styles.estadoPendiente;
};

export default function Pedidos() {
  const Alert = useAppAlert();
  const [pedidos, setPedidos] = useState([]);
  const [usuarioId, setUsuarioId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [pedidoActualizando, setPedidoActualizando] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (usuario) => {
    setUsuarioId(usuario?.uid || null);
  }), []);

  useEffect(() => {
    if (!usuarioId) {
      setPedidos([]);
      setCargando(false);
      return undefined;
    }

    setCargando(true);
    setError(false);
    const consultaPedidos = query(
      collection(db, 'pedidos'),
      where('usuarioId', '==', usuarioId)
    );
    let activo = true;
    let versionSnapshot = 0;
    const imagenesProductos = new Map();

    const unsubscribe = onSnapshot(consultaPedidos, async (snapshot) => {
      const versionActual = ++versionSnapshot;
      const pedidosUsuario = snapshot.docs
        .map((pedidoDoc) => ({ id: pedidoDoc.id, ...pedidoDoc.data() }))
        .sort((a, b) => {
          const fechaA = a.fecha?.toMillis?.() || 0;
          const fechaB = b.fecha?.toMillis?.() || 0;
          return fechaB - fechaA;
        });

      const idsProductosSinImagen = new Set(
        pedidosUsuario.flatMap((pedido) => (
          Array.isArray(pedido.productos) ? pedido.productos : []
        ))
          .filter((producto) => !obtenerImagen(producto) && producto.id)
          .map((producto) => String(producto.id))
      );
      await Promise.all([...idsProductosSinImagen].map(async (productoId) => {
        if (!imagenesProductos.has(productoId)) {
          imagenesProductos.set(productoId, getDoc(doc(db, 'productos', productoId))
            .then((productoSnapshot) => {
              const datos = productoSnapshot.exists() ? productoSnapshot.data() : {};
              return typeof (datos.imagen || datos.Imagen) === 'string'
                ? (datos.imagen || datos.Imagen).trim()
                : '';
            })
            .catch((imagenError) => {
              console.error(`Error al recuperar la imagen del producto ${productoId}:`, imagenError);
              return '';
            }));
        }
      }));

      const productosConImagen = await Promise.all(pedidosUsuario.map(async (pedido) => ({
        ...pedido,
        productos: await Promise.all(
          (Array.isArray(pedido.productos) ? pedido.productos : []).map(async (producto) => ({
            ...producto,
            imagen: obtenerImagen(producto)
              || (producto.id ? await imagenesProductos.get(String(producto.id)) : ''),
          }))
        ),
      })));

      if (!activo || versionActual !== versionSnapshot) return;
      setPedidos(productosConImagen);
      setCargando(false);
    }, (snapshotError) => {
      console.error('Error al cargar el historial de pedidos: ', snapshotError);
      setError(true);
      setCargando(false);
    });
    return () => {
      activo = false;
      unsubscribe();
    };
  }, [usuarioId]);

  const marcarPedido = async (pedido, confirmacion) => {
    setPedidoActualizando(pedido.id);
    try {
      const mensajeAdmin = confirmacion === 'Recibido'
        ? 'El cliente confirmó que recibió el pedido.'
        : 'El cliente indicó que aún está pendiente de recibir el pedido.';
      await updateDoc(doc(db, 'pedidos', pedido.id), {
        confirmacionCliente: confirmacion,
        mensajeAdmin,
      });
    } catch (updateError) {
      console.error('Error al actualizar confirmación del pedido: ', updateError);
      Alert.alert('Error', 'No se pudo enviar la confirmación del pedido.');
    } finally {
      setPedidoActualizando(null);
    }
  };

  if (cargando) {
    return (
      <View style={styles.estadoPantalla}>
        <ActivityIndicator size="large" color="#0B2E59" />
      </View>
    );
  }

  if (!usuarioId) {
    return (
      <View style={styles.estadoPantalla}>
        <Ionicons name="person-circle-outline" size={64} color="#B0B7C3" />
        <Text style={styles.textoVacio}>Inicia sesión para consultar tus pedidos.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoPantalla}>
        <Ionicons name="alert-circle-outline" size={56} color="#D32F2F" />
        <Text style={styles.textoVacio}>No se pudo cargar el historial de pedidos.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
      <View style={styles.encabezado}>
        <View>
          <Text style={styles.subtitulo}>Historial de tus compras</Text>
        </View>
        <View style={styles.contadorPedidos}>
          <Text style={styles.contadorTexto}>{pedidos.length}</Text>
        </View>
      </View>

      {pedidos.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Ionicons name="receipt-outline" size={64} color="#B0B7C3" />
          <Text style={styles.textoVacio}>Aún no tienes pedidos realizados.</Text>
          <Text style={styles.textoAyuda}>Cuando confirmes una compra, aparecerá aquí.</Text>
        </View>
      ) : (
        pedidos.map((pedido) => {
          const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
          const estadoVisible = pedido.confirmacionCliente === 'Recibido'
            ? 'Recibido'
            : pedido.estado || 'Pendiente';
          const cantidadTotal = productos.reduce(
            (total, producto) => total + (Number(producto.cantidad) || 0),
            0
          );

          return (
            <View key={pedido.id} style={styles.tarjetaPedido}>
              <View style={styles.filaEncabezadoPedido}>
                <View>
                  <Text style={styles.numeroPedido}>Pedido #{pedido.id.slice(0, 8)}</Text>
                  <Text style={styles.fechaPedido}>{obtenerFecha(pedido.fecha)}</Text>
                </View>
                <View style={[styles.estadoBadge, obtenerEstiloEstado(estadoVisible)]}>
                  <Text style={styles.estadoTexto}>{estadoVisible}</Text>
                </View>
              </View>

              <View style={styles.divisor} />

              {productos.map((producto, index) => (
                <View key={producto.id || `${pedido.id}-${index}`} style={styles.filaProducto}>
                  {producto.imagen ? (
                    <Image source={{ uri: producto.imagen }} style={styles.imagenProducto} resizeMode="contain" />
                  ) : (
                    <View style={[styles.imagenProducto, styles.imagenSinFoto]}>
                      <Ionicons name="image-outline" size={24} color="#AAB2BD" />
                    </View>
                  )}
                  <View style={styles.infoProducto}>
                    <Text style={styles.nombreProducto}>{producto.nombre || 'Producto'}</Text>
                    <Text style={styles.cantidadProducto}>
                      Cantidad: {Number(producto.cantidad) || 0}
                    </Text>
                  </View>
                  <Text style={styles.precioProducto}>
                    C$ {(Number(producto.precio) * Number(producto.cantidad)).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.direccionPedido}>
                <Ionicons name="location-outline" size={18} color="#0B2E59" />
                <Text style={styles.textoDireccion} numberOfLines={3}>
                  {obtenerDireccion(pedido.direccion)}
                </Text>
              </View>

              <View style={styles.divisor} />

              {pedido.mensajeCliente && (
                <View style={styles.mensajeEstado}>
                  <View style={styles.mensajeEstadoIcono}>
                    <Ionicons name="notifications-outline" size={18} color="#0B2E59" />
                  </View>
                  <View style={styles.mensajeEstadoContenido}>
                    <Text style={styles.mensajeEstadoTitulo}>Actualización del pedido</Text>
                    <Text style={styles.mensajeEstadoTexto}>{pedido.mensajeCliente}</Text>
                  </View>
                </View>
              )}

              <View style={styles.filaTotal}>
                <Text style={styles.cantidadTotal}>Total de productos: {cantidadTotal}</Text>
                <Text style={styles.totalPedido}>C$ {Number(pedido.total || 0).toFixed(2)}</Text>
              </View>

              <Text style={styles.confirmacionTitulo}>Confirmación de recepción</Text>
              <View style={styles.botonesConfirmacion}>
                {['Pendiente', 'Recibido'].map((confirmacion) => {
                  const seleccionado = pedido.confirmacionCliente === confirmacion;
                  return (
                    <TouchableOpacity
                      key={confirmacion}
                      style={[
                        styles.botonConfirmacion,
                        seleccionado && styles.botonConfirmacionActivo,
                      ]}
                      onPress={() => marcarPedido(pedido, confirmacion)}
                      disabled={pedidoActualizando === pedido.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionado, disabled: pedidoActualizando === pedido.id }}
                    >
                      {pedidoActualizando === pedido.id ? (
                        <ActivityIndicator size="small" color={seleccionado ? '#FFF' : '#0B2E59'} />
                      ) : (
                        <Text style={[
                          styles.botonConfirmacionTexto,
                          seleccionado && styles.botonConfirmacionTextoActivo,
                        ]}>
                          {confirmacion}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F6F9',
    flex: 1,
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  estadoPantalla: {
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  encabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subtitulo: {
    color: '#77808E',
    fontSize: 13,
    marginTop: 3,
  },
  contadorPedidos: {
    alignItems: 'center',
    backgroundColor: '#E7F1FC',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    minWidth: 36,
    paddingHorizontal: 8,
  },
  contadorTexto: {
    color: '#0B2E59',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tarjetaVacia: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginTop: 28,
    padding: 28,
  },
  textoVacio: {
    color: '#414B5A',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  textoAyuda: {
    color: '#818A98',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  tarjetaPedido: {
    backgroundColor: '#FFF',
    borderColor: '#E5E9EF',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    padding: 14,
  },
  filaEncabezadoPedido: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numeroPedido: {
    color: '#263445',
    fontSize: 15,
    fontWeight: 'bold',
  },
  fechaPedido: {
    color: '#818A98',
    fontSize: 12,
    marginTop: 4,
  },
  estadoBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  estadoPendiente: {
    backgroundColor: '#FFF4DF',
  },
  estadoEnCamino: {
    backgroundColor: '#E5F1FF',
  },
  estadoEntregado: {
    backgroundColor: '#E5F5E9',
  },
  estadoTexto: {
    color: '#6B4A0A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divisor: {
    backgroundColor: '#EEF0F3',
    height: 1,
    marginVertical: 12,
  },
  filaProducto: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  imagenProducto: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    height: 58,
    width: 58,
  },
  imagenSinFoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoProducto: {
    flex: 1,
    marginHorizontal: 10,
  },
  nombreProducto: {
    color: '#303A49',
    fontSize: 14,
    fontWeight: '600',
  },
  cantidadProducto: {
    color: '#7D8795',
    fontSize: 12,
    marginTop: 4,
  },
  precioProducto: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  direccionPedido: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  textoDireccion: {
    color: '#606B79',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 7,
  },
  filaTotal: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cantidadTotal: {
    color: '#6E7886',
    fontSize: 12,
  },
  totalPedido: {
    color: '#0B2E59',
    fontSize: 17,
    fontWeight: 'bold',
  },
  mensajeEstado: {
    alignItems: 'center',
    backgroundColor: '#F1F6FC',
    borderLeftColor: '#0B2E59',
    borderLeftWidth: 4,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  mensajeEstadoIcono: {
    alignItems: 'center',
    backgroundColor: '#E1EBF7',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  mensajeEstadoContenido: {
    flex: 1,
  },
  mensajeEstadoTitulo: {
    color: '#0B2E59',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  mensajeEstadoTexto: {
    color: '#52647A',
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  confirmacionTitulo: {
    color: '#495464',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
  },
  botonesConfirmacion: {
    flexDirection: 'row',
    marginTop: 8,
  },
  botonConfirmacion: {
    alignItems: 'center',
    borderColor: '#0B2E59',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  botonConfirmacionActivo: {
    backgroundColor: '#0B2E59',
  },
  botonConfirmacionTexto: {
    color: '#0B2E59',
    fontSize: 13,
    fontWeight: '600',
  },
  botonConfirmacionTextoActivo: {
    color: '#FFF',
  },
});
