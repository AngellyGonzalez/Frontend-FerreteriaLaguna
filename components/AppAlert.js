import React, { createContext, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AppAlertContext = createContext(null);

export function AppAlertProvider({ children }) {
  const [alerta, setAlerta] = useState(null);

  const mostrarAlerta = (titulo, mensaje, botones, opciones = {}) => {
    setAlerta({
      titulo,
      mensaje,
      botones: botones?.length ? botones : [{ text: 'Aceptar' }],
      cancelable: opciones.cancelable === true,
    });
  };

  const cerrarAlerta = (boton) => {
    setAlerta(null);
    if (boton?.onPress) boton.onPress();
  };

  const tituloNormalizado = String(alerta?.titulo || '').toLowerCase();
  const icono = tituloNormalizado.includes('error')
    || tituloNormalizado.includes('agotado')
    || tituloNormalizado.includes('denegado')
    ? 'alert-circle-outline'
    : tituloNormalizado.includes('éxito')
      || tituloNormalizado.includes('exitoso')
      || tituloNormalizado.includes('gracias')
      || tituloNormalizado.includes('bienvenido')
      ? 'checkmark-circle-outline'
      : 'information-circle-outline';

  return (
    <AppAlertContext.Provider value={mostrarAlerta}>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={Boolean(alerta)}
        onRequestClose={() => alerta?.cancelable && setAlerta(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.card} accessibilityRole="alert">
            <View style={styles.iconContainer}>
              <Ionicons name={icono} size={28} color="#0B2E59" />
            </View>
            <Text style={styles.title}>{alerta?.titulo}</Text>
            <Text style={styles.message}>{alerta?.mensaje}</Text>
            <View style={styles.buttons}>
              {alerta?.botones.map((boton, indice) => (
                <TouchableOpacity
                  key={`${boton.text || 'Aceptar'}-${indice}`}
                  style={styles.button}
                  onPress={() => cerrarAlerta(boton)}
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>{boton.text || 'Aceptar'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const mostrarAlerta = useContext(AppAlertContext);
  if (!mostrarAlerta) {
    throw new Error('useAppAlert debe usarse dentro de AppAlertProvider.');
  }
  return { alert: mostrarAlerta };
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 45, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5EF',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 12,
    maxWidth: 420,
    padding: 22,
    shadowColor: '#0B2E59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#EAF2FB',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  title: {
    color: '#0B2E59',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#5D6A7B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  buttons: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0B2E59',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 46,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
