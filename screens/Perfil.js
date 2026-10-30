import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,TextInput, Modal,ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase/config';
import { deleteField, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAppAlert } from '../components/AppAlert';

export default function Perfil({ navigation }) {
  const Alert = useAppAlert();
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
      <Text style={styles.pageSubtitle}>Administra tu cuenta y tus direcciones</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={34} color="#0B2E59" />
          </View>
          <View style={styles.badgeActive}>
            <Ionicons name="checkmark-circle" size={14} color="#A8E6B0" />
            <Text style={styles.badgeText}>Cuenta activa</Text>
          </View>
        </View>
        <Text style={styles.userName}>{nombreMostrar || 'Cliente Ferretería'}</Text>
        <View style={styles.profileEmailRow}>
          <Ionicons name="mail-outline" size={16} color="#C8D8EB" />
          <Text style={styles.userEmail}>{usuarioData?.correo || auth.currentUser?.email || 'Correo no disponible'}</Text>
        </View>
      </View>

      {/* SECCIÓN DE DIRECCIONES */}
      <View style={styles.cardSection}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="location" size={18} color="#0B2E59" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Mis direcciones</Text>
              <Text style={styles.sectionSubtitle}>
                {listaDirecciones.length === 1
                  ? '1 dirección guardada'
                  : `${listaDirecciones.length} direcciones guardadas`}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.btnAddAddress} 
            onPress={abrirModalAgregarDireccion}
            accessibilityRole="button"
            accessibilityLabel="Agregar dirección"
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.btnAddText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {listaDirecciones.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="home-outline" size={26} color="#7B8DA5" />
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes direcciones</Text>
            <Text style={styles.emptyText}>Agrega una dirección para agilizar tus próximos pedidos.</Text>
          </View>
        ) : (
          listaDirecciones.map((item) => (
            <View key={item.id} style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Ionicons name="location-outline" size={20} color="#0B2E59" />
              </View>
              <View style={styles.addressContent}>
                <Text style={styles.addressMain}>{item.direccion}</Text>
                <Text style={styles.addressSub}>
                  {[item.barrio && `B° ${item.barrio}`, item.Municipio || item.municipio, item.departamento]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
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
                  <View style={styles.actionDivider} />
                  <TouchableOpacity
                    style={styles.btnDeleteAddress}
                    onPress={() => handleEliminarDireccion(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar dirección"
                  >
                    <Ionicons name="trash-outline" size={16} color="#0B2E59" />
                    <Text style={[styles.addressActionText, styles.deleteAddressText]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* OPCIONES DE CONFIGURACIÓN */}
      <View style={styles.cardSection}>
        <View style={styles.settingsHeading}>
          <Ionicons name="settings-outline" size={18} color="#0B2E59" />
          <Text style={styles.sectionTitle}>Configuración</Text>
        </View>
        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.menuIconBlue]}>
            <Ionicons name="lock-closed-outline" size={18} color="#0B2E59" />
          </View>
          <Text style={styles.menuText}>Cambiar contraseña</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </View>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.menuIconGold]}>
            <Ionicons name="notifications-outline" size={18} color="#0B2E59" />
          </View>
          <Text style={styles.menuText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </View>

        <TouchableOpacity style={styles.menuRow} onPress={handleCerrarSesion}>
          <View style={[styles.menuIcon, styles.menuIconBlue]}>
            <Ionicons name="log-out-outline" size={18} color="#0B2E59" />
          </View>
          <Text style={styles.menuText}>Cerrar sesión</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* MODAL PARA AGREGAR O EDITAR DIRECCIÓN */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="location" size={22} color="#0B2E59" />
            </View>
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
                style={styles.btnModal}
                onPress={() => {
                  setModalVisible(false);
                  limpiarFormularioDireccion();
                }}
              >
                <Text style={styles.btnModalText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnModal}
                onPress={handleGuardarDireccion}
                disabled={guardandoDir}
              >
                {guardandoDir ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnModalText}>
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
    paddingBottom: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageSubtitle: {
    color: '#738198',
    fontSize: 14,
    marginBottom: 18,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#0B2E59',
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#0B2E59',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  profileTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D5E4F4',
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  userEmail: {
    color: '#D7E4F2',
    flex: 1,
    fontSize: 13,
    marginLeft: 7,
  },
  profileEmailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 7,
  },
  badgeActive: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardSection: {
    backgroundColor: '#FFF',
    borderColor: '#E8EDF4',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#27364B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  sectionTitle: {
    color: '#172B45',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8591A3',
    fontSize: 12,
    marginTop: 2,
  },
  btnAddAddress: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 8,
    flexDirection: 'row',
    marginLeft: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  btnAddText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  emptyText: {
    color: '#7B8798',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderColor: '#E8EDF4',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    marginBottom: 10,
    width: 50,
  },
  emptyTitle: {
    color: '#263A53',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderColor: '#E8EDF4',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 9,
    padding: 12,
  },
  addressIcon: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  addressContent: {
    flex: 1,
  },
  addressMain: {
    color: '#263A53',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  addressSub: {
    color: '#758297',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  addressActions: {
    alignItems: 'center',
    borderTopColor: '#E8EDF4',
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 5,
  },
  btnEditAddress: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 12,
    paddingVertical: 5,
  },
  btnDeleteAddress: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 12,
    paddingVertical: 5,
  },
  actionDivider: {
    backgroundColor: '#D9E0E9',
    height: 18,
    width: 1,
  },
  addressActionText: {
    color: '#0B2E59',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteAddressText: {
    color: '#0B2E59',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F6',
  },
  settingsHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 2,
  },
  menuIcon: {
    alignItems: 'center',
    borderRadius: 11,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  menuIconBlue: {
    backgroundColor: '#EAF2FB',
  },
  menuIconGold: {
    backgroundColor: '#EAF2FB',
  },
  menuText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 14,
    color: '#33445B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 22,
  },
  modalIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginBottom: 10,
    width: 44,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
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
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnModalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});