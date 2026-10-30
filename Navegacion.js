import { NavigationContainer } from "@react-navigation/native"; 
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; 
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { Ionicons } from "@expo/vector-icons"; 
import { AppAlertProvider } from './components/AppAlert';


import Registro from "./screens/Registro"; 
import Login from './screens/Login'; 
import Catalogo from "./screens/Catalogo"; 
import DetalleProducto from "./screens/DetalleProducto"; 
import Carrito from './screens/Carrito';
import Pedidos from './screens/Pedidos';
import Perfil from './screens/Perfil';
import FinalizarPedido from './screens/FinalizarPedido';
import LoginAdmin from './screens/LoginAdmin';
import VistaAdmin from './screens/VistaAdmin';           
import AdminPedidos from './screens/AdminPedidos';
import NuevoProductoScreen from './screens/nuevoProducto';

const Tab = createBottomTabNavigator(); 
const Stack = createNativeStackNavigator();

function AdminStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0B2E59',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen
        name="AdminPedidos"
        component={AdminPedidos}
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="VistaAdmin"
        component={VistaAdmin}
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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

function CarritoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Carrito"
        component={Carrito}
        options={{ title: 'Mi Carrito (0)' }}
      />
    </Stack.Navigator>
  );
}

function PedidosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Pedidos"
        component={Pedidos}
        options={{ title: 'Mis Pedidos' }}
      />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Perfil"
        component={Perfil}
        options={{ title: 'Mi perfil' }}
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
        tabBarActiveTintColor: '#0B2E59',
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
        component={CarritoStack}
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
        component={PedidosStack}
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
        component={PerfilStack}
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
    <AppAlertProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          {/* Pantalla de Iniciar Sesión */}
          <Stack.Screen name="Login" component={Login} />

          {/* Pantalla de Registro */}
          <Stack.Screen name="Registro" component={Registro} options={{ headerShown: true, title: "Crear Cuenta" }} />

          {/* Pantalla Principal con Pestañas */}
          <Stack.Screen name="HomeTabs" component={HomeTabs} />

          {/* PANTALLAS DE ADMINISTRACIÓN */}
          <Stack.Screen name="LoginAdmin" component={LoginAdmin} options={{ headerShown: false }} />
          <Stack.Screen name="PanelAdmin" component={AdminStack} options={{ headerShown: false }} />
          <Stack.Screen name="nuevoProducto" component={NuevoProductoScreen} options={{ headerShown: true, title: "Gestión de Producto" }} />

          <Stack.Screen
            name="FinalizarPedido"
            component={FinalizarPedido}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppAlertProvider>
  ); 
}