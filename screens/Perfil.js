import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,TextInput, Modal,Alert,ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase/config';
import { deleteField, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Perfil({ navigation }) {
  const [usuarioData, setUsuarioData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Agregar Dirección
  const [modalVisible, setModalVisible] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState(null);
  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [barrio, setBarrio] = useState('');
  const [direccionExacta, setDireccionExacta] = useState('');
  const [guardandoDir, setGuardandoDir] = useState(false);

  // Cargar datos del usuario desde Firestore
  useEffect(() => {
    obtenerDatosUsuario();
  }, []);

  const obtenerDatosUsuario = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'usuario', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUsuarioData(docSnap.data());
        }
      }
    } catch (error) {
      console.error("Error al obtener perfil: ", error);
    } finally {
      setLoading(false);
    }
  };


  const limpiarFormularioDireccion = () => {
    setDireccionEditando(null);
    setDepartamento('');
    setMunicipio('');
    setBarrio('');
    setDireccionExacta('');
  };

  const abrirModalAgregarDireccion = () => {
    limpiarFormularioDireccion();
    setModalVisible(true);
  };

  const abrirModalEditarDireccion = (direccion) => {
    setDireccionEditando(direccion.id);
    setDepartamento(direccion.departamento || '');
    setMunicipio(direccion.Municipio || direccion.municipio || '');
    setBarrio(direccion.barrio || '');
    setDireccionExacta(direccion.direccion || '');
    setModalVisible(true);
  };

  const handleGuardarDireccion = async () => {
    if (![departamento, municipio, barrio, direccionExacta].every(value => value.trim())) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos de la dirección.');
      return;
    }

    setGuardandoDir(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para guardar una dirección.');
        return;
      }

      const userRef = doc(db, 'usuario', user.uid);
      const direccionActualizada = {
        departamento: departamento.trim(),
        Municipio: municipio.trim(),
        barrio: barrio.trim(),
        direccion: direccionExacta.trim(),
      };

      const claveDireccion = direccionEditando || `direccion_${Date.now()}`;
      await updateDoc(userRef, {
        [`direcciones.${claveDireccion}`]: direccionActualizada
      });

      Alert.alert('Éxito', direccionEditando
        ? 'Dirección actualizada correctamente.'
        : 'Dirección agregada correctamente.');
      limpiarFormularioDireccion();
      setModalVisible(false);
      obtenerDatosUsuario();

    } catch (error) {
      console.error('Error al guardar dirección: ', error);
      Alert.alert('Error', direccionEditando
        ? 'No se pudo actualizar la dirección.'
        : 'No se pudo guardar la dirección.');
    } finally {
      setGuardandoDir(false);
    }
  };

  const handleEliminarDireccion = (direccionId) => {
    Alert.alert(
      'Eliminar dirección',
      '¿Estás seguro de que deseas eliminar esta dirección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Debes iniciar sesión para eliminar una dirección.');
                return;
              }

              const userRef = doc(db, 'usuario', user.uid);
              await updateDoc(userRef, {
                [`direcciones.${direccionId}`]: deleteField()
              });
              obtenerDatosUsuario();
            } catch (error) {
              console.error('Error al eliminar dirección: ', error);
              Alert.alert('Error', 'No se pudo eliminar la dirección.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: () => {
            auth.signOut()
              .then(() => navigation.replace('Login'))
              .catch(err => console.error(err));
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B2E59" />
      </View>
    );
  }

  // Formatear nombre completo
  const nombreMostrar = usuarioData 
    ? `${usuarioData.nombres || usuarioData.nombre || ''} ${usuarioData.apellidos || ''}`.trim()
    : 'Usuario';

  // Obtener lista de direcciones guardadas
  const direccionesMap = usuarioData?.direcciones || {};
  const listaDirecciones = Object.keys(direccionesMap).map(key => ({
    id: key,
    ...direccionesMap[key]
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* TARJETA DE PERFIL (Nombre y Correo Dinámico) */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="#007AFF" />
        </View>
        <View style={styles.userInfoHeader}>
          <Text style={styles.userName}>{nombreMostrar || 'Cliente Ferretería'}</Text>
          <Text style={styles.userEmail}>{usuarioData?.correo || auth.currentUser?.email}</Text>
          <View style={styles.badgeActive}>
            <Ionicons name="checkmark-circle" size={14} color="#2e7d32" />
            <Text style={styles.badgeText}>Cuenta activa</Text>
          </View>
        </View>
      </View>

      {/* DETALLE DE CORREO */}
      <View style={styles.cardSection}>
        <View style={styles.rowDetail}>
          <Ionicons name="mail-outline" size={22} color="#555" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.labelTitle}>Correo electrónico</Text>
            <Text style={styles.labelValue}>{usuarioData?.correo || auth.currentUser?.email}</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN DE DIRECCIONES */}
      <View style={styles.cardSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Mis Direcciones</Text>
          <TouchableOpacity 
            style={styles.btnAddAddress} 
            onPress={abrirModalAgregarDireccion}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.btnAddText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {listaDirecciones.length === 0 ? (
          <Text style={styles.emptyText}>No tienes direcciones registradas.</Text>
        ) : (
          listaDirecciones.map((item) => (
            <View key={item.id} style={styles.addressCard}>
              <Ionicons name="location-outline" size={20} color="#0B2E59" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressMain}>
                  {item.direccion}
                </Text>

                {/* Compatibilidad con campos en minúscula o Mayúscula */}
                <Text style={styles.addressSub}>
                  {item.barrio ? `B° ${item.barrio}, ` : ''}
                  {item.Municipio || item.municipio || ''}, {item.departamento || ''}
                </Text>
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.btnEditAddress}
                  onPress={() => abrirModalEditarDireccion(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Editar dirección"
                >
                  <Ionicons name="create-outline" size={16} color="#0B2E59" />
                  <Text style={styles.addressActionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnDeleteAddress}
                  onPress={() => handleEliminarDireccion(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar dirección"
                >
                  <Ionicons name="trash-outline" size={16} color="#D32F2F" />
                  <Text style={[styles.addressActionText, styles.deleteAddressText]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* OPCIONES DE CONFIGURACIÓN */}
      <View style={styles.cardSection}>
        <TouchableOpacity style={styles.menuRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#333" />
          <Text style={styles.menuText}>Cambiar contraseña</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow}>
          <Ionicons name="notifications-outline" size={20} color="#333" />
          <Text style={styles.menuText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={handleCerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
          <Text style={[styles.menuText, { color: '#d32f2f', fontWeight: 'bold' }]}>Cerrar sesión</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* MODAL PARA AGREGAR O EDITAR DIRECCIÓN */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {direccionEditando ? 'Editar Dirección' : 'Agregar Nueva Dirección'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Departamento (ej. Chontales)"
              value={departamento}
              onChangeText={setDepartamento}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Municipio (ej. Apompua / Juigalpa)"
              value={municipio}
              onChangeText={setMunicipio}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Barrio / Reparto"
              value={barrio}
              onChangeText={setBarrio}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Dirección exacta (ej. Carretera Rama km 151)"
              value={direccionExacta}
              onChangeText={setDireccionExacta}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.btnModal, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setModalVisible(false);
                  limpiarFormularioDireccion();
                }}
              >
                <Text style={styles.btnModalText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btnModal, { backgroundColor: '#0B2E59' }]}
                onPress={handleGuardarDireccion}
                disabled={guardandoDir}
              >
                {guardandoDir ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.btnModalText, { color: '#FFF' }]}>
                    {direccionEditando ? 'Actualizar' : 'Guardar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInfoHeader: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  rowDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 12,
    color: '#888',
  },
  labelValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  btnAddAddress: {
    flexDirection: 'row',
    backgroundColor: '#0B2E59',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAddText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#E1E1E8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  addressMain: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  addressSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addressActions: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  btnEditAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  btnDeleteAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addressActionText: {
    color: '#0B2E59',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteAddressText: {
    color: '#D32F2F',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2E59',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btnModal: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnModalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});