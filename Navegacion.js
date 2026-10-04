import { NavigationContainer } from "@react-navigation/native"; 
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; 
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { Ionicons } from "@expo/vector-icons"; 

// <<< AGREGAR: Importar tu pantalla de Registro (ajusta la ruta según donde la tengas guardada)
import Registro from "./screens/Registro"; 

import Catalogo from "./screens/Catalogo"; 
import DetalleProducto from "./screens/DetalleProducto"; 
import AcercaDe from "./screens/AcercaDe"; 
import Favoritos from "./screens/Favoritos"; 

const Tab = createBottomTabNavigator(); 
const Stack = createNativeStackNavigator();

// STACK DEL CATÁLOGO 
function CatalogoStack() { 
  return ( 
    <Stack.Navigator> 
      <Stack.Screen 
        name="Catalogo" 
        component={Catalogo} 
        options={{ title: "Catálogo" }} 
      /> 
      <Stack.Screen 
        name="Detalle" 
        component={DetalleProducto} 
        options={{ title: "Detalle del producto" }} 
      /> 
    </Stack.Navigator> 
  ); 
} 

// <<< AGREGAR: Envolver tus Tabs en una función llamada HomeTabs para ordenarlas dentro del Stack principal
function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {/* TAB CATÁLOGO */} 
      <Tab.Screen 
        name="CatalogoTab" 
        component={CatalogoStack} 
        options={{ 
          title: 'Catálogo', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="albums-outline" size={size} color={color} /> 
          ), 
        }} 
      /> 
      {/* TAB ACERCA DE */} 
      <Tab.Screen 
        name="AcercaDeTab"
        component={AcercaDe} 
        options={{ 
          title: 'Acerca De', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="information-circle-outline" size={size} color={color} /> 
          ), 
        }} 
      /> 
      {/* TAB FAVORITOS */} 
      <Tab.Screen 
        name="FavoritosTab" 
        component={Favoritos} 
        options={{ 
          title: 'Favoritos', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="heart-outline" size={size} color={color} /> 
          ), 
        }} 
      /> 
    </Tab.Navigator>
  );
}

// NAVEGACIÓN PRINCIPAL 
export default function Navegacion() { 
  return ( 
    <NavigationContainer> 
      {/* <<< MODIFICAR: Cambiamos el contenedor raíz para que sea un Stack con "Registro" como pantalla inicial */}
      <Stack.Navigator initialRouteName="Registro" screenOptions={{ headerShown: false }}>
        
        {/* <<< AGREGAR: La pantalla de Registro para que sea lo primero que vea el usuario */}
        <Stack.Screen name="Registro" component={Registro} />
        
        {/* <<< AGREGAR: El grupo de pestañas del catálogo al que se saltará después */}
        <Stack.Screen name="HomeTabs" component={HomeTabs} />

      </Stack.Navigator> 
    </NavigationContainer> 
  ); 
}