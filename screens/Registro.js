import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useAppAlert } from '../components/AppAlert';

export default function Registro({ navigation }) {
  const Alert = useAppAlert();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  
  const [cargando, setCargando] = useState(false);

  const handleRegistrar = async () => {
    if (!nombres || !apellidos || !cedula || !telefono || !correo || !password) {
      Alert.alert('Error', 'Por favor complete todos los campos, incluyendo correo y contraseña.');
      return;
    }

    setCargando(true);

    try {
      // 1. Crear el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, correo.trim(), password);
      const user = userCredential.user; // UID único generado por Firebase Auth

      // 2. Definir los datos del usuario con los campos limpios en minúsculas
      const nuevoUsuario = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
      };

      // 3. Guardar en la colección 'usuario' usando el user.uid como ID del documento
      await setDoc(doc(db, "usuario", user.uid), nuevoUsuario);

      Alert.alert(
        '¡Bienvenido a Ferretería Laguna!', 
        'Tu cuenta y registro se han completado con éxito. ¡Ya puedes explorar nuestro catálogo!',
        [
          { 
            text: 'Ver Catálogo', 
            onPress: () => {
              navigation.replace('HomeTabs');
            } 
          }
        ]
      );

    } catch (error) {
      console.error("Error al registrar: ", error);
      let mensajeError = 'No se pudo completar el registro.';
      if (error.code === 'auth/email-already-in-use') {
        mensajeError = 'Este correo electrónico ya está registrado.';
      } else if (error.code === 'auth/weak-password') {
        mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        mensajeError = 'El formato del correo electrónico no es válido.';
      }
      Alert.alert('Error', mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. correo@domain.com"
          placeholderTextColor="#A0A0A0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!verPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
            <Ionicons 
              name={verPassword ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón de Registro */}
      <TouchableOpacity 
        style={styles.botonRegistrar}
        onPress={handleRegistrar}
        disabled={cargando}
        accessibilityRole="button"
        accessibilityState={{ disabled: cargando, busy: cargando }}
      >
        {cargando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.textoBoton}>Registrarse</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
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
    paddingTop: 24,
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
  passwordContainer: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  botonRegistrar: {
    backgroundColor: '#0B2E59',
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#0B2E59',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 10,
  },
});