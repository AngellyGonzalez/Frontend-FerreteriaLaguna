import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../firebase/config";
import Categoria from "../components/Categoria";
import Producto from "../components/Producto";

const Catalogo = ({ navigation }) => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    obtenerCategorias();
    obtenerProductos();
  }, []);

  const obtenerCategorias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categorias")); 
      const datos = [
        {
          id: "todos",
          nombre: "Todos",
          icono: "apps-outline",
        }
      ];
    
      querySnapshot.forEach((doc) => {
        datos.push({ id: doc.id, ...doc.data() });
      });

      setCategorias(datos); 
    } catch (error) {
      console.error("Error obteniendo categorías: ", error);
    }
  };

  const obtenerProductos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "productos")); 
      const datos = [];
      querySnapshot.forEach((doc) => {
        datos.push({ id: doc.id, ...doc.data() });
      });
      setProductos(datos);
    } catch (error) {
      console.error("Error obteniendo productos: ", error);
    }
  };

  const obtenerProductosPorCategoria = async (idCategoriaNumerico) => {
    try {
      console.log("Filtrando productos por ID numérico de categoría:", idCategoriaNumerico);
      
      const consulta = query(
        collection(db, "productos"), 
        where("categoria_id", "==", idCategoriaNumerico) 
      );
      
      const consultaSnapshot = await getDocs(consulta);
      const datos = [];
      consultaSnapshot.forEach((documento) => {
        datos.push({ id: documento.id, ...documento.data() });
      });

      console.log("Productos encontrados:", datos.length);
      setProductos(datos);
    } catch (error) {
      console.error("Error obteniendo productos por categoría:", error);
    }
  };
  // Filtrado de productos basado en el buscador
  const productosFiltrados = productos.filter((producto) => {
    const nombreProducto = producto.nombre || producto.Nombre || "";
    return nombreProducto.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
      {/* Barra de Búsqueda */}
      <View style={styles.buscador}>
        <Ionicons name="search-outline" size={18} color="#007AFF" />
        <TextInput
          placeholder="Buscar herramientas, cemento, tornillos..."
          placeholderTextColor="#A0A0A0"
          style={styles.input}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Categorías Horizontal */}
      <Text style={styles.subtituloSeccion}>Categorías</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categorias}
      >
        {categorias.map((categoria) => (
          <Categoria
            key={categoria.id} 
            nombre={categoria.nombre_categoria || categoria.nombre || "Todos"} 
            onPress={() => {
              if (categoria.id === "todos") {
                obtenerProductos(); 
              } else {
                obtenerProductosPorCategoria(categoria.id); 
              }
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.linea} />
      <Text style={styles.titulo}>Productos Destacados</Text>

      {/* Cuadrícula de Productos */}
      <View style={styles.productosContainer}>
        <FlatList
          data={productosFiltrados}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const nombreProd = item.nombre || item.Nombre;
           const precioProd = `C$ ${item.precio || item.Precio}`;
            const stockProd = item.stock !== undefined ? `Stock: ${item.stock}` : '';
            const imagenProd = item.imagen || item.Imagen || 'https://via.placeholder.com/150';
            const descProd = item.descripcion || item.Descripcion || 'Sin descripción disponible.';

            return (
              <View style={styles.productWrapper}>
                <Producto
                  nombre={nombreProd}
                  precio={precioProd}
                  categoria={stockProd}
                  imagen={imagenProd}
                />
                
               
    <TouchableOpacity 
  style={styles.botonVerDetalle} 
  onPress={() => navigation.navigate('DetalleProducto', { producto: item })} // <--- AQUÍ VA
>
  <Text style={styles.textoBotonDetalle}>Ver detalle</Text>
</TouchableOpacity>
              </View>
            );
          }}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnas}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1, 
    backgroundColor: '#F5F7FA', 
    padding: 16
  },
  buscador: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E0E0E0'
  },
  input: {
    flex: 1, 
    marginLeft: 8, 
    fontSize: 14, 
    color: '#333'
  },
  subtituloSeccion: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 10
  },
  categorias: {
    marginBottom: 15
  },
  linea: {
    height: 1, 
    backgroundColor: '#E0E0E0', 
    marginVertical: 10
  },
  titulo: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#222', 
    marginBottom: 15
  },
  productosContainer: {
    paddingBottom: 20
  },
  columnas: {
    justifyContent: 'space-between',
    marginBottom: 15
  },
  productWrapper: {
    width: '48%', 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2,
    justifyContent: 'space-between'
  },
  botonVerDetalle: {
    backgroundColor: '#3F51B5', 
    borderRadius: 8, 
    paddingVertical: 10, 
    alignItems: 'center', 
    marginTop: 10
  },
  textoBotonDetalle: {
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 13
  }
});

export default Catalogo;