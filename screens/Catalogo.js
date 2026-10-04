import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, ScrollView } from "react-native";
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
      // Corregido a minúscula tal como lo tienes en Firebase
      const querySnapshot = await getDocs(collection(db, "categorias")); 
      console.log("Total categorías encontradas:", querySnapshot.size);
      
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
      // Corregido a minúscula tal como lo tienes en Firebase
      const querySnapshot = await getDocs(collection(db, "productos")); 
      console.log("Total productos encontrados:", querySnapshot.size);
      
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
        where("categoriaId", "==", idCategoriaNumerico) 
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
          renderItem={({ item }) => (
            <View style={styles.productWrapper}>
              <Producto
                nombre={item.nombre || item.Nombre}
                precio={`${item.precio || item.Precio}`}
                categoria={item.stock !== undefined ? `Stock: ${item.stock}` : ''}
                imagen={item.imagen || item.Imagen || 'https://via.placeholder.com/150'}
                onPress={() => navigation.navigate('Detalle', { 
                  nombre: item.nombre || item.Nombre, 
                  precio: item.precio || item.Precio, 
                  stock: item.stock || item.Stock,
                  imagen: item.imagen || item.Imagen || 'https://via.placeholder.com/150',
                  descripcion: item.descripcion || item.Descripcion || 'Sin descripción disponible.'
                })}
              />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal={false}
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  buscador: {
    height: 50,
    backgroundColor: "#F5F4FC",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E1E1E8",
  },
  input: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: "#333",
  },
  subtituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
    marginTop: 5,
  },
  categorias: {
    marginBottom: 15,
  },
  linea: {
    height: 1,
    backgroundColor: "#E1E1E8",
    marginHorizontal: -15,
    marginBottom: 5,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginTop: 10,
    marginBottom: 15,
  },
  productosContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  columnas: {
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: '48%',
    marginBottom: 15,
  },
});

export default Catalogo;