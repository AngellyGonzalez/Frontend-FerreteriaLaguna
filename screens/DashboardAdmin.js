import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Svg, { Circle, Path } from 'react-native-svg';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import EncabezadoAdmin from '../components/EncabezadoAdmin';

const COLORES = ['#0B2E59', '#217346', '#D97706', '#7C3AED', '#C2410C'];
const MEDIDAS = [
  { id: 'ventas', label: 'Ventas totales' },
  { id: 'cantidad', label: 'Cantidad vendida' },
  { id: 'promedio', label: 'Promedio por unidad' },
];
const TIPOS_GRAFICO = [
  { id: 'bar', label: 'Barras', icon: 'bar-chart-outline' },
  { id: 'line', label: 'Líneas', icon: 'analytics-outline' },
  { id: 'pie', label: 'Circular', icon: 'pie-chart-outline' },
  { id: 'doughnut', label: 'Dona', icon: 'ellipse-outline' },
];
const MODELOS_GROQ = [
  { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B' },
  { id: 'qwen/qwen3.6-27b', label: 'Qwen 3.6 27B' },
];
const CLAVE_API_SEGURA = 'ferreteria_laguna_groq_api_key';

const numero = (valor) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};

const dinero = (valor) => `C$ ${numero(valor).toLocaleString('es-NI', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const obtenerProductos = (pedido) => (
  Array.isArray(pedido.productos) ? pedido.productos : []
);

export default function DashboardAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [medida, setMedida] = useState('ventas');
  const [agrupacion, setAgrupacion] = useState('producto');
  const [vista, setVista] = useState('producto');
  const [tipoGrafico, setTipoGrafico] = useState('bar');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(false);
  const [mostrarConfiguracionIA, setMostrarConfiguracionIA] = useState(false);
  const [claveApi, setClaveApi] = useState('');
  const [claveTemporal, setClaveTemporal] = useState('');
  const [modeloGroq, setModeloGroq] = useState(MODELOS_GROQ[0].id);
  const [estadoIA, setEstadoIA] = useState('');
  const [interpretacion, setInterpretacion] = useState('');
  const [decision, setDecision] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const controladorIA = useRef(null);

  useEffect(() => {
    let activo = true;

    SecureStore.getItemAsync(CLAVE_API_SEGURA)
      .then((claveGuardada) => {
        if (activo && claveGuardada) {
          setClaveApi(claveGuardada);
        }
      })
      .catch((errorAlLeer) => {
        console.warn('No se pudo leer la API key almacenada de forma segura:', errorAlLeer.message);
        if (activo) setEstadoIA('No se pudo recuperar la API key guardada.');
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pedidos'),
      (snapshot) => {
        const lista = snapshot.docs.map((pedidoDoc) => ({
          id: pedidoDoc.id,
          ...pedidoDoc.data(),
        }));
        setPedidos(lista);
        setCargando(false);
        setActualizando(false);
        setError(false);
      },
      (snapshotError) => {
        console.error('Error al cargar estadísticas administrativas:', snapshotError);
        setCargando(false);
        setActualizando(false);
        setError(true);
      }
    );

    return unsubscribe;
  }, []);

  const estadisticas = useMemo(() => {
    const ventas = pedidos.reduce((total, pedido) => total + numero(pedido.total), 0);
    const cantidad = pedidos.reduce(
      (total, pedido) => total + obtenerProductos(pedido)
        .reduce((subtotal, producto) => subtotal + numero(producto.cantidad), 0),
      0
    );
    const promedio = cantidad ? ventas / cantidad : 0;
    const pedidosPendientes = pedidos.filter((pedido) => (
      !pedido.estado || pedido.estado === 'Pendiente'
    )).length;
    const grupos = new Map();

    pedidos.forEach((pedido) => {
      const productos = obtenerProductos(pedido);
      if (vista === 'pedidos' && agrupacion === 'estado') {
        const nombre = pedido.estado || 'Pendiente';
        const actual = grupos.get(nombre) || { nombre, ventas: 0, cantidad: 0 };
        actual.ventas += numero(pedido.total);
        actual.cantidad += productos.reduce(
          (subtotal, producto) => subtotal + numero(producto.cantidad),
          0
        );
        grupos.set(nombre, actual);
        return;
      }

      if (vista === 'pedidos' && agrupacion === 'fecha') {
        const fecha = pedido.fecha?.toDate ? pedido.fecha.toDate() : new Date(pedido.fecha);
        const nombre = Number.isNaN(fecha.getTime())
          ? 'Sin fecha'
          : fecha.toLocaleDateString('es-NI', { day: '2-digit', month: 'short' });
        const actual = grupos.get(nombre) || { nombre, ventas: 0, cantidad: 0 };
        actual.ventas += numero(pedido.total);
        actual.cantidad += productos.reduce(
          (subtotal, producto) => subtotal + numero(producto.cantidad),
          0
        );
        grupos.set(nombre, actual);
        return;
      }

      productos.forEach((producto) => {
        const nombre = producto.nombre || 'Producto sin nombre';
        const actual = grupos.get(nombre) || { nombre, ventas: 0, cantidad: 0 };
        actual.ventas += numero(producto.precio) * numero(producto.cantidad);
        actual.cantidad += numero(producto.cantidad);
        grupos.set(nombre, actual);
      });
    });

    const filas = [...grupos.values()]
      .map((grupo) => ({
        ...grupo,
        valor: medida === 'cantidad'
          ? grupo.cantidad
          : medida === 'promedio'
            ? (grupo.cantidad ? grupo.ventas / grupo.cantidad : 0)
            : grupo.ventas,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);

    return {
      ventas,
      cantidad,
      promedio,
      pedidos: pedidos.length,
      pedidosPendientes,
      filas,
    };
  }, [agrupacion, medida, pedidos, vista]);

  const recargar = () => {
    setActualizando(true);
    setTimeout(() => setActualizando(false), 700);
  };

  const contextoIA = () => {
    const medidaSeleccionada = MEDIDAS.find((opcion) => opcion.id === medida);
    const tipoSeleccionado = TIPOS_GRAFICO.find((opcion) => opcion.id === tipoGrafico);
    const filas = estadisticas.filas.length
      ? estadisticas.filas.map((fila) => `- ${fila.nombre}: ${fila.valor}`).join('\n')
      : '- Sin datos';

    return [
      'Resultado de un dashboard multidimensional de ventas de una ferretería.',
      `Vista analizada: ${vista === 'pedidos' ? 'pedidos' : 'productos'}.`,
      `Medida: ${medidaSeleccionada?.label || medida}.`,
      `Agrupación: ${agrupacion === 'fecha' ? 'fecha del pedido' : agrupacion}.`,
      `Tipo de gráfico: ${tipoSeleccionado?.label || tipoGrafico}.`,
      `Totales: ventas ${dinero(estadisticas.ventas)}, unidades ${estadisticas.cantidad}, pedidos ${estadisticas.pedidos}, pendientes ${estadisticas.pedidosPendientes}.`,
      'Datos visibles:',
      filas,
    ].join('\n');
  };

  const analizarConIA = async (tipo) => {
    if (!claveApi.trim()) {
      setEstadoIA('Configura primero una API key de Groq.');
      setMostrarConfiguracionIA(true);
      return;
    }

    controladorIA.current?.abort();
    controladorIA.current = new AbortController();
    setCargandoIA(true);
    setEstadoIA('Analizando datos con Groq...');
    const instruccion = tipo === 'decision'
      ? 'Actúa como gerente de ventas. Escribe una recomendación concreta en español, de máximo 100 palabras, basada en los datos. Indica qué acción debe tomar el administrador y por qué. No uses listas ni títulos.'
      : 'Actúa como analista senior de ventas. Escribe un único párrafo en español de máximo 120 palabras. Menciona los valores más altos y bajos, explica el hallazgo principal y termina con una recomendación concreta. No uses listas ni títulos.';

    try {
      const respuesta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${claveApi.trim()}`,
        },
        signal: controladorIA.current.signal,
        body: JSON.stringify({
          model: modeloGroq,
          temperature: 0.3,
          max_tokens: 300,
          messages: [{ role: 'user', content: `${instruccion}\n\n${contextoIA()}` }],
        }),
      });
      const cuerpo = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        if (respuesta.status === 401 || respuesta.status === 403) {
          throw new Error('La API key es inválida o no tiene permisos.');
        }
        throw new Error(cuerpo?.error?.message || `Error HTTP ${respuesta.status}.`);
      }
      const texto = cuerpo?.choices?.[0]?.message?.content?.trim();
      if (!texto) throw new Error('Groq no devolvió un análisis válido.');
      if (tipo === 'decision') setDecision(texto);
      else setInterpretacion(texto);
      setEstadoIA('Análisis generado correctamente.');
    } catch (errorIA) {
      if (errorIA.name === 'AbortError') return;
      console.warn('No se pudo generar el análisis con Groq:', errorIA.message);
      setEstadoIA(errorIA.message || 'No se pudo generar el análisis.');
    } finally {
      setCargandoIA(false);
    }
  };

  useEffect(() => () => controladorIA.current?.abort(), []);

  const guardarConfiguracionIA = async () => {
    const claveNueva = claveTemporal.trim();
    try {
      if (claveNueva) {
        await SecureStore.setItemAsync(CLAVE_API_SEGURA, claveNueva);
      } else {
        await SecureStore.deleteItemAsync(CLAVE_API_SEGURA);
      }
      setClaveApi(claveNueva);
      setEstadoIA(claveNueva ? 'API key guardada de forma segura.' : 'Configura una API key de Groq.');
      setMostrarConfiguracionIA(false);
    } catch (errorAlGuardar) {
      console.error('No se pudo guardar la API key de forma segura:', errorAlGuardar);
      setEstadoIA('No se pudo guardar la API key en este dispositivo.');
    }
  };

  const eliminarConfiguracionIA = async () => {
    try {
      await SecureStore.deleteItemAsync(CLAVE_API_SEGURA);
      setClaveApi('');
      setClaveTemporal('');
      setInterpretacion('');
      setDecision('');
      setEstadoIA('API key eliminada.');
      setMostrarConfiguracionIA(false);
    } catch (errorAlEliminar) {
      console.error('No se pudo eliminar la API key segura:', errorAlEliminar);
      setEstadoIA('No se pudo eliminar la API key guardada.');
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color="#0B2E59" />
          <Text style={styles.textoCargando}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={actualizando}
            onRefresh={recargar}
            tintColor="#0B2E59"
          />
        )}
      >
        <EncabezadoAdmin
          titulo="Estadísticas"
          subtitulo="Resumen de ventas y pedidos"
          icono="analytics-outline"
        />

        {error && (
          <View style={styles.mensajeError}>
            <Ionicons name="alert-circle-outline" size={20} color="#991B1B" />
            <Text style={styles.textoError}>No se pudieron actualizar los datos.</Text>
          </View>
        )}

        <View style={styles.indicadores}>
          <Kpi icon="cash-outline" label="Ventas totales" value={dinero(estadisticas.ventas)} color="#217346" />
          <Kpi icon="receipt-outline" label="Pedidos" value={estadisticas.pedidos} color="#0B2E59" />
          <Kpi icon="cube-outline" label="Unidades vendidas" value={estadisticas.cantidad} color="#D97706" />
          <Kpi icon="time-outline" label="Pendientes" value={estadisticas.pedidosPendientes} color="#C2410C" />
        </View>

        <View style={styles.panelIA}>
          <View style={styles.panelTituloFila}>
            <View style={styles.iaTituloFila}>
              <View style={styles.iaIcono}>
                <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.panelTitulo}>Análisis con IA</Text>
                <Text style={styles.panelDescripcion}>
                  {claveApi ? `Conectado · ${MODELOS_GROQ.find((modelo) => modelo.id === modeloGroq)?.label}` : 'Configura Groq para analizar tus datos'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.botonConfiguracion}
              onPress={() => {
                setClaveTemporal(claveApi);
                setMostrarConfiguracionIA(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Configurar API de Groq"
            >
              <Ionicons name="settings-outline" size={20} color="#0B2E59" />
            </TouchableOpacity>
          </View>
          <View style={styles.iaAcciones}>
            <TouchableOpacity
              style={[styles.botonIA, !claveApi && styles.botonIADesactivado]}
              onPress={() => analizarConIA('interpretacion')}
              disabled={cargandoIA}
            >
              <Ionicons name="bulb-outline" size={17} color="#FFFFFF" />
              <Text style={styles.textoBotonIA}>Interpretar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonIA, styles.botonDecision, !claveApi && styles.botonIADesactivado]}
              onPress={() => analizarConIA('decision')}
              disabled={cargandoIA}
            >
              <Ionicons name="navigate-outline" size={17} color="#FFFFFF" />
              <Text style={styles.textoBotonIA}>Toma de decisión</Text>
            </TouchableOpacity>
          </View>
          {cargandoIA && <ActivityIndicator color="#7C3AED" style={styles.indicadorIA} />}
          {!!estadoIA && <Text style={styles.estadoIA}>{estadoIA}</Text>}
          {!!interpretacion && (
            <View style={styles.resultadoIA}>
              <Text style={styles.resultadoTitulo}>Interpretación automática</Text>
              <Text style={styles.resultadoTexto}>{interpretacion}</Text>
            </View>
          )}
          {!!decision && (
            <View style={[styles.resultadoIA, styles.resultadoDecision]}>
              <Text style={styles.resultadoTitulo}>Toma de decisión</Text>
              <Text style={styles.resultadoTexto}>{decision}</Text>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelTituloFila}>
            <View>
              <Text style={styles.panelTitulo}>Rendimiento</Text>
              <Text style={styles.panelDescripcion}>Consulta los resultados principales</Text>
            </View>
            <Ionicons name="bar-chart-outline" size={24} color="#0B2E59" />
          </View>

          <Text style={styles.etiqueta}>Ver por</Text>
          <View style={styles.opciones}>
            {[
              { id: 'producto', label: 'Producto' },
              { id: 'pedidos', label: 'Pedidos' },
            ].map((opcion) => (
              <TouchableOpacity
                key={opcion.id}
                style={[styles.opcion, vista === opcion.id && styles.opcionActiva]}
                onPress={() => {
                  setVista(opcion.id);
                  setAgrupacion(opcion.id === 'producto' ? 'producto' : 'estado');
                }}
              >
                <Text style={[styles.textoOpcion, vista === opcion.id && styles.textoOpcionActivo]}>
                  {opcion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.etiqueta}>Medida principal</Text>
          <View style={styles.opciones}>
            {MEDIDAS.map((opcion) => (
              <TouchableOpacity
                key={opcion.id}
                style={[styles.opcion, medida === opcion.id && styles.opcionActiva]}
                onPress={() => setMedida(opcion.id)}
              >
                <Text style={[styles.textoOpcion, medida === opcion.id && styles.textoOpcionActivo]}>
                  {opcion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.etiqueta}>Agrupar resultados por</Text>
          <View style={styles.opciones}>
            <TouchableOpacity
              style={[
                styles.opcion,
                ((vista === 'producto' && agrupacion === 'producto')
                  || (vista === 'pedidos' && agrupacion === 'estado')) && styles.opcionActiva,
              ]}
              onPress={() => setAgrupacion(vista === 'producto' ? 'producto' : 'estado')}
            >
              <Text style={[
                styles.textoOpcion,
                ((vista === 'producto' && agrupacion === 'producto')
                  || (vista === 'pedidos' && agrupacion === 'estado')) && styles.textoOpcionActivo,
              ]}>
                {vista === 'producto' ? 'Producto' : 'Estado'}
              </Text>
            </TouchableOpacity>
            {vista === 'pedidos' && (
              <TouchableOpacity
                style={[styles.opcion, agrupacion === 'fecha' && styles.opcionActiva]}
                onPress={() => setAgrupacion('fecha')}
              >
                <Text style={[styles.textoOpcion, agrupacion === 'fecha' && styles.textoOpcionActivo]}>
                  Fecha del pedido
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.etiqueta}>Tipo de gráfico</Text>
          <View style={styles.opciones}>
            {TIPOS_GRAFICO.map((opcion) => (
              <TouchableOpacity
                key={opcion.id}
                style={[styles.opcion, tipoGrafico === opcion.id && styles.opcionActiva]}
                onPress={() => setTipoGrafico(opcion.id)}
              >
                <Ionicons
                  name={opcion.icon}
                  size={15}
                  color={tipoGrafico === opcion.id ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.textoOpcion, tipoGrafico === opcion.id && styles.textoOpcionActivo]}>
                  {opcion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitulo}>
            {vista === 'producto'
              ? 'Ventas por producto'
              : `Pedidos por ${agrupacion === 'fecha' ? 'fecha' : 'estado'}`}
          </Text>
          <Text style={styles.panelDescripcion}>
            {MEDIDAS.find((opcion) => opcion.id === medida).label} · {TIPOS_GRAFICO.find(
              (opcion) => opcion.id === tipoGrafico
            ).label}
          </Text>
          {estadisticas.filas.length ? (
            <Grafico
              filas={estadisticas.filas}
              tipo={tipoGrafico}
              medida={medida}
            />
          ) : (
            <View style={styles.vacio}>
              <Ionicons name="bar-chart-outline" size={30} color="#99A2AE" />
              <Text style={styles.textoVacio}>Aún no hay datos de ventas.</Text>
            </View>
          )}
        </View>

        <View style={styles.resumen}>
          <View style={styles.resumenIcono}>
            <Ionicons name="trending-up-outline" size={22} color="#217346" />
          </View>
          <View style={styles.resumenTexto}>
            <Text style={styles.resumenTitulo}>Promedio por unidad</Text>
            <Text style={styles.resumenValor}>{dinero(estadisticas.promedio)}</Text>
          </View>
          <Text style={styles.fecha}>Actualizado en tiempo real</Text>
        </View>
      </ScrollView>
      <Modal
        visible={mostrarConfiguracionIA}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarConfiguracionIA(false)}
      >
        <View style={styles.fondoModal}>
          <View style={styles.modalIA}>
            <View style={styles.modalEncabezado}>
              <View>
                <Text style={styles.modalTitulo}>API de Groq</Text>
                <Text style={styles.modalDescripcion}>Se guarda cifrada en el almacenamiento seguro del dispositivo.</Text>
              </View>
              <TouchableOpacity onPress={() => setMostrarConfiguracionIA(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.etiquetaModal}>API key</Text>
            <TextInput
              style={styles.inputApi}
              value={claveTemporal}
              onChangeText={setClaveTemporal}
              placeholder="gsk_..."
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.etiquetaModal}>Modelo IA</Text>
            <View style={styles.opciones}>
              {MODELOS_GROQ.map((modelo) => (
                <TouchableOpacity
                  key={modelo.id}
                  style={[styles.opcion, modeloGroq === modelo.id && styles.opcionActiva]}
                  onPress={() => setModeloGroq(modelo.id)}
                >
                  <Text style={[styles.textoOpcion, modeloGroq === modelo.id && styles.textoOpcionActivo]}>
                    {modelo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.accionesModal}>
              <TouchableOpacity
                style={styles.botonEliminarApi}
                onPress={eliminarConfiguracionIA}
              >
                <Text style={styles.textoEliminarApi}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonGuardarApi}
                onPress={guardarConfiguracionIA}
              >
                <Text style={styles.textoGuardarApi}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Kpi({ icon, label, value, color }) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcono, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValor} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function Grafico({ filas, tipo, medida }) {
  const maximo = Math.max(...filas.map((fila) => fila.valor), 1);
  const formatear = (valor) => medida === 'ventas' || medida === 'promedio'
    ? dinero(valor)
    : String(Math.round(valor));

  if (tipo === 'pie' || tipo === 'doughnut') {
    const total = filas.reduce((suma, fila) => suma + fila.valor, 0) || 1;
    return (
      <View style={styles.circularGrafico}>
        <Svg height="160" width="160" viewBox="0 0 160 160">
          {filas.map((fila, indice) => {
            const inicio = filas
              .slice(0, indice)
              .reduce((suma, anterior) => suma + (anterior.valor / total) * 360, -90);
            const fin = inicio + (fila.valor / total) * 360;
            return (
              <Path
                key={fila.nombre}
                d={crearSector(inicio, fin, tipo === 'doughnut' ? 78 : 80, tipo === 'doughnut' ? 43 : 0)}
                fill={COLORES[indice % COLORES.length]}
              />
            );
          })}
          {tipo === 'doughnut' && <Circle cx="80" cy="80" fill="#FFFFFF" r="43" />}
        </Svg>
        <View style={styles.leyenda}>
          {filas.map((fila, indice) => (
            <View style={styles.leyendaFila} key={fila.nombre}>
              <View style={[styles.puntoLeyenda, { backgroundColor: COLORES[indice % COLORES.length] }]} />
              <Text style={styles.textoLeyenda} numberOfLines={1}>{fila.nombre}</Text>
              <Text style={styles.porcentaje}>{Math.round((fila.valor / total) * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.grafico}>
      <View style={styles.ejes}>
        {[1, 0.5, 0].map((nivel) => (
          <View style={styles.lineaEje} key={nivel}>
            <Text style={styles.etiquetaEje}>{formatear(maximo * nivel)}</Text>
            <View style={styles.lineaEjeVisible} />
          </View>
        ))}
        <View style={styles.series}>
          {filas.map((fila, indice) => (
            <View style={styles.pontoSerie} key={fila.nombre}>
              <View style={styles.areaSerie}>
                {tipo === 'line' && indice > 0 && (
                  <View
                    style={[
                      styles.segmentoLinea,
                      {
                        backgroundColor: COLORES[indice % COLORES.length],
                        transform: [{ rotate: `${Math.atan2(
                          (filas[indice - 1].valor - fila.valor) / maximo * 110,
                          42
                        ) * 180 / Math.PI}deg` }],
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    tipo === 'bar' ? styles.barraColumna : styles.puntoLinha,
                    tipo === 'bar'
                      ? { height: `${Math.max((fila.valor / maximo) * 100, 3)}%`, backgroundColor: COLORES[indice % COLORES.length] }
                      : { bottom: `${(fila.valor / maximo) * 100}%`, backgroundColor: COLORES[indice % COLORES.length] },
                  ]}
                />
              </View>
              <Text style={styles.etiquetaSerie} numberOfLines={1}>{fila.nombre}</Text>
              <Text style={styles.valorSerie}>{formatear(fila.valor)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function puntoPolar(angulo, radio) {
  const radianes = (angulo * Math.PI) / 180;
  return {
    x: 80 + radio * Math.cos(radianes),
    y: 80 + radio * Math.sin(radianes),
  };
}

function crearSector(inicio, fin, radioExterior, radioInterior) {
  const inicioExterior = puntoPolar(inicio, radioExterior);
  const finExterior = puntoPolar(fin, radioExterior);
  const arcoGrande = fin - inicio > 180 ? 1 : 0;
  const arcoExterior = [
    `M ${inicioExterior.x} ${inicioExterior.y}`,
    `A ${radioExterior} ${radioExterior} 0 ${arcoGrande} 1 ${finExterior.x} ${finExterior.y}`,
  ];

  if (!radioInterior) {
    return `${arcoExterior.join(' ')} L 80 80 Z`;
  }

  const finInterior = puntoPolar(fin, radioInterior);
  const inicioInterior = puntoPolar(inicio, radioInterior);
  return [
    ...arcoExterior,
    `L ${finInterior.x} ${finInterior.y}`,
    `A ${radioInterior} ${radioInterior} 0 ${arcoGrande} 0 ${inicioInterior.x} ${inicioInterior.y}`,
    'Z',
  ].join(' ');
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EAF2FB' },
  contenido: { padding: 18, paddingBottom: 32 },
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  textoCargando: { color: '#64748B', fontSize: 14 },
  mensajeError: {
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    padding: 12,
  },
  textoError: { color: '#991B1B', flex: 1, fontSize: 13 },
  indicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  panelIA: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDD6FE',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  iaTituloFila: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  iaIcono: { alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  botonConfiguracion: { alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  iaAcciones: { flexDirection: 'row', gap: 8, marginTop: 16 },
  botonIA: { alignItems: 'center', backgroundColor: '#7C3AED', borderRadius: 10, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', padding: 11 },
  botonDecision: { backgroundColor: '#0B2E59' },
  botonIADesactivado: { opacity: 0.55 },
  textoBotonIA: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  indicadorIA: { marginTop: 12 },
  estadoIA: { color: '#64748B', fontSize: 12, marginTop: 10 },
  resultadoIA: { backgroundColor: '#F5F3FF', borderRadius: 12, marginTop: 12, padding: 12 },
  resultadoDecision: { backgroundColor: '#EFF6FF' },
  resultadoTitulo: { color: '#4C1D95', fontSize: 13, fontWeight: '800', marginBottom: 5 },
  resultadoTexto: { color: '#334155', fontSize: 13, lineHeight: 20 },
  kpi: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 116,
    padding: 12,
    width: '48%',
  },
  kpiIcono: { alignItems: 'center', borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  kpiLabel: { color: '#64748B', fontSize: 12, marginTop: 10 },
  kpiValor: { color: '#1E293B', fontSize: 19, fontWeight: '800', marginTop: 4 },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  panelTituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  panelTitulo: { color: '#1E293B', fontSize: 18, fontWeight: '800' },
  panelDescripcion: { color: '#64748B', fontSize: 12, marginTop: 4 },
  etiqueta: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 18 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { backgroundColor: '#F1F5F9', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9 },
  opcionActiva: { backgroundColor: '#0B2E59' },
  textoOpcion: { color: '#475569', fontSize: 12, fontWeight: '600' },
  textoOpcionActivo: { color: '#FFFFFF' },
  grafico: { height: 280, marginTop: 20 },
  ejes: { flex: 1, paddingLeft: 48, paddingTop: 8 },
  lineaEje: { alignItems: 'center', flexDirection: 'row', height: '33.33%' },
  etiquetaEje: { color: '#94A3B8', fontSize: 9, left: -45, position: 'absolute', width: 40 },
  lineaEjeVisible: { borderTopColor: '#E2E8F0', borderTopWidth: 1, flex: 1 },
  series: { alignItems: 'flex-end', bottom: 36, flexDirection: 'row', left: 48, position: 'absolute', right: 0, top: 8 },
  pontoSerie: { alignItems: 'center', flex: 1, height: '100%', position: 'relative' },
  areaSerie: { alignItems: 'center', flex: 1, justifyContent: 'flex-end', position: 'relative', width: '100%' },
  barraColumna: { borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 5, width: '52%' },
  pontoLinha: { borderRadius: 6, height: 12, position: 'absolute', width: 12 },
  segmentoLinea: { height: 3, position: 'absolute', transformOrigin: 'left center', width: 44 },
  etiquetaSerie: { color: '#64748B', fontSize: 9, marginTop: 7, maxWidth: 64 },
  valorSerie: { color: '#334155', fontSize: 9, fontWeight: '700', marginTop: 3 },
  circularGrafico: { alignItems: 'center', flexDirection: 'row', gap: 18, paddingVertical: 18 },
  leyenda: { flex: 1, gap: 9 },
  leyendaFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  puntoLeyenda: { borderRadius: 5, height: 9, width: 9 },
  textoLeyenda: { color: '#475569', flex: 1, fontSize: 11 },
  porcentaje: { color: '#0B2E59', fontSize: 11, fontWeight: '800' },
  vacio: { alignItems: 'center', paddingVertical: 28 },
  textoVacio: { color: '#64748B', fontSize: 13, marginTop: 8 },
  resumen: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6F1',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  resumenIcono: { alignItems: 'center', backgroundColor: '#E9F5ED', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  resumenTexto: { flex: 1, marginLeft: 12 },
  resumenTitulo: { color: '#64748B', fontSize: 12 },
  resumenValor: { color: '#217346', fontSize: 17, fontWeight: '800', marginTop: 2 },
  fecha: { color: '#94A3B8', fontSize: 10 },
  fondoModal: { backgroundColor: '#00000080', flex: 1, justifyContent: 'flex-end' },
  modalIA: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalEncabezado: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalTitulo: { color: '#1E293B', fontSize: 20, fontWeight: '800' },
  modalDescripcion: { color: '#64748B', fontSize: 12, marginTop: 4, maxWidth: 280 },
  etiquetaModal: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 10 },
  inputApi: { borderColor: '#CBD5E1', borderRadius: 10, borderWidth: 1, color: '#1E293B', fontSize: 14, padding: 12 },
  accionesModal: { flexDirection: 'row', gap: 10, marginTop: 24 },
  botonEliminarApi: { alignItems: 'center', borderColor: '#CBD5E1', borderRadius: 10, borderWidth: 1, flex: 1, padding: 13 },
  textoEliminarApi: { color: '#64748B', fontWeight: '700' },
  botonGuardarApi: { alignItems: 'center', backgroundColor: '#0B2E59', borderRadius: 10, flex: 1, padding: 13 },
  textoGuardarApi: { color: '#FFFFFF', fontWeight: '700' },
});
