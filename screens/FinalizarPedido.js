import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FinalizarPedido({ route, navigation }) {
  // Recibimos los datos enviados desde el Carrito
  const { productosCarrito = [], totalPagar = 0 } = route.params || {};

  // Estados para los campos del formulario (puedes enlazarlos a backend después)
  const [departamento, setDepartamento] = useState('Managua');
  const [municipio, setMunicipio] = useState('Distrito V');
  const [barrio, setBarrio] = useState('Reparto San Juan');
  const [direccion, setDireccion] = useState('Del portón principal de la UCA, 150 varas abajo...');
  
  const [numeroTarjeta, setNumeroTarjeta] = useState('.... .... .... 4519');
  const [vencimiento, setVencimiento] = useState('12/28');
  const [cvv, setCvv] = useState('***');

  const handleConfirmarPedido = () => {
    Alert.alert(
      "¡Pedido Exitoso!",
      "Tu orden ha sido registrada correctamente.",
      [
        { 
          text: "OK", 
          onPress: () => {
            // Regresamos al catálogo o a la pestaña de pedidos limpia
            navigation.navigate('HomeTabs', { screen: 'CatalogoTab' });
          } 
        }
      ]
    );
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
            <Ionicons name="location-outline" size={20} color="#1E88E5" />
            <Text style={styles.cardTitle}>Dirección de Entrega</Text>
          </View>

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
            <Ionicons name="card-outline" size={20} color="#1E88E5" />
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
            <Text style={styles.totalFinalLabel}>Total Final:</Text>
            <Text style={styles.totalFinalValor}>C$ {Number(totalPagar).toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* BOTÓN INFERIOR DE CONFIRMACIÓN */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.botonConfirmar} onPress={handleConfirmarPedido}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.textoBotonConfirmar}>Confirmar Pedido (C$ {Number(totalPagar).toFixed(2)})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { marginRight: 10 },
  botonConfirmar: {
    alignItems: 'center',
    backgroundColor: '#1E88E5',
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
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});