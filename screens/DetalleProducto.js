import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DetalleProducto({ route, navigation }) {
  const { producto } = route.params || {};

  const [cantidad, setCantidad] = useState(1);

  const incrementar = () => setCantidad(cantidad + 1);
  const decrementar = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  const handleAgregarAlCarrito = () => {
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
        productoAgregado: productoParaCarrito,
        keyTimestamp: Date.now(),
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
              <Ionicons name="checkmark-circle-outline" size={14} color="#2E7D32" />
              <Text style={styles.stockText}> En Stock ({producto?.stock || 0} unidades)</Text>
            </View>
            <Text style={styles.codigoText}>Cód: {producto?.codigo || 'TW-20V-92'}</Text>
          </View>

          <Text style={styles.productName}>{producto?.nombre || 'Nombre del producto'}</Text>

          {/* CALIFICACIÓN DE ESTRELLAS */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFB300" />
            <Ionicons name="star" size={16} color="#FFB300" />
            <Ionicons name="star" size={16} color="#FFB300" />
            <Ionicons name="star" size={16} color="#FFB300" />
            <Ionicons name="star-outline" size={16} color="#CCC" />
            <Text style={styles.ratingText}> 4.2 <Text style={styles.ratingSub}>(18 calificaciones)</Text></Text>
          </View>

          {/* PRECIO Y CONTADOR DE CANTIDAD */}
          <View style={styles.priceRow}>
            <Text style={styles.precio}>C$ {producto?.precio || producto?.Precio || 0}</Text>
            
            <View style={styles.counterContainer}>
              <TouchableOpacity onPress={decrementar} style={styles.counterButton}>
                <Ionicons name="remove" size={16} color="#333" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{cantidad}</Text>
              <TouchableOpacity onPress={incrementar} style={styles.counterButton}>
                <Ionicons name="add" size={16} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* TARJETA DE DESCRIPCIÓN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Descripción del Producto</Text>
          <Text style={styles.descriptionText}>
            {producto?.descripcion || 'El producto cuenta con excelentes estándares de calidad, diseñado para máxima durabilidad y rendimiento profesional.'}
          </Text>
        </View>

        {/* TARJETA DE OPINIONES */}
        <View style={styles.card}>
          <View style={styles.opinionHeader}>
            <Text style={styles.sectionTitle}>Opiniones Recientes</Text>
            <TouchableOpacity onPress={() => Alert.alert("Opiniones", "Ver todas las valoraciones")}>
              <Text style={styles.verTodasText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.opinionBox}>
            <Text style={styles.opinionUser}>Ronaldo G. (Contratista)</Text>
            <Text style={styles.opinionDate}>Hace 3 días</Text>
            <Text style={styles.opinionComment}>"Excelente calidad y rendimiento. Muy recomendado para proyectos exigentes."</Text>
          </View>
        </View>

      </ScrollView>

      {/* BOTÓN INFERIOR FIJO: AGREGAR AL CARRITO */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.addToCartButton} 
          onPress={handleAgregarAlCarrito}
        >
          <Ionicons name="cart" size={20} color="#FFF" />
          <Text style={styles.addToCartText}>Agregar al Carrito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  addToCartButton: { 
    alignItems: 'center', 
    backgroundColor: '#1E88E5', 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 14 
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
  codigoText: { 
    color: '#777', 
    fontSize: 12 
  },
  container: { 
    backgroundColor: '#F4F6F9', 
    flex: 1 
  },
  counterButton: { 
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
  descriptionText: { 
    color: '#666', 
    fontSize: 14, 
    lineHeight: 20 
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
  opinionBox: { 
    backgroundColor: '#F9F9F9', 
    borderRadius: 8, 
    marginTop: 4, 
    padding: 10 
  },
  opinionComment: { 
    color: '#555', 
    fontSize: 13, 
    fontStyle: 'italic' 
  },
  opinionDate: { 
    color: '#888', 
    fontSize: 11, 
    marginBottom: 4 
  },
  opinionHeader: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  opinionUser: { 
    color: '#333', 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  precio: { 
    color: '#1E88E5', 
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
    marginBottom: 12 
  },
  ratingSub: { 
    color: '#777', 
    fontWeight: 'normal' 
  },
  ratingText: { 
    color: '#333', 
    fontSize: 14, 
    fontWeight: 'bold' 
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
  sectionTitle: { 
    color: '#333', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 8 
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
  verTodasText: { 
    color: '#1E88E5', 
    fontWeight: '600' 
  }
});