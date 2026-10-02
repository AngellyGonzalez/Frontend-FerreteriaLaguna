import { View, Text, Image, StyleSheet, TouchableHighlight,} from "react-native";
export default function Producto({ nombre, precio, categoria, imagen, onPress,}) {
return (
<View style={styles.card}>
<Image source={{ uri: imagen }} style={styles.imagen} />
<View style={styles.contenido}>
<Text style={styles.categoria}>{categoria}</Text>
<Text style={styles.nombre}>{nombre}</Text>
<Text style={styles.precio}>${precio}</Text>
<TouchableHighlight style={styles.boton} onPress={onPress}>
<Text style={styles.textoBoton}>Ver detalle</Text>
</TouchableHighlight>
</View>
</View>
);
}
const styles = StyleSheet.create({
card: {
backgroundColor: "#fffefe",
borderRadius: 18,
marginBottom: 18,
overflow: "hidden",
elevation: 4,
},
imagen: { width: "100%", height: 180 },
contenido: { padding: 16 },
categoria: { fontSize: 13, fontWeight: "bold", marginBottom: 5 },
nombre: { fontSize: 21, fontWeight: "bold", marginBottom: 8 },
precio: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
boton: {
paddingVertical: 12,
borderRadius: 10,
alignItems: "center",
backgroundColor: "#384ab1",
},
textoBoton: { color: "#fffdfd", fontSize: 15, fontWeight: "bold" },
});