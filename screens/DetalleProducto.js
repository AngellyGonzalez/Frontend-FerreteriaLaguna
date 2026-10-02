import { View, Text, Image, StyleSheet } from 'react-native'; 
export default function DetalleProducto({ route }) { 
const { nombre, precio, categoria, imagen, descripcion } = route.params; return ( 
<View style={styles.container}> 
<Image source={{ uri: imagen }} style={styles.imagen} /> <View style={styles.contenido}> 
<Text style={styles.categoria}>{categoria}</Text> 
<Text style={styles.nombre}>{nombre}</Text> 
<Text style={styles.precio}>${precio}</Text> 
<Text style={styles.tituloDescripcion}>Descripción</Text> <Text style={styles.descripcion}>{descripcion}</Text> 
</View> 
</View> 
); 
} 
const styles = StyleSheet.create({ 
container: { flex: 1, backgroundColor: '#fcfcfc' }, 
imagen: { width: '100%', height: 280 }, 
contenido: { padding: 25 }, 
categoria: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 }, nombre: { fontSize: 30, fontWeight: 'bold', marginBottom: 10 }, precio: { fontSize: 26, fontWeight: 'bold', marginBottom: 25 }, tituloDescripcion: { fontSize: 19, fontWeight: 'bold', marginBottom: 10 }, descripcion: { fontSize: 17, lineHeight: 26 }, 
}); 
