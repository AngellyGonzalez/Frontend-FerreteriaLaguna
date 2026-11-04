import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import EncabezadoPerfil from '../components/EncabezadoPerfil';
import { auth, authAdminCreation, db } from '../firebase/config';
import { useAppAlert } from '../components/AppAlert';

const URL_REPORTE_EXCEL = 'https://backend-lagutex-movil.onrender.com/estadisticas/exportar/excel';
const MIME_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export default function PerfilAdmin({ navigation }) {
  const Alert = useAppAlert();
  const [usuarioData, setUsuarioData] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [creandoReporte, setCreandoReporte] = useState(false);
  const [mostrarFormularioAdmin, setMostrarFormularioAdmin] = useState(false);
  const [creandoAdmin, setCreandoAdmin] = useState(false);
  const [nombresAdmin, setNombresAdmin] = useState('');
  const [apellidosAdmin, setApellidosAdmin] = useState('');
  const [cedulaAdmin, setCedulaAdmin] = useState('');
  const [telefonoAdmin, setTelefonoAdmin] = useState('');
  const [correoAdmin, setCorreoAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [verPasswordAdmin, setVerPasswordAdmin] = useState(false);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const usuario = auth.currentUser;
        if (!usuario) {
          throw new Error('No hay una sesión administrativa activa.');
        }

        const usuarioSnapshot = await getDoc(doc(db, 'usuario', usuario.uid));
        if (!usuarioSnapshot.exists()) {
          throw new Error('No se encontró el perfil del administrador.');
        }
        setUsuarioData(usuarioSnapshot.data());
      } catch (error) {
        console.error('Error al cargar perfil de administrador:', error);
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'No se pudo cargar el perfil.'
        );
      } finally {
        setCargandoPerfil(false);
      }
    };

    cargarPerfil();
  }, []);

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            const navegacionPrincipal = navigation.getParent();
            if (!navegacionPrincipal) {
              throw new Error('No se encontró la pantalla principal para volver al inicio de sesión.');
            }
            navegacionPrincipal.replace('Login');
          } catch (error) {
            console.error('Error al cerrar sesión de administrador:', error);
            Alert.alert('Error', 'No se pudo cerrar la sesión.');
          }
        },
      },
    ]);
  };

  const crearReporte = async () => {
    setCreandoReporte(true);
    try {
      const response = await fetch(URL_REPORTE_EXCEL);
      if (!response.ok) {
        throw new Error(`El servidor respondió con el estado ${response.status}.`);
      }

      const contentType = response.headers.get('content-type')?.split(';')[0].trim();
      if (contentType !== MIME_EXCEL) {
        throw new Error('El servidor no devolvió un archivo Excel válido.');
      }

      const contenido = await response.bytes();
      if (
        contenido.length < 4
        || contenido[0] !== 0x50
        || contenido[1] !== 0x4B
      ) {
        throw new Error('El archivo recibido no parece ser un Excel válido.');
      }

      const nombreArchivo = response.headers
        .get('content-disposition')
        ?.match(/filename="?([^";]+)"?/i)?.[1]
        || `estadisticas-tienda-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const nombreSeguro = nombreArchivo.replace(/[\\/:*?"<>|]/g, '_');
      const archivo = new File(Paths.cache, nombreSeguro);
      await archivo.write(contenido);

      if (!await Sharing.isAvailableAsync()) {
        throw new Error('No está disponible la opción para guardar o compartir archivos en este dispositivo.');
      }

      await Sharing.shareAsync(archivo.uri, {
        mimeType: MIME_EXCEL,
        dialogTitle: 'Guardar reporte Excel',
      });
    } catch (error) {
      console.error('Error al crear el reporte Excel:', error);
      Alert.alert(
        'Error al crear el reporte',
        error instanceof Error ? error.message : 'No se pudo descargar el archivo Excel.'
      );
    } finally {
      setCreandoReporte(false);
    }
  };

  const agregarAdministrador = async () => {
    if (creandoAdmin) return;

    const nombres = nombresAdmin.trim();
    const apellidos = apellidosAdmin.trim();
    const cedula = cedulaAdmin.trim();
    const telefono = telefonoAdmin.trim();
    const correo = correoAdmin.trim();

    if (!nombres || !apellidos || !cedula || !telefono || !correo || !passwordAdmin) {
      Alert.alert('Campos requeridos', 'Completa todos los datos para registrar al administrador.');
      return;
    }

    if (passwordAdmin.length < 6) {
      Alert.alert('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreandoAdmin(true);
    let usuarioCreado = null;
    try {
      const credencial = await createUserWithEmailAndPassword(
        authAdminCreation,
        correo,
        passwordAdmin
      );
      usuarioCreado = credencial.user;

      await setDoc(doc(db, 'usuario', usuarioCreado.uid), {
        nombres,
        apellidos,
        cedula,
        telefono,
        correo,
        rol: 'admin',
        isAdmin: true,
      });

      Alert.alert('Administrador agregado', `${nombres} ${apellidos} ya puede iniciar sesión como administrador.`);
      setNombresAdmin('');
      setApellidosAdmin('');
      setCedulaAdmin('');
      setTelefonoAdmin('');
      setCorreoAdmin('');
      setPasswordAdmin('');
      setVerPasswordAdmin(false);
      setMostrarFormularioAdmin(false);
    } catch (error) {
      console.error('Error al agregar administrador:', error);
      if (usuarioCreado) {
        try {
          await deleteUser(usuarioCreado);
        } catch (errorAlEliminar) {
          console.error('No se pudo revertir la cuenta de Auth creada sin perfil:', errorAlEliminar);
          Alert.alert(
            'Error al guardar el perfil',
            'La cuenta se creó, pero no se pudo guardar su perfil ni eliminar la cuenta incompleta. Revisa Firebase antes de volver a intentarlo.'
          );
          return;
        }
      }

      let mensaje = 'No se pudo crear el administrador.';
      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Ese correo ya está registrado.';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'El correo electrónico no tiene un formato válido.';
      } else if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.code === 'permission-denied') {
        mensaje = 'No tienes permiso para registrar administradores. Revisa las reglas de Firestore.';
      } else if (error instanceof Error) {
        mensaje = error.message;
      }
      Alert.alert('No se pudo agregar el administrador', mensaje);
    } finally {
      if (authAdminCreation.currentUser) {
        try {
          await signOut(authAdminCreation);
        } catch (error) {
          console.error('No se pudo cerrar la sesión secundaria de creación:', error);
        }
      }
      setCreandoAdmin(false);
    }
  };

  const nombre = [
    usuarioData?.nombres || usuarioData?.nombre,
    usuarioData?.apellidos,
  ].filter(Boolean).join(' ').trim() || auth.currentUser?.displayName || 'Administrador';

  if (cargandoPerfil) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color="#0B2E59" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <EncabezadoPerfil
          saludo="¡Bienvenido, admin!"
          nombre={nombre}
          descripcion="Este es tu espacio de administración"
          correo={usuarioData?.correo || auth.currentUser?.email}
          estadoCuenta="Administrador"
          onCerrarSesion={cerrarSesion}
        />

        <View style={styles.seccionReporte}>
          <View style={styles.iconoReporte}>
            <Ionicons name="bar-chart-outline" size={24} color="#217346" />
          </View>
          <View style={styles.infoReporte}>
            <Text style={styles.tituloReporte}>Reporte de estadísticas</Text>
            <Text style={styles.descripcionReporte}>
              Descarga los datos de la tienda en formato Excel.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.botonReporte, creandoReporte && styles.botonDeshabilitado]}
            onPress={crearReporte}
            disabled={creandoReporte}
            accessibilityRole="button"
            accessibilityState={{ disabled: creandoReporte, busy: creandoReporte }}
          >
            {creandoReporte ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="download-outline" size={21} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.ayudaReporte}>
          {creandoReporte ? 'Creando reporte...' : 'Toca el botón para crear el reporte.'}
        </Text>

        <View style={[styles.seccionReporte, styles.seccionAdministrador]}>
          <View style={styles.iconoAdministrador}>
            <Ionicons name="person-add-outline" size={23} color="#0B2E59" />
          </View>
          <View style={styles.infoReporte}>
            <Text style={styles.tituloReporte}>Administradores</Text>
            <Text style={styles.descripcionReporte}>
              Registra una cuenta con acceso al panel administrativo.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.botonAdministrador}
            onPress={() => setMostrarFormularioAdmin((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={mostrarFormularioAdmin ? 'Cerrar formulario' : 'Agregar administrador'}
          >
            <Ionicons
              name={mostrarFormularioAdmin ? 'close' : 'add'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {mostrarFormularioAdmin && (
          <View style={styles.formularioAdmin}>
            <Text style={styles.tituloFormulario}>Nuevo administrador</Text>
            <TextInput
              style={styles.inputAdmin}
              placeholder="Nombres"
              placeholderTextColor="#7A8A9D"
              value={nombresAdmin}
              onChangeText={setNombresAdmin}
              autoCapitalize="words"
              editable={!creandoAdmin}
            />
            <TextInput
              style={styles.inputAdmin}
              placeholder="Apellidos"
              placeholderTextColor="#7A8A9D"
              value={apellidosAdmin}
              onChangeText={setApellidosAdmin}
              autoCapitalize="words"
              editable={!creandoAdmin}
            />
            <TextInput
              style={styles.inputAdmin}
              placeholder="Cédula"
              placeholderTextColor="#7A8A9D"
              value={cedulaAdmin}
              onChangeText={setCedulaAdmin}
              autoCapitalize="characters"
              editable={!creandoAdmin}
            />
            <TextInput
              style={styles.inputAdmin}
              placeholder="Teléfono"
              placeholderTextColor="#7A8A9D"
              value={telefonoAdmin}
              onChangeText={setTelefonoAdmin}
              keyboardType="phone-pad"
              editable={!creandoAdmin}
            />
            <TextInput
              style={styles.inputAdmin}
              placeholder="Correo electrónico"
              placeholderTextColor="#7A8A9D"
              value={correoAdmin}
              onChangeText={setCorreoAdmin}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!creandoAdmin}
            />
            <View style={styles.passwordAdmin}>
              <TextInput
                style={styles.passwordInputAdmin}
                placeholder="Contraseña (mínimo 6 caracteres)"
                placeholderTextColor="#7A8A9D"
                value={passwordAdmin}
                onChangeText={setPasswordAdmin}
                secureTextEntry={!verPasswordAdmin}
                autoCapitalize="none"
                editable={!creandoAdmin}
              />
              <TouchableOpacity
                onPress={() => setVerPasswordAdmin((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={verPasswordAdmin ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons
                  name={verPasswordAdmin ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#0B2E59"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.botonCrearAdmin, creandoAdmin && styles.botonDeshabilitado]}
              onPress={agregarAdministrador}
              disabled={creandoAdmin}
              accessibilityRole="button"
              accessibilityState={{ disabled: creandoAdmin, busy: creandoAdmin }}
            >
              {creandoAdmin ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
                  <Text style={styles.textoCrearAdmin}>Crear administrador</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EAF2FB',
    flex: 1,
  },
  contenido: {
    padding: 20,
    paddingBottom: 32,
  },
  cargando: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  seccionReporte: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  iconoReporte: {
    alignItems: 'center',
    backgroundColor: '#E9F5ED',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  infoReporte: {
    flex: 1,
  },
  tituloReporte: {
    color: '#0B2E59',
    fontSize: 15,
    fontWeight: '700',
  },
  descripcionReporte: {
    color: '#6B7F95',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  botonReporte: {
    alignItems: 'center',
    backgroundColor: '#217346',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    marginLeft: 8,
    width: 48,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  ayudaReporte: {
    color: '#6B7F95',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  seccionAdministrador: {
    marginTop: 24,
  },
  iconoAdministrador: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  botonAdministrador: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    marginLeft: 8,
    width: 48,
  },
  formularioAdmin: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  tituloFormulario: {
    color: '#0B2E59',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputAdmin: {
    backgroundColor: '#F8FAFD',
    borderColor: '#DCE6F1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#263445',
    fontSize: 14,
    height: 48,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  passwordAdmin: {
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderColor: '#DCE6F1',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  passwordInputAdmin: {
    color: '#263445',
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  botonCrearAdmin: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
  },
  textoCrearAdmin: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
