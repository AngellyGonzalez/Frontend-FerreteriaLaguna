import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, runTransaction, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAppAlert } from '../components/AppAlert';

const sinCamposDeFecha = (resena) => Object.fromEntries(
  Object.entries(resena).filter(([campo]) => (
    campo !== 'actualizadoEn' && campo !== 'fechaComentario'
  ))
);

export default function DetalleProducto({ route, navigation }) {
  const Alert = useAppAlert();
  const { producto } = route.params || {};

  const [cantidad, setCantidad] = useState(1);
  const [stockDisponible, setStockDisponible] = useState(
    Math.max(0, Math.floor(Number(producto?.stock) || 0))
  );
  const [promedioCalificacion, setPromedioCalificacion] = useState(
    Number(producto?.promedioCalificacion) || 0
  );
  const [cantidadCalificaciones, setCantidadCalificaciones] = useState(
    Number(producto?.cantidadCalificaciones) || 0
  );
  const [calificacionSeleccionada, setCalificacionSeleccionada] = useState(0);
  const [guardandoResena, setGuardandoResena] = useState(false);
  const [comentario, setComentario] = useState('');
  const [comentariosProducto, setComentariosProducto] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [errorComentarios, setErrorComentarios] = useState(false);
  const productoId = producto?.id;

  useEffect(() => {
    if (!productoId) return undefined;

    return onSnapshot(doc(db, 'productos', String(productoId)), (snapshot) => {
      if (snapshot.exists()) {
        const datosProducto = snapshot.data();
        const stockActual = Math.max(0, Math.floor(Number(datosProducto.stock) || 0));
        setStockDisponible(stockActual);
        setCantidad((actual) => (stockActual > 0 ? Math.min(actual, stockActual) : actual));
        setPromedioCalificacion(Number(datosProducto.promedioCalificacion) || 0);
        setCantidadCalificaciones(Number(datosProducto.cantidadCalificaciones) || 0);
      } else {
        setStockDisponible(0);
      }
    }, (error) => {
      console.error('Error al cargar las calificaciones del producto: ', error);
    });
  }, [productoId]);

  useEffect(() => {
    if (!productoId) {
      setComentariosProducto([]);
      setCargandoComentarios(false);
      return undefined;
    }

    setCargandoComentarios(true);
    setErrorComentarios(false);
    const consultaResenas = query(
      collection(db, 'resenas'),
      where('productoId', '==', String(productoId))
    );
    return onSnapshot(consultaResenas, (snapshot) => {
      const resenas = snapshot.docs
        .map((resenaDoc) => ({ id: resenaDoc.id, ...resenaDoc.data() }))
        .filter((resena) => (
          (Number(resena.calificacion) >= 1 && Number(resena.calificacion) <= 5)
          || (typeof resena.comentario === 'string' && resena.comentario.trim())
        ))
        .sort((a, b) => (b.fechaComentario?.toMillis?.() || 0) - (a.fechaComentario?.toMillis?.() || 0));
      setComentariosProducto(resenas);
      setCargandoComentarios(false);
    }, (error) => {
      console.error('Error al cargar comentarios del producto: ', error);
      setErrorComentarios(true);
      setCargandoComentarios(false);
    });
  }, [productoId]);

  useEffect(() => {
    let activo = true;
    const cargarCalificacionUsuario = async () => {
      const usuario = auth.currentUser;
      setCalificacionSeleccionada(0);
      if (!productoId || !usuario) {
        return;
      }

      try {
        const resenaRef = doc(db, 'resenas', `${productoId}_${usuario.uid}`);
        const resenaSnapshot = await getDoc(resenaRef);
        if (activo) {
          const resenaUsuario = resenaSnapshot.exists() ? resenaSnapshot.data() : {};
          setCalificacionSeleccionada(Number(resenaUsuario.calificacion) || 0);
          setComentario(resenaUsuario.comentario || '');
        }
      } catch (error) {
        console.error('Error al cargar tu calificación: ', error);
      }
    };

    cargarCalificacionUsuario();
    const unsubscribeAuth = onAuthStateChanged(auth, cargarCalificacionUsuario);
    return () => {
      activo = false;
      unsubscribeAuth();
    };
  }, [productoId]);

  const incrementar = () => {
    if (stockDisponible > 0) {
      setCantidad((actual) => Math.min(actual + 1, stockDisponible));
    }
  };
  const decrementar = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  const guardarResena = async () => {
    const usuario = auth.currentUser;
    if (!usuario) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para dejar una reseña.');
      return;
    }
    if (!productoId) {
      Alert.alert('Error', 'No se pudo identificar el producto para guardar la reseña.');
      return;
    }
    if (calificacionSeleccionada < 1 || calificacionSeleccionada > 5) {
      Alert.alert('Selecciona una calificación', 'Elige de 1 a 5 estrellas para tu reseña.');
      return;
    }
    const comentarioLimpio = comentario.trim();
    if (!comentarioLimpio) {
      Alert.alert('Comentario vacío', 'Escribe un comentario para completar tu reseña.');
      return;
    }

    setGuardandoResena(true);
    try {
      const productoRef = doc(db, 'productos', String(productoId));
      const resenaRef = doc(db, 'resenas', `${productoId}_${usuario.uid}`);

      await runTransaction(db, async (transaction) => {
        const [productoSnapshot, resenaSnapshot] = await Promise.all([
          transaction.get(productoRef),
          transaction.get(resenaRef),
        ]);
        if (!productoSnapshot.exists()) {
          throw new Error('El producto ya no existe.');
        }

        const datosProducto = productoSnapshot.data();
        const promedioActual = Number(datosProducto.promedioCalificacion) || 0;
        const cantidadActual = Number(datosProducto.cantidadCalificaciones) || 0;
        const calificacionAnterior = resenaSnapshot.exists()
          ? Number(resenaSnapshot.data().calificacion) || 0
          : 0;
        const nuevaCantidad = cantidadActual + (calificacionAnterior ? 0 : 1);
        const nuevaSuma = (promedioActual * cantidadActual)
          - calificacionAnterior
          + calificacionSeleccionada;

        transaction.set(resenaRef, {
          ...(resenaSnapshot.exists() ? sinCamposDeFecha(resenaSnapshot.data()) : {}),
          productoId: String(productoId),
          nombreProducto: producto?.nombre || producto?.Nombre || 'Producto',
          usuarioId: usuario.uid,
          correoUsuario: usuario.email || '',
          calificacion: calificacionSeleccionada,
          comentario: comentarioLimpio,
        });
        transaction.update(productoRef, {
          promedioCalificacion: nuevaCantidad ? nuevaSuma / nuevaCantidad : 0,
          cantidadCalificaciones: nuevaCantidad,
        });
      });
      setComentario('');
      Alert.alert('Gracias', 'Tu reseña se guardó correctamente.');
    } catch (error) {
      console.error('Error al guardar la reseña: ', error);
      Alert.alert('Error', 'No se pudo guardar tu reseña.');
    } finally {
      setGuardandoResena(false);
    }
  };

  const handleAgregarAlCarrito = () => {
    if (stockDisponible < 1) {
      Alert.alert('Producto agotado', 'Este producto ya no tiene unidades disponibles.');
      return;
    }
    if (cantidad > stockDisponible) {
      Alert.alert(
        'Stock insuficiente',
        `Solo quedan ${stockDisponible} unidades disponibles de este producto.`
      );
      return;
    }

    const productoParaCarrito = {
      id: producto?.id || Math.random().toString(),
      nombre: producto?.nombre || producto?.Nombre,
      precio: Number(producto?.precio || producto?.Precio || 0),
      imagen: producto?.imagen || producto?.Imagen || 'https://via.placeholder.com/150',
      cantidad: cantidad, 
    };

    // Navegamos a la pestaña del Carrito dentro del HomeTabs
    navigation.navigate('HomeTabs', {
      screen: 'CarritoTab',
      params: {
        screen: 'Carrito',
        params: {
          productoAgregado: productoParaCarrito,
          keyTimestamp: Date.now(),
        },
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* IMAGEN PRINCIPAL DEL PRODUCTO */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: producto?.imagen || 'https://via.placeholder.com/150' }} 
            style={styles.image} 
            resizeMode="contain"
          />
        </View>

        {/* TARJETA DE INFORMACIÓN PRINCIPAL */}
        <View style={styles.card}>
          <View style={styles.rowTop}>
            <View style={styles.stockBadge}>
              <Ionicons
                name={stockDisponible > 0 ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={14}
                color={stockDisponible > 0 ? '#2E7D32' : '#E63946'}
              />
              <Text style={[styles.stockText, stockDisponible < 1 && styles.stockAgotado]}>
                {stockDisponible > 0
                  ? ` En Stock (${stockDisponible} unidades)`
                  : ' Agotado'}
              </Text>
            </View>
            <Text style={styles.codigoText}>Cód: {producto?.codigo || 'TW-20V-92'}</Text>
          </View>

          <Text style={styles.productName}>{producto?.nombre || 'Nombre del producto'}</Text>

          {/* Calificación del producto */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((estrella) => (
                <Ionicons
                  key={estrella}
                  name={estrella <= Math.round(promedioCalificacion) ? 'star' : 'star-outline'}
                  size={24}
                  color={estrella <= Math.round(promedioCalificacion) ? '#FFB300' : '#CCC'}
                />
              ))}
              <Text style={styles.ratingText}>
                {promedioCalificacion.toFixed(1)}
                <Text style={styles.ratingSub}> ({cantidadCalificaciones} calificaciones)</Text>
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingPrompt}>Califica:</Text>
              {[1, 2, 3, 4, 5].map((estrella) => (
                <TouchableOpacity
                  key={estrella}
                  onPress={() => setCalificacionSeleccionada(estrella)}
                  accessibilityRole="button"
                  accessibilityLabel={`Calificar con ${estrella} ${estrella === 1 ? 'estrella' : 'estrellas'}`}
                  accessibilityState={{ selected: calificacionSeleccionada === estrella }}
                  hitSlop={6}
                  disabled={guardandoResena}
                >
                  <Ionicons
                    name={estrella <= calificacionSeleccionada ? 'star' : 'star-outline'}
                    size={24}
                    color={estrella <= calificacionSeleccionada ? '#FFB300' : '#CCC'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* PRECIO Y CONTADOR DE CANTIDAD */}
          <View style={styles.priceRow}>
            <Text style={styles.precio}>C$ {producto?.precio || producto?.Precio || 0}</Text>

            <View style={styles.counterContainer}>
              <TouchableOpacity onPress={decrementar} style={styles.counterButton}>
                <Ionicons name="remove" size={16} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{cantidad}</Text>
              <TouchableOpacity
                onPress={incrementar}
                style={styles.counterButton}
                disabled={stockDisponible === 0 || cantidad >= stockDisponible}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Tu reseña</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Cuéntanos qué te pareció este producto"
              placeholderTextColor="#8A929E"
              value={comentario}
              onChangeText={setComentario}
              multiline
              maxLength={500}
              editable={!guardandoResena}
              accessibilityLabel="Comentario de tu reseña"
            />
            <TouchableOpacity
              style={[styles.commentButton, guardandoResena && styles.ratingButtonDisabled]}
              onPress={guardarResena}
              disabled={guardandoResena}
            >
              {guardandoResena ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="star-outline" size={17} color="#FFF" />
                  <Text style={styles.commentButtonText}>Guardar reseña</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.commentsHeading}>Reseñas del producto</Text>
            {cargandoComentarios ? (
              <ActivityIndicator size="small"               color="#0B2E59" style={styles.commentsLoader} />
            ) : errorComentarios ? (
              <Text style={styles.noCommentsText}>No se pudieron cargar los comentarios.</Text>
            ) : comentariosProducto.length === 0 ? (
              <Text style={styles.noCommentsText}>Aún no hay comentarios para este producto.</Text>
            ) : (
              comentariosProducto.map((resena) => (
                <View key={resena.id} style={styles.commentCard}>
                  <View style={styles.commentAuthorRow}>
                    <Ionicons name="person-circle-outline" size={20}                     color="#0B2E59" />
                    <Text style={styles.commentAuthor}>
                      {resena.correoUsuario || 'Usuario'}
                    </Text>
                  </View>
                  {Number(resena.calificacion) >= 1 && (
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((estrella) => (
                        <Ionicons
                          key={estrella}
                          name={estrella <= Number(resena.calificacion) ? 'star' : 'star-outline'}
                          size={16}
                          color={estrella <= Number(resena.calificacion) ? '#FFB300' : '#CCC'}
                        />
                      ))}
                    </View>
                  )}
                  {resena.comentario ? (
                    <Text style={styles.commentBody}>{resena.comentario}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

        </View>

      </ScrollView>

      {/* BOTÓN INFERIOR FIJO: AGREGAR AL CARRITO */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[styles.addToCartButton, stockDisponible < 1 && styles.addToCartButtonDisabled]}
          onPress={handleAgregarAlCarrito}
          disabled={stockDisponible < 1}
        >
          <Ionicons name={stockDisponible > 0 ? 'cart' : 'close-circle-outline'} size={20} color="#FFF" />
          <Text style={styles.addToCartText}>
            {stockDisponible > 0 ? 'Agregar al Carrito' : 'Agotado'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  addToCartButton: { 
    alignItems: 'center', 
    backgroundColor: '#0B2E59',
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 14 
  },
  addToCartButtonDisabled: {
    backgroundColor: '#0B2E59',
    opacity: 0.55,
  },
  addToCartText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 8 
  },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    marginBottom: 12, 
    padding: 16 
  },
  commentSection: {
    borderTopColor: '#EEF0F3',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  commentTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#F9F9F9',
    borderColor: '#DDD',
    borderRadius: 8,
    borderWidth: 1,
    color: '#333',
    fontSize: 14,
    minHeight: 76,
    padding: 10,
    textAlignVertical: 'top',
  },
  commentButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#0B2E59',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    minWidth: 155,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  commentButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  commentsHeading: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  commentsLoader: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  noCommentsText: {
    color: '#777',
    fontSize: 13,
    paddingVertical: 8,
  },
  commentCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginBottom: 8,
    padding: 10,
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  commentAuthorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  commentAuthor: {
    color: '#445064',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  commentBody: {
    color: '#333',
    fontSize: 13,
    lineHeight: 18,
  },
  codigoText: { 
    color: '#777', 
    fontSize: 12 
  },
  container: { 
    backgroundColor: '#F4F6F9', 
    flex: 1 
  },
  counterButton: { 
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    padding: 8, 
    paddingHorizontal: 12 
  },
  counterContainer: { 
    borderColor: '#DDD', 
    borderRadius: 8, 
    borderWidth: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  counterValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    paddingHorizontal: 8 
  },
  footerContainer: { 
    backgroundColor: '#FFF', 
    borderTopColor: '#EEE', 
    borderTopWidth: 1, 
    bottom: 0, 
    left: 0, 
    padding: 16, 
    position: 'absolute', 
    right: 0 
  },
  image: { 
    height: 200, 
    width: '100%' 
  },
  imageContainer: { 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    marginBottom: 12, 
    padding: 16 
  },
  precio: { 
    color: '#0B2E59',
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  priceRow: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 8 
  },
  productName: { 
    color: '#333', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  ratingContainer: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginBottom: 8
  },
  ratingSection: {
    marginBottom: 12,
  },
  ratingSub: {
    color: '#777',
    fontWeight: 'normal',
  },
  ratingText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  ratingPrompt: {
    color: '#666',
    fontSize: 12,
    marginRight: 8,
  },
  ratingButtonDisabled: {
    opacity: 0.65,
  },
  rowTop: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 90 
  },
  stockBadge: { 
    alignItems: 'center', 
    backgroundColor: '#E8F5E9', 
    borderRadius: 6, 
    flexDirection: 'row', 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
  stockText: { 
    color: '#2E7D32', 
    fontSize: 12, 
    fontWeight: '500' 
  },
  stockAgotado: {
    color: '#E63946',
  },
});