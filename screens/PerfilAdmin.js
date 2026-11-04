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

const REPORTES = {
  excel: {
    url: 'https://backend-lagutex-movil.onrender.com/estadisticas/exportar/excel',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    nombre: 'Excel',
    longitudMinima: 4,
    firma: [0x50, 0x4B],
  },
  pdf: {
    url: 'https://backend-lagutex-movil.onrender.com/estadisticas/exportar/pdf',
    mimeType: 'application/pdf',
    extension: 'pdf',
    nombre: 'PDF',
    longitudMinima: 5,
    firma: [0x25, 0x50, 0x44, 0x46, 0x2D],
  },
};
const URL_API_USUARIOS = 'https://backend-lagutex-movil.onrender.com/usuario';

const solicitarApiUsuarios = async (ruta = '', opciones = {}) => {
  const usuarioActual = auth.currentUser;
  if (!usuarioActual) {
    throw new Error('No hay una sesión administrativa activa.');
  }

  const token = await usuarioActual.getIdToken();
  const response = await fetch(`${URL_API_USUARIOS}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...opciones.headers,
    },
  });

  let respuesta;
  try {
    respuesta = await response.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida.');
  }

  if (!response.ok) {
    throw new Error(
      respuesta?.mensaje || `El servidor respondió con el estado ${response.status}.`
    );
  }

  return respuesta;
};

export default function PerfilAdmin({ navigation }) {
  const Alert = useAppAlert();
  const [usuarioData, setUsuarioData] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [formatoCreandoReporte, setFormatoCreandoReporte] = useState(null);
  const [mostrarFormularioAdmin, setMostrarFormularioAdmin] = useState(false);
  const [creandoAdmin, setCreandoAdmin] = useState(false);
  const [administradores, setAdministradores] = useState([]);
  const [cargandoAdministradores, setCargandoAdministradores] = useState(true);
  const [adminEditando, setAdminEditando] = useState(null);
  const [eliminandoAdminId, setEliminandoAdminId] = useState(null);
  const [nombresAdmin, setNombresAdmin] = useState('');
  const [apellidosAdmin, setApellidosAdmin] = useState('');
  const [cedulaAdmin, setCedulaAdmin] = useState('');
  const [telefonoAdmin, setTelefonoAdmin] = useState('');
  const [correoAdmin, setCorreoAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [verPasswordAdmin, setVerPasswordAdmin] = useState(false);

  const cargarAdministradores = async () => {
    setCargandoAdministradores(true);
    try {
      const usuarios = await solicitarApiUsuarios();
      if (!Array.isArray(usuarios)) {
        throw new Error('El servidor no devolvió una lista válida de usuarios.');
      }

      setAdministradores(usuarios.filter((usuario) => (
        String(usuario.rol || '').toLowerCase() === 'admin'
        || usuario.isAdmin === true
      )));
    } catch (error) {
      console.error('Error al cargar administradores:', error);
      Alert.alert(
        'Error al cargar administradores',
        error instanceof Error ? error.message : 'No se pudo cargar la lista de administradores.'
      );
    } finally {
      setCargandoAdministradores(false);
    }
  };

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
    cargarAdministradores();
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

  const crearReporte = async (formato) => {
    const reporte = REPORTES[formato];
    setFormatoCreandoReporte(formato);
    try {
      const response = await fetch(reporte.url);
      if (!response.ok) {
        throw new Error(`El servidor respondió con el estado ${response.status}.`);
      }

      const contentType = response.headers.get('content-type')?.split(';')[0].trim();
      if (contentType !== reporte.mimeType) {
        throw new Error(`El servidor no devolvió un archivo ${reporte.nombre} válido.`);
      }

      const contenido = await response.bytes();
      if (
        contenido.length < reporte.longitudMinima
        || !reporte.firma.every((byte, index) => contenido[index] === byte)
      ) {
        throw new Error(`El archivo recibido no parece ser un ${reporte.nombre} válido.`);
      }

      const nombreArchivo = response.headers
        .get('content-disposition')
        ?.match(/filename="?([^";]+)"?/i)?.[1]
        || `estadisticas-tienda-${new Date().toISOString().slice(0, 10)}.${reporte.extension}`;
      const nombreSeguro = nombreArchivo.replace(/[\\/:*?"<>|]/g, '_');
      const archivo = new File(Paths.cache, nombreSeguro);
      await archivo.write(contenido);

      if (!await Sharing.isAvailableAsync()) {
        throw new Error('No está disponible la opción para guardar o compartir archivos en este dispositivo.');
      }

      await Sharing.shareAsync(archivo.uri, {
        mimeType: reporte.mimeType,
        dialogTitle: `Guardar reporte ${reporte.nombre}`,
      });
    } catch (error) {
      console.error(`Error al crear el reporte ${reporte.nombre}:`, error);
      Alert.alert(
        'Error al crear el reporte',
        error instanceof Error
          ? error.message
          : `No se pudo descargar el archivo ${reporte.nombre}.`
      );
    } finally {
      setFormatoCreandoReporte(null);
    }
  };

  const guardarAdministrador = async () => {
    if (creandoAdmin) return;

    const nombres = nombresAdmin.trim();
    const apellidos = apellidosAdmin.trim();
    const cedula = cedulaAdmin.trim();
    const telefono = telefonoAdmin.trim();
    const correo = correoAdmin.trim();

    if (
      !nombres
      || !apellidos
      || !cedula
      || !telefono
      || !correo
      || (!adminEditando && !passwordAdmin)
    ) {
      Alert.alert('Campos requeridos', 'Completa todos los datos del administrador.');
      return;
    }

    if (adminEditando && passwordAdmin && passwordAdmin.length < 8) {
      Alert.alert('Contraseña inválida', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!adminEditando && passwordAdmin.length < 6) {
      Alert.alert('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreandoAdmin(true);
    if (adminEditando) {
      try {
        const respuesta = await solicitarApiUsuarios(`/${encodeURIComponent(adminEditando.id)}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombres,
            apellidos,
            cedula,
            telefono,
            correo: correo.toLowerCase(),
            ...(passwordAdmin ? { contrasena: passwordAdmin } : {}),
          }),
        });

        const administradorActualizado = respuesta.usuario || {
          ...adminEditando,
          nombres,
          apellidos,
          cedula,
          telefono,
          correo: correo.toLowerCase(),
        };
        setAdministradores((lista) => lista.map((admin) => (
          admin.id === adminEditando.id ? administradorActualizado : admin
        )));
        setUsuarioData((datos) => (
          auth.currentUser?.uid === adminEditando.id
            ? { ...datos, nombres, apellidos, correo: correo.toLowerCase(), cedula, telefono }
            : datos
        ));
        setAdminEditando(null);
        setMostrarFormularioAdmin(false);
        setPasswordAdmin('');
        Alert.alert(
          respuesta.authSincronizado === false
            ? 'Perfil actualizado'
            : 'Administrador actualizado',
          respuesta.authSincronizado === false
            ? 'El perfil se actualizó, pero el backend no encontró una cuenta asociada en Firebase Auth.'
            : 'Los datos del administrador se actualizaron correctamente.'
        );
      } catch (error) {
        console.error('Error al actualizar administrador:', error);
        Alert.alert(
          'No se pudo actualizar el administrador',
          error instanceof Error ? error.message : 'Ocurrió un error al guardar los cambios.'
        );
      } finally {
        setCreandoAdmin(false);
      }
      return;
    }

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

      setAdministradores((lista) => [...lista, {
        id: usuarioCreado.uid,
        nombres,
        apellidos,
        cedula,
        telefono,
        correo,
        rol: 'admin',
        isAdmin: true,
      }]);
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

  const editarAdministrador = (administrador) => {
    setAdminEditando(administrador);
    setNombresAdmin(administrador.nombres || '');
    setApellidosAdmin(administrador.apellidos || '');
    setCedulaAdmin(administrador.cedula || '');
    setTelefonoAdmin(administrador.telefono || '');
    setCorreoAdmin(administrador.correo || '');
    setPasswordAdmin('');
    setMostrarFormularioAdmin(true);
  };

  const cancelarEdicionAdministrador = () => {
    setAdminEditando(null);
    setMostrarFormularioAdmin(false);
    setNombresAdmin('');
    setApellidosAdmin('');
    setCedulaAdmin('');
    setTelefonoAdmin('');
    setCorreoAdmin('');
    setPasswordAdmin('');
    setVerPasswordAdmin(false);
  };

  const confirmarEliminarAdministrador = (administrador) => {
    if (administrador.id === auth.currentUser?.uid) {
      Alert.alert('Acción no permitida', 'No puedes eliminar la cuenta con la que tienes la sesión activa.');
      return;
    }

    Alert.alert(
      'Eliminar administrador',
      `¿Deseas eliminar a ${administrador.nombres || ''} ${administrador.apellidos || ''}? También se eliminará su cuenta de acceso.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setEliminandoAdminId(administrador.id);
            try {
              const respuesta = await solicitarApiUsuarios(
                `/${encodeURIComponent(administrador.id)}`,
                { method: 'DELETE' }
              );
              setAdministradores((lista) => lista.filter(
                (admin) => admin.id !== administrador.id
              ));
              if (adminEditando?.id === administrador.id) {
                cancelarEdicionAdministrador();
              }
              Alert.alert(
                respuesta.authSincronizado === false
                  ? 'Perfil eliminado'
                  : 'Administrador eliminado',
                respuesta.authSincronizado === false
                  ? 'Se eliminó el perfil, pero el backend no encontró una cuenta asociada en Firebase Auth.'
                  : 'El perfil y la cuenta de acceso se eliminaron correctamente.'
              );
            } catch (error) {
              console.error('Error al eliminar administrador:', error);
              Alert.alert(
                'No se pudo eliminar el administrador',
                error instanceof Error ? error.message : 'Ocurrió un error al eliminar la cuenta.'
              );
            } finally {
              setEliminandoAdminId(null);
            }
          },
        },
      ]
    );
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
            <Text style={styles.tituloReporte}>Reporte en Excel</Text>
            <Text style={styles.descripcionReporte}>
              Descarga los datos de la tienda en formato Excel.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.botonReporte,
              formatoCreandoReporte && styles.botonDeshabilitado,
            ]}
            onPress={() => crearReporte('excel')}
            disabled={Boolean(formatoCreandoReporte)}
            accessibilityRole="button"
            accessibilityLabel="Exportar reporte en Excel"
            accessibilityState={{
              disabled: Boolean(formatoCreandoReporte),
              busy: formatoCreandoReporte === 'excel',
            }}
          >
            {formatoCreandoReporte === 'excel' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="download-outline" size={21} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <View style={[styles.seccionReporte, styles.seccionReportePDF]}>
          <View style={[styles.iconoReporte, styles.iconoReportePDF]}>
            <Ionicons name="document-text-outline" size={24} color="#C2410C" />
          </View>
          <View style={styles.infoReporte}>
            <Text style={styles.tituloReporte}>Reporte en PDF</Text>
            <Text style={styles.descripcionReporte}>
              Descarga los datos de la tienda en formato PDF.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.botonReporte,
              styles.botonReportePDF,
              formatoCreandoReporte && styles.botonDeshabilitado,
            ]}
            onPress={() => crearReporte('pdf')}
            disabled={Boolean(formatoCreandoReporte)}
            accessibilityRole="button"
            accessibilityLabel="Exportar reporte en PDF"
            accessibilityState={{
              disabled: Boolean(formatoCreandoReporte),
              busy: formatoCreandoReporte === 'pdf',
            }}
          >
            {formatoCreandoReporte === 'pdf' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="download-outline" size={21} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.ayudaReporte}>
          {formatoCreandoReporte
            ? `Creando reporte ${REPORTES[formatoCreandoReporte].nombre}...`
            : 'Toca el botón del formato que deseas exportar.'}
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
            onPress={() => {
              if (mostrarFormularioAdmin) {
                cancelarEdicionAdministrador();
              } else {
                setAdminEditando(null);
                setMostrarFormularioAdmin(true);
              }
            }}
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

        <View style={styles.listaAdministradores}>
          <View style={styles.encabezadoAdministradores}>
            <Text style={[styles.tituloFormulario, styles.tituloListaAdministradores]}>
              Administradores registrados
            </Text>
            <TouchableOpacity
              style={styles.botonRecargar}
              onPress={cargarAdministradores}
              disabled={cargandoAdministradores}
              accessibilityRole="button"
              accessibilityLabel="Actualizar lista de administradores"
              accessibilityState={{ disabled: cargandoAdministradores, busy: cargandoAdministradores }}
            >
              {cargandoAdministradores ? (
                <ActivityIndicator size="small" color="#0B2E59" />
              ) : (
                <Ionicons name="refresh-outline" size={20} color="#0B2E59" />
              )}
            </TouchableOpacity>
          </View>
          {cargandoAdministradores ? (
            <ActivityIndicator color="#0B2E59" />
          ) : administradores.length === 0 ? (
            <Text style={styles.textoSinAdministradores}>
              No hay administradores registrados.
            </Text>
          ) : (
            administradores.map((administrador) => {
              const esCuentaActual = administrador.id === auth.currentUser?.uid;
              const eliminando = eliminandoAdminId === administrador.id;
              return (
                <View style={styles.filaAdministrador} key={administrador.id}>
                  <View style={styles.datosAdministrador}>
                    <Text style={styles.nombreAdministrador}>
                      {[administrador.nombres, administrador.apellidos].filter(Boolean).join(' ')
                        || 'Administrador'}
                    </Text>
                    <Text style={styles.correoAdministrador}>
                      {administrador.correo || 'Sin correo registrado'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.botonEditarAdministrador}
                    onPress={() => editarAdministrador(administrador)}
                    disabled={Boolean(eliminandoAdminId) || creandoAdmin}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar administrador ${administrador.nombres || ''}`}
                  >
                    <Ionicons name="create-outline" size={19} color="#0B2E59" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.botonEliminarAdministrador,
                      (esCuentaActual || Boolean(eliminandoAdminId)) && styles.botonDeshabilitado,
                    ]}
                    onPress={() => confirmarEliminarAdministrador(administrador)}
                    disabled={esCuentaActual || Boolean(eliminandoAdminId) || creandoAdmin}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar administrador ${administrador.nombres || ''}`}
                    accessibilityState={{ disabled: esCuentaActual || Boolean(eliminandoAdminId) || creandoAdmin, busy: eliminando }}
                  >
                    {eliminando ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {mostrarFormularioAdmin && (
          <View style={styles.formularioAdmin}>
            <View style={styles.encabezadoFormularioAdmin}>
              <Text style={[styles.tituloFormulario, styles.tituloFormularioAdmin]}>
                {adminEditando ? 'Editar administrador' : 'Nuevo administrador'}
              </Text>
              {adminEditando && (
                <TouchableOpacity
                  style={styles.botonCerrarEdicion}
                  onPress={cancelarEdicionAdministrador}
                  disabled={creandoAdmin}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar edición sin guardar"
                  accessibilityState={{ disabled: creandoAdmin }}
                >
                  <Ionicons name="arrow-back" size={21} color="#0B2E59" />
                </TouchableOpacity>
              )}
            </View>
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
                placeholder={adminEditando
                  ? 'Nueva contraseña (opcional, mínimo 8 caracteres)'
                  : 'Contraseña (mínimo 6 caracteres)'}
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
              onPress={guardarAdministrador}
              disabled={creandoAdmin}
              accessibilityRole="button"
              accessibilityState={{ disabled: creandoAdmin, busy: creandoAdmin }}
            >
              {creandoAdmin ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={adminEditando ? 'save-outline' : 'person-add-outline'}
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.textoCrearAdmin}>
                    {adminEditando ? 'Guardar cambios' : 'Crear administrador'}
                  </Text>
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
  seccionReportePDF: {
    marginTop: 12,
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
  iconoReportePDF: {
    backgroundColor: '#FFF1E8',
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
  botonReportePDF: {
    backgroundColor: '#C2410C',
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
  encabezadoFormularioAdmin: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tituloFormularioAdmin: {
    flex: 1,
  },
  botonCerrarEdicion: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    marginBottom: 14,
    width: 36,
  },
  listaAdministradores: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  encabezadoAdministradores: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tituloListaAdministradores: {
    flex: 1,
    marginBottom: 0,
  },
  botonRecargar: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  textoSinAdministradores: {
    color: '#6B7F95',
    fontSize: 13,
    paddingVertical: 8,
  },
  filaAdministrador: {
    alignItems: 'center',
    borderTopColor: '#E8EEF5',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  datosAdministrador: {
    flex: 1,
  },
  nombreAdministrador: {
    color: '#0B2E59',
    fontSize: 14,
    fontWeight: '700',
  },
  correoAdministrador: {
    color: '#6B7F95',
    fontSize: 12,
    marginTop: 3,
  },
  botonEditarAdministrador: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  botonEliminarAdministrador: {
    alignItems: 'center',
    backgroundColor: '#C2410C',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
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
