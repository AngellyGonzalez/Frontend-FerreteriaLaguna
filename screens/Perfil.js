import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

export default function Perfil({ navigation }) {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email || 'Correo no disponible');
    }
  }, []);

  const handleCerrarSesion = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, salir", 
          onPress: () => {
            signOut(auth)
              .then(() => {
                navigation.replace('Login');
              })
              .catch((error) => {
                Alert.alert("Error", "No se pudo cerrar sesión: " + error.message);
              });
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ENCABEZADO DE PERFIL */}
        <View style={styles.headerContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={50} color="#1E88E5" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Angelly González</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
            <View style={styles.badgeContainer}>
              <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
              <Text style={styles.badgeText}>Cuenta activa</Text>
            </View>
          </View>
        </View>

        {/* TARJETA DE DATOS PERSONALES */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#555" style={styles.iconStyle} />
            <View>
              <Text style={styles.label}>Correo electrónico</Text>
              <Text style={styles.value}>{userEmail}</Text>
            </View>
          </View>
        </View>

        {/* OPCIONES DE CONFIGURACIÓN */}
        <View style={styles.optionsContainer}>
          
          <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert("Próximamente", "Función en desarrollo")}>
            <View style={styles.optionLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#333" />
              <Text style={styles.optionText}>Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert("Próximamente", "Notificaciones activadas")}>
            <View style={styles.optionLeft}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <Text style={styles.optionText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert("Ayuda", "Contacta a soporte en soporte@ferreterialaguna.com")}>
            <View style={styles.optionLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#333" />
              <Text style={styles.optionText}>Ayuda y soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          {/* BOTÓN DE CERRAR SESIÓN */}
          <TouchableOpacity style={[styles.optionRow, styles.logoutRow]} onPress={handleCerrarSesion}>
            <View style={styles.optionLeft}>
              <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
          </TouchableOpacity>

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40, 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconStyle: {
    marginRight: 15,
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  optionsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 15,
    color: '#D32F2F',
    fontWeight: '600',
    marginLeft: 15,
  },
});