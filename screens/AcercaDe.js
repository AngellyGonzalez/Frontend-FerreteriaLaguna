import { View, Text, StyleSheet } from 'react-native'; 
export default function AcercaDe() { 
 return ( 
 <View style={styles.container}> 
 <Text style={styles.titulo}>CatalogoProductos</Text> 
 <Text style={styles.texto}> 
 Aplicación desarrollada como práctica de Programación Móvil. 
 </Text> 
 <Text style={styles.texto}> 
 Componentes, props, Stack Navigation, Tabs y Drawer. 
 </Text> 
 </View> 
 ); 
} 
const styles = StyleSheet.create({ 
 container: { flex: 1, padding: 25, alignItems: 'center', justifyContent: 'center' },  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 }, 
 texto: { fontSize: 15, textAlign: 'center', color: '#555', marginBottom: 6 }, 
});
