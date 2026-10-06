import { NavigationContainer } from "@react-navigation/native"; 
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; 
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { Ionicons } from "@expo/vector-icons"; 


import Registro from "./screens/Registro"; 
import Login from './screens/Login'; 
import Catalogo from "./screens/Catalogo"; 
import DetalleProducto from "./screens/DetalleProducto"; 
import Carrito from './screens/Carrito';
import Pedidos from './screens/Pedidos';
import Perfil from './screens/Perfil';

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
        name="DetalleProducto" // <--- Cámbialo aquí para que coincida
        component={DetalleProducto} 
        options={{ title: "Detalle del producto" }} 
      /> 
    </Stack.Navigator> 
  ); 
}

// TABS PRINCIPALES (Catálogo, Carrito, Pedidos, Perfil)
function HomeTabs() {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#1E88E5', 
        tabBarInactiveTintColor: '#888',
      }}
    >
      {/* TAB CATÁLOGO */} 
      <Tab.Screen 
        name="CatalogoTab" 
        component={CatalogoStack} 
        options={{ 
          title: 'Catálogo', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="grid-outline" size={size} color={color} /> 
          ), 
        }} 
      /> 

      {/*  TAB CARRITO */} 
      <Tab.Screen 
        name="CarritoTab" 
        component={Carrito} 
        options={{ 
          title: 'Carrito', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="cart-outline" size={size} color={color} /> 
          ), 
        }} 
      /> 

      {/* TAB PEDIDOS */} 
      <Tab.Screen 
        name="PedidosTab" 
        component={Pedidos} 
        options={{ 
          title: 'Pedidos', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="clipboard-outline" size={size} color={color} /> 
          ), 
        }} 
      /> 

      {/* TAB PERFIL */} 
      <Tab.Screen 
        name="PerfilTab" 
        component={Perfil} 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="person-outline" size={size} color={color} /> 
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
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        
        {/* Pantalla de Iniciar Sesión */}
        <Stack.Screen name="Login" component={Login} />

        {/* Pantalla de Registro */}
        <Stack.Screen name="Registro" component={Registro} options={{ headerShown: true, title: "Crear Cuenta" }} />
        
        {/* Pantalla Principal con Pestañas */}
        <Stack.Screen name="HomeTabs" component={HomeTabs} />

      </Stack.Navigator> 
    </NavigationContainer> 
  ); 
}