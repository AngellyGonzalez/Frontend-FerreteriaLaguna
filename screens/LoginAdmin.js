import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // 👈 1. Importamos funciones de Firestore
import { auth, db } from '../firebase/config';      // 👈 2. Importamos 'db'

const LoginAdmin = ({ navigation }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginAdmin = async () => {
    if (!correo || !password) {
      Alert.alert('Campos vacíos', 'Por favor ingresa correo y contraseña de administrador.');
      return;
    }

    setLoading(true);
    try {
      // 1. Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, correo.trim(), password);
      const user = userCredential.user;

      // 2. Consultar la colección 'usuario' usando el UID del usuario autenticado
      const userDocRef = doc(db, 'usuario', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setLoading(false);
        Alert.alert('Acceso Denegado', 'No se encontró información de este usuario en la base de datos.');
        return;
      }

      const userData = userDocSnap.data();

      // 3. Verificar si el usuario tiene rol de administrador
      // (Puedes cambiar 'rol === "admin"' según el nombre del campo que uses en Firestore, ej: isAdmin === true)
      if (userData.rol !== 'admin' && userData.isAdmin !== true) {
        setLoading(false);
        Alert.alert('Acceso Denegado', 'Esta cuenta no cuenta con privilegios de administrador.');
        return;
      }

      setLoading(false);
      Alert.alert('¡Bienvenido, Admin!', 'Acceso concedido al panel de control.');
      
      // 4. Redirigir a la vista de administración
      navigation.replace('PanelAdmin');

    } catch (error) {
      setLoading(false);
      console.error(error);
      
      let mensajeError = 'La contraseña es incorrecta o la cuenta no existe.';
      if (error.code === 'auth/user-not-found') {
        mensajeError = 'No existe una cuenta con este correo.';
      } else if (error.code === 'auth/wrong-password') {
        mensajeError = 'Contraseña incorrecta.';
      }

      Alert.alert('Error de Autenticación', mensajeError);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Botón superior para regresar */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0B2E59" />
          <Text style={styles.backText}>Volver al login</Text>
        </TouchableOpacity>

        <View style={styles.topHeader}>
          <Text style={styles.topTitle}>
            Portal Administrativo
          </Text>
        </View>

        <View style={styles.card}>
              
          {/* Logo de Ferretería Laguna */}
          <View style={styles.headerContainer}>
            <Image 
              source={require('../assets/logo (3).png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Acceso Restringido</Text>
          <Text style={styles.subtitle}>Inicia sesión con credenciales de administrador</Text>

          {/* Campo Correo Admin */}
          <Text style={styles.label}>Correo de Administrador</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#0B2E59"
            />
            <TextInput
              style={styles.inputText}
              placeholder="admin@ferreterialaguna.com"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={setCorreo}
            />
          </View>

          {/* Campo Contraseña Admin */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#0B2E59"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Ingresa tu contraseña"
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

          {/* Botón Ingresar */}
          <TouchableOpacity style={styles.botonLogin} onPress={handleLoginAdmin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.textoBotonLogin}>Ingresar al Panel</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#0B2E59',
  },
  topHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  topTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0B2E59',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 140,
    height: 110,
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#E1E1E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  inputText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  passwordContainer: {
    height: 50,
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#E1E1E8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  botonLogin: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#0B2E59',
    shadowColor: '#0B2E59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textoBotonLogin: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginAdmin;