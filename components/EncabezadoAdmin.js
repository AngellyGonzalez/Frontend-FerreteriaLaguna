import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LogoMarca from './LogoMarca';

export default function EncabezadoAdmin({ titulo, subtitulo }) {
  return (
    <View style={styles.encabezado}>
      <View style={styles.textos}>
        <Text style={styles.etiqueta}>PANEL ADMINISTRATIVO</Text>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.subtitulo}>{subtitulo}</Text>
      </View>
      <LogoMarca size={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  textos: {
    flex: 1,
  },
  etiqueta: {
    color: '#217346',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titulo: {
    color: '#0B2E59',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitulo: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 3,
  },
});
