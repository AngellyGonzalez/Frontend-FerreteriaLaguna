import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
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

  const agregarAlCarrito = () => {
    Alert.alert(
      "¡Éxito!",
      `Se agregó ${cantidad} unidad(es) de ${producto?.nombre || 'producto'} al carrito.`
    );
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

          {/* CALIFICACIÓN DE ESTRELLAS Opcional simulado */}
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
            <Text style={styles.price}>${producto?.precio || '0.00'}</Text>
            
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
            {producto?.descripcion || 'El producto cuenta con excelentes estándares de calidad, diseñado para máxima durabilidad y rendimiento profesional en cualquier labor requerida.'}
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
        <TouchableOpacity style={styles.addToCartButton} onPress={agregarAlCarrito}>
          <Ionicons name="cart" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.addToCartText}>Agregar al Carrito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90, 
  },
  imageContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 220,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  codigoText: {
    fontSize: 12,
    color: '#888',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingSub: {
    fontWeight: 'normal',
    color: '#888',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  counterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  opinionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verTodasText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
  },
  opinionBox: {
    marginTop: 8,
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 8,
  },
  opinionUser: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  opinionDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  opinionComment: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 10,
  },
  addToCartButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});