import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,Alert,ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export default function Registro({ navigation }) {
 
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  
  
  const [cargando, setCargando] = useState(false);

  const handleRegistrar = async () => {

    if (!nombres || !apellidos || !cedula || !telefono) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    setCargando(true);

    try {
      
      const nuevoCliente = {
        Nombres: nombres.trim(),
        Apellidos: apellidos.trim(),
        Cedula: cedula.trim(),
        telefono: telefono.trim(),
      };


      await addDoc(collection(db, "Clientes"), nuevoCliente);

      Alert.alert(
        '¡Bienvenido a Ferretería Laguna!', 
        'Tu registro se ha completado con éxito. ¡Ya puedes explorar nuestro catálogo!',
        [
          { 
            text: 'Ver Catálogo', 
            onPress: () => {
              navigation.replace('HomeTabs');

              setNombres('');
              setApellidos('');
              setCedula('');
              setTelefono('');
            } 
          }
        ]
      );

    } catch (error) {
      console.error("Error al guardar en Firestore: ", error);
      Alert.alert('Error', 'No se pudo registrar el cliente en la base de datos. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation && navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro de Cliente</Text>
      </View>

      {/* Banner informativo */}
      <View style={styles.banner}>
        <Ionicons name="pricetag-outline" size={20} color="#0066CC" style={{ marginRight: 8 }} />
        <Text style={styles.bannerText}>
          Ferretería Laguna: Regístrate para gestionar tus pedidos y compras.
        </Text>
      </View>

      {/* Formulario */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombres</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Yaleska Cristal"
          placeholderTextColor="#A0A0A0"
          value={nombres}
          onChangeText={setNombres}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Apellidos</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Sevilla Centeno"
          placeholderTextColor="#A0A0A0"
          value={apellidos}
          onChangeText={setApellidos}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Cédula</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 121-120592-1002M"
          placeholderTextColor="#A0A0A0"
          value={cedula}
          onChangeText={setCedula}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 87459012"
          placeholderTextColor="#A0A0A0"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
      </View>

      {/* Botón de Registro */}
      <TouchableOpacity 
        style={[styles.botonRegistrar, cargando && { backgroundColor: '#90CAF9' }]} 
        onPress={handleRegistrar}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.textoBoton}>Registrar Cliente</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#111',
  },
  banner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#0D47A1',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: '#333',
  },
  botonRegistrar: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    elevation: 2,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});