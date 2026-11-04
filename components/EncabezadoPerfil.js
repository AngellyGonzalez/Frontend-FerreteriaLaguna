import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EncabezadoPerfil({
  saludo,
  nombre,
  descripcion,
  correo,
  estadoCuenta,
  onCerrarSesion,
}) {
  return (
    <>
      <View style={styles.encabezado}>
        <View style={styles.titulos}>
          <Text style={styles.etiqueta}>TU ESPACIO PERSONAL</Text>
          <Text style={styles.titulo}>Mi perfil</Text>
        </View>
        <TouchableOpacity
          style={styles.botonCerrarSesion}
          onPress={onCerrarSesion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={27} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tarjetaPerfil}>
        <View style={styles.circuloDecorativoSuperior} />
        <View style={styles.circuloDecorativoInferior} />
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.saludo}>{saludo}</Text>
        <Text style={styles.nombre} numberOfLines={2}>{nombre}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
        {estadoCuenta ? (
          <View style={styles.estadoCuenta}>
            <Ionicons name="checkmark-circle" size={15} color="#C8FFD1" />
            <Text style={styles.estadoCuentaTexto}>{estadoCuenta}</Text>
          </View>
        ) : null}
        {correo ? (
          <View style={styles.correo}>
            <Ionicons name="mail-outline" size={15} color="#D7E4F2" />
            <Text style={styles.correoTexto} numberOfLines={1}>{correo}</Text>
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  titulos: {
    flex: 1,
  },
  etiqueta: {
    color: '#75869A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 5,
  },
  titulo: {
    color: '#0B2E59',
    fontSize: 26,
    fontWeight: '800',
  },
  botonCerrarSesion: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 16,
    elevation: 4,
    height: 54,
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#0B2E59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    width: 54,
  },
  tarjetaPerfil: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 26,
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 230,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  circuloDecorativoSuperior: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 100,
    height: 200,
    position: 'absolute',
    right: -40,
    top: -60,
    width: 200,
  },
  circuloDecorativoInferior: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 90,
    bottom: -80,
    height: 180,
    left: -70,
    position: 'absolute',
    width: 180,
  },
  avatar: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.65)',
    borderRadius: 38,
    borderWidth: 3,
    height: 76,
    justifyContent: 'center',
    marginBottom: 12,
    width: 76,
  },
  saludo: {
    color: '#D7E4F2',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  descripcion: {
    color: '#D7E4F2',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
  estadoCuenta: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  estadoCuentaTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  correo: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 9,
    maxWidth: '100%',
  },
  correoTexto: {
    color: '#D7E4F2',
    flexShrink: 1,
    fontSize: 13,
    marginLeft: 6,
  },
});
