import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const Login = ({ navigation }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, correo.trim(), password);
      Alert.alert('¡Bienvenido!', 'Has iniciado sesión correctamente.');
      navigation.replace('HomeTabs');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Acceso denegado', 
        'El correo o la contraseña son incorrectos, o la cuenta no existe.'
      );
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

  <View style={styles.topHeader}>
    <Text style={styles.topTitle}>
      Ferretería Laguna
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

          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>¡Bienvenido a tu ferretería de confianza!</Text>

          {/* Campo Correo */}
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
  <Ionicons
    name="mail-outline"
    size={20}
    color="#0B2E59"
  />

  <TextInput
    style={styles.inputText}
    placeholder="Ingresa tu correo"
    placeholderTextColor="#A0A0A0"
    keyboardType="email-address"
    autoCapitalize="none"
    value={correo}
    onChangeText={setCorreo}
  />
</View>

          {/* Campo Contraseña */}
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

          {/* Botón Iniciar Sesión */}
          <TouchableOpacity style={styles.botonLogin} onPress={handleLogin}>
            <Text style={styles.textoBotonLogin}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* Enlace a Registro */}
          <View style={styles.registroContainer}>
            <Text style={styles.textoPregunta}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
              <Text style={styles.textoRegistro}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({

  topHeader: {
  alignItems: 'center',
  marginBottom: 20,
},

topTitle: {
  fontSize: 28,
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
    shadowOpacity: { ios: 0.1, android: 0.2 }[Platform.OS] || 0.1,
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
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  marginTop: 5,
  marginBottom: 25,
  lineHeight: 20,
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
  marginBottom: 25,

      backgroundColor: '#0B2E59',

      shadowColor: '#0B2E59',
      shadowOffset: {
        width: 0,
        height: 6,
      },
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

  registroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoPregunta: {
    fontSize: 13,
    color: '#666',
  },
  textoRegistro: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default Login;