import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAppAlert } from '../components/AppAlert';
import EncabezadoAdmin from '../components/EncabezadoAdmin';

const ESTADOS_PEDIDO = ['Pendiente', 'En preparación', 'En camino', 'Entregado'];

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
  return Number.isNaN(fechaPedido.getTime()) ? 'Fecha no disponible' : fechaPedido.toLocaleString();
};

const estiloEstado = (estado) => {
  if (estado === 'En preparación') return styles.estadoPreparacion;
  if (estado === 'En camino') return styles.estadoCamino;
  if (estado === 'Entregado') return styles.estadoEntregado;
  return styles.estadoPendiente;
};

export default function AdminPedidos() {
  const Alert = useAppAlert();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    const pedidosQuery = query(
      collection(db, 'pedidos'),
      orderBy('fecha', 'desc')
    );
    let activo = true;
    let versionSnapshot = 0;
    const imagenesProductos = new Map();

    const unsubscribe = onSnapshot(pedidosQuery, async (snapshot) => {
      const versionActual = ++versionSnapshot;
      const pedidosCargados = snapshot.docs.map((pedidoDoc) => ({
        id: pedidoDoc.id,
        ...pedidoDoc.data(),
      }));
      const idsProductosSinImagen = new Set(
        pedidosCargados.flatMap((pedido) => (
          Array.isArray(pedido.productos) ? pedido.productos : []
        ))
          .filter((producto) => !obtenerImagen(producto) && producto.id)
          .map((producto) => String(producto.id))
      );

      await Promise.all([...idsProductosSinImagen].map(async (productoId) => {
        if (!imagenesProductos.has(productoId)) {
          imagenesProductos.set(productoId, getDoc(doc(db, 'productos', productoId))
            .then((productoSnapshot) => (
              productoSnapshot.exists() ? obtenerImagen(productoSnapshot.data()) : ''
            ))
            .catch((imagenError) => {
              console.error(`Error al recuperar la imagen del producto ${productoId}:`, imagenError);
              return '';
            }));
        }
      }));

      const pedidosConImagenes = await Promise.all(pedidosCargados.map(async (pedido) => ({
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
      setPedidos(pedidosConImagenes);
      setCargando(false);
      setError(false);
    }, (snapshotError) => {
      console.error('Error al cargar pedidos para administración: ', snapshotError);
      setCargando(false);
      setError(true);
    });
    return () => {
      activo = false;
      unsubscribe();
    };
  }, []);

  const actualizarEstado = async (pedido, estado) => {
    setActualizando(true);
    try {
      await updateDoc(doc(db, 'pedidos', pedido.id), {
        estado,
        mensajeCliente: `El administrador actualizó el estado de tu pedido a: ${estado}.`,
      });
      setPedidoSeleccionado(null);
    } catch (updateError) {
      console.error('Error al actualizar estado del pedido: ', updateError);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido.');
    } finally {
      setActualizando(false);
    }
  };

  const renderPedido = ({ item }) => {
    const productos = Array.isArray(item.productos) ? item.productos : [];
    const cantidadTotal = productos.reduce(
      (total, producto) => total + (Number(producto.cantidad) || 0),
      0
    );

    return (
      <View style={styles.tarjeta}>
        <View style={styles.cabeceraPedido}>
          <View style={styles.datosCliente}>
            <Text style={styles.numeroPedido}>Pedido #{item.id.slice(0, 8)}</Text>
            <Text style={styles.correoCliente}>{item.correoUsuario || 'Cliente'}</Text>
            <Text style={styles.fecha}>{obtenerFecha(item.fecha)}</Text>
          </View>
          <View style={[styles.badgeEstado, estiloEstado(item.estado)]}>
            <Text style={styles.textoEstado}>{item.estado || 'Pendiente'}</Text>
          </View>
        </View>

        <View style={styles.divisor} />

        {productos.map((producto, index) => (
          <View key={producto.id || `${item.id}-${index}`} style={styles.productoFila}>
            {obtenerImagen(producto) ? (
              <Image source={{ uri: obtenerImagen(producto) }} style={styles.imagen} resizeMode="contain" />
            ) : (
              <View style={[styles.imagen, styles.sinImagen]}>
                <Ionicons name="image-outline" size={22} color="#99A2AE" />
              </View>
            )}
            <View style={styles.infoProducto}>
              <Text style={styles.nombreProducto}>{producto.nombre || 'Producto'}</Text>
              <Text style={styles.cantidadProducto}>Cantidad: {Number(producto.cantidad) || 0}</Text>
            </View>
            <Text style={styles.precioProducto}>
              C$ {(Number(producto.precio) * Number(producto.cantidad)).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.direccionFila}>
          <Ionicons name="location-outline" size={18} color="#0B2E59" />
          <Text style={styles.direccionTexto}>{obtenerDireccion(item.direccion)}</Text>
        </View>

        <View style={styles.resumenFila}>
          <Text style={styles.resumenTexto}>Unidades: {cantidadTotal}</Text>
          <Text style={styles.total}>Total: C$ {Number(item.total || 0).toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.botonEstado}
          onPress={() => setPedidoSeleccionado(item)}
        >
          <Ionicons name="sync-outline" size={18} color="#FFF" />
          <Text style={styles.botonEstadoTexto}>Cambiar estado</Text>
        </TouchableOpacity>

        {item.confirmacionCliente && (
          <View style={styles.mensajeCliente}>
            <View style={styles.mensajeClienteIcono}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0B2E59" />
            </View>
            <View style={styles.mensajeClienteContenido}>
              <Text style={styles.mensajeClienteTitulo}>Confirmación del cliente</Text>
              <Text style={styles.mensajeClienteTexto}>
                Marcó el pedido como {item.confirmacionCliente.toLowerCase()}.
                {item.mensajeAdmin ? ` ${item.mensajeAdmin}` : ''}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.estadoContenido}>
          <EncabezadoAdmin
            titulo="Pedidos"
            subtitulo="Gestiona los pedidos de tus clientes"
            icono="receipt-outline"
          />
          <View style={styles.estadoPantalla}>
            <ActivityIndicator size="large" color="#0B2E59" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.estadoContenido}>
          <EncabezadoAdmin
            titulo="Pedidos"
            subtitulo="Gestiona los pedidos de tus clientes"
            icono="receipt-outline"
          />
          <View style={styles.estadoPantalla}>
            <Ionicons name="alert-circle-outline" size={54} color="#D32F2F" />
            <Text style={styles.textoVacio}>No se pudieron cargar los pedidos.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderPedido}
        contentContainerStyle={pedidos.length ? styles.lista : styles.listaVacia}
        ListHeaderComponent={
          <EncabezadoAdmin
            titulo="Pedidos"
            subtitulo={`Gestiona los pedidos de tus clientes · Total: ${pedidos.length}`}
            icono="receipt-outline"
          />
        }
        ListEmptyComponent={
          <View style={styles.estadoVacio}>
            <Ionicons name="receipt-outline" size={58} color="#AAB2BD" />
            <Text style={styles.textoVacio}>Todavía no hay pedidos.</Text>
          </View>
        }
      />

      <Modal
        transparent
        visible={Boolean(pedidoSeleccionado)}
        animationType="fade"
        onRequestClose={() => !actualizando && setPedidoSeleccionado(null)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Actualizar estado</Text>
            <Text style={styles.modalSubtitulo}>
              Pedido #{pedidoSeleccionado?.id.slice(0, 8)}
            </Text>
            {ESTADOS_PEDIDO.map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.opcionEstado,
                  pedidoSeleccionado?.estado === estado && styles.opcionEstadoActiva,
                ]}
                onPress={() => actualizarEstado(pedidoSeleccionado, estado)}
                disabled={actualizando}
              >
                <Text style={[
                  styles.opcionEstadoTexto,
                  pedidoSeleccionado?.estado === estado && styles.opcionEstadoTextoActivo,
                ]}>
                  {estado}
                </Text>
                {pedidoSeleccionado?.estado === estado && (
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
            {actualizando && <ActivityIndicator color="#0B2E59" style={styles.indicador} />}
            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => setPedidoSeleccionado(null)}
              disabled={actualizando}
            >
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F4F6F9', flex: 1 },
  estadoContenido: { flex: 1, padding: 16 },
  lista: { padding: 16, paddingBottom: 28 },
  listaVacia: { flexGrow: 1, padding: 16 },
  tarjeta: {
    backgroundColor: '#FFF',
    borderColor: '#E2E7EE',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    padding: 14,
  },
  cabeceraPedido: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  datosCliente: { flex: 1, marginRight: 8 },
  numeroPedido: { color: '#263445', fontSize: 15, fontWeight: 'bold' },
  correoCliente: { color: '#465365', fontSize: 13, marginTop: 4 },
  fecha: { color: '#858E9A', fontSize: 11, marginTop: 3 },
  badgeEstado: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  estadoPendiente: { backgroundColor: '#FFF1D6' },
  estadoPreparacion: { backgroundColor: '#F0E9FF' },
  estadoCamino: { backgroundColor: '#E5F1FF' },
  estadoEntregado: { backgroundColor: '#E5F5E9' },
  textoEstado: { color: '#384454', fontSize: 11, fontWeight: 'bold' },
  divisor: { backgroundColor: '#EEF0F3', height: 1, marginVertical: 12 },
  productoFila: { alignItems: 'center', flexDirection: 'row', marginBottom: 10 },
  imagen: { backgroundColor: '#F5F7FA', borderRadius: 8, height: 50, width: 50 },
  sinImagen: { alignItems: 'center', justifyContent: 'center' },
  infoProducto: { flex: 1, marginHorizontal: 9 },
  nombreProducto: { color: '#303A49', fontSize: 13, fontWeight: '600' },
  cantidadProducto: { color: '#7D8795', fontSize: 11, marginTop: 3 },
  precioProducto: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  direccionFila: { alignItems: 'flex-start', flexDirection: 'row', marginTop: 4 },
  direccionTexto: { color: '#606B79', flex: 1, fontSize: 12, lineHeight: 18, marginLeft: 6 },
  resumenFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  resumenTexto: { color: '#6E7886', fontSize: 12 },
  total: { color: '#0B2E59', fontSize: 16, fontWeight: 'bold' },
  botonEstado: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 11,
  },
  botonEstadoTexto: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginLeft: 7 },
  mensajeCliente: {
    alignItems: 'center',
    backgroundColor: '#F1F6FC',
    borderLeftColor: '#0B2E59',
    borderLeftWidth: 4,
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 10,
    padding: 12,
  },
  mensajeClienteIcono: {
    alignItems: 'center',
    backgroundColor: '#E1EBF7',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  mensajeClienteContenido: {
    flex: 1,
  },
  mensajeClienteTitulo: {
    color: '#0B2E59',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  mensajeClienteTexto: {
    color: '#52647A',
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  estadoPantalla: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  estadoVacio: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 50 },
  textoVacio: { color: '#576273', fontSize: 15, marginTop: 12, textAlign: 'center' },
  modalFondo: { backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#FFF', borderRadius: 14, padding: 18 },
  modalTitulo: { color: '#1B2638', fontSize: 18, fontWeight: 'bold' },
  modalSubtitulo: { color: '#77808E', fontSize: 12, marginBottom: 14, marginTop: 4 },
  opcionEstado: {
    alignItems: 'center',
    borderColor: '#0B2E59',
    borderRadius: 8,
    borderWidth: 1,
    borderBottomColor: '#EEF0F3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  opcionEstadoActiva: { backgroundColor: '#0B2E59' },
  opcionEstadoTexto: { color: '#0B2E59', fontSize: 14 },
  opcionEstadoTextoActivo: { color: '#FFF' },
  indicador: { marginTop: 12 },
  botonCancelar: { alignItems: 'center', marginTop: 12, padding: 10 },
  textoCancelar: { color: '#666', fontSize: 14, fontWeight: '600' },
});
