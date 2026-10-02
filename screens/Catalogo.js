import { ScrollView, Text, StyleSheet, View } from "react-native"; 
import Producto from "../components/Producto"; 
export default function Catalogo({ navigation }) { 
return ( 
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
<Text style={styles.titulo}>Descubre nuestros productos</Text> 
<Text style={styles.subtitulo}>Tecnología para todos</Text> 

<View style={styles.rowContainer}>

<View style={styles.productWrapper}>
<Producto 
nombre="Pintura Sur" 
precio="350" 
categoria="Pintura" 
imagen="https://b2csinsa.vtexassets.com/arquivos/ids/621559/152432460-1.jpg?v=638954543070370000" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Pintura Sur', precio: '350', categoria: 'Pintura', 
imagen: 'https://b2csinsa.vtexassets.com/arquivos/ids/621559/152432460-1.jpg?v=638954543070370000', 
descripcion: 'Pintura vinil-acrílica de alta cobertura y excelente durabilidad. Ideal para proteger y embellecer paredes interiores y exteriores.' 
})} 
/> 
</View>


<View style={styles.productWrapper}>
<Producto 
nombre="Cemento" 
precio="500" 
categoria="Cemento Cemex" 
imagen="https://materialeselcentenario.mx/wp-content/uploads/2021/12/Disen%CC%83o-sin-ti%CC%81tulo-18.png" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Cemento', precio: '500', categoria: 'Cemento Cemex', 
imagen: 'https://materialeselcentenario.mx/wp-content/uploads/2021/12/Disen%CC%83o-sin-ti%CC%81tulo-18.png', 
descripcion: 'Cemento gris de alta calidad y resistencia superior, ideal para todo tipo de obras de construcción, desde cimientos hasta acabados duraderos.' 
})} 
/>
</View>



<View style={styles.productWrapper}>
<Producto 
nombre="Tubos" 
precio="100" 
categoria="Tubos PVC" 
imagen="https://media.adeo.com/media/1871323/format/png?width=640&quality=75%22" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Tubos', precio: '100', categoria: 'Tubos PVC', 
imagen: 'https://media.adeo.com/media/1871323/format/png?width=640&quality=75%22', 
descripcion: 'Tubo de PVC resistente y de alta durabilidad, ideal para instalaciones de conducción de agua y sistemas de desagüe seguros.' 
})} 
/>
</View>

<View style={styles.productWrapper}>
<Producto 
nombre="Metabo" 
precio="600" 
categoria="Metabo" 
imagen="https://cdn.rumbosrl.com.ar/uploads/products/images/large/6036140_3.png" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Metabo', precio: '600', categoria: 'Metabo', 
imagen: 'https://cdn.rumbosrl.com.ar/uploads/products/images/large/6036140_3.png', 
descripcion: 'Herramienta eléctrica Metabo de alto rendimiento y máxima potencia, diseñada para trabajos profesionales exigentes con gran durabilidad y seguridad..' 
})} 
/>
</View>


<View style={styles.productWrapper}>
<Producto 
nombre="Taladro" 
precio="750" 
categoria="Taladro Industrial" 
imagen="https://static.vecteezy.com/system/resources/thumbnails/059/245/438/small/heavy-duty-electric-drill-reliable-efficient-for-drilling-screwing-free-png.png" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Taladro', precio: '750', categoria: 'Taladro Industrial', 
imagen: 'https://static.vecteezy.com/system/resources/thumbnails/059/245/438/small/heavy-duty-electric-drill-reliable-efficient-for-drilling-screwing-free-png.png', 
descripcion: 'Taladro potente y versátil con velocidad variable, diseñado para perforaciones precisas en madera, metal y concreto con total comodidad.' 
})} 
/>
</View>

<View style={styles.productWrapper}>
<Producto 
nombre="Martillo" 
precio="200" 
categoria="Martillo Stanley" 
imagen="https://www.distribuidorafama.co.cr/images-webp/0000000490041.webp" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Martillo', precio: '200', categoria: 'Martillo Stanley', 
imagen: 'https://www.distribuidorafama.co.cr/images-webp/0000000490041.webp', 
descripcion: 'Martillo de uña con mango ergonómico y cabeza de acero de alta resistencia, ideal para clavar, extraer y ajustar con máxima firmeza.' 
})} 
/>
</View>

<View style={styles.productWrapper}>
<Producto 
nombre="Serrucho" 
precio="150" 
categoria="Serrucho" 
imagen="https://cdnx.jumpseller.com/ferroelectronic/image/18498694/serruchotoolmak.jpg?1697570959" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Serrucho', precio: '150', categoria: 'Serrucho', 
imagen: 'https://cdnx.jumpseller.com/ferroelectronic/image/18498694/serruchotoolmak.jpg?1697570959', 
descripcion: 'Martillo de uña con mango ergonómico y cabeza de acero de alta resistencia, ideal para clavar, extraer y ajustar con máxima firmeza.' 
})} 
/>
</View>

<View style={styles.productWrapper}>
<Producto 
nombre="Clavos" 
precio="50" 
categoria="Clavos" 
imagen="https://png.pngtree.com/png-vector/20240213/ourmid/pngtree-shiny-steel-nails-piled-up-and-isolated-on-a-white-png-image_11685353.png" 
onPress={() => navigation.navigate('Detalle', { 
nombre: 'Clavos', precio: '50', categoria: 'Clavos', 
imagen: 'https://png.pngtree.com/png-vector/20240213/ourmid/pngtree-shiny-steel-nails-piled-up-and-isolated-on-a-white-png-image_11685353.png', 
descripcion: 'Clavos de acero templado de alta resistencia, diseñados para fijaciones firmes y seguras en proyectos de carpintería y construcción.' 
})} 
/>
</View>

</View>
</ScrollView> 
); 
} 
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    padding: 15, 
  }, 
  titulo: { 
    fontSize: 26, 
    fontWeight: "bold", 
    marginTop: 10, 
  }, 
  subtitulo: { 
    fontSize: 15, 
    marginBottom: 20, 
    color: "#666",
  }, 
  rowContainer: {
    flexDirection: 'row',       // Coloca los elementos en fila horizontal
    flexWrap: 'wrap',           // Permite que bajen a la siguiente línea si no caben
    justifyContent: 'space-between', // Distribuye el espacio entre ellos
  },
  productWrapper: {
    width: '48%',               // Cada tarjeta ocupa casi la mitad de la pantalla
    marginBottom: 15,           // Espacio vertical entre filas
  }
});
