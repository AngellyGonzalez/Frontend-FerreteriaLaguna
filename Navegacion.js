import { NavigationContainer } from "@react-navigation/native"; 
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; 
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { Ionicons } from "@expo/vector-icons"; 
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
options={{ title: "Detalle del producto" }} /> 
</Stack.Navigator> 
); 
} 
// NAVEGACIÓN PRINCIPAL 
export default function Navegacion() { 
return ( 
<NavigationContainer> 
<Tab.Navigator 
screenOptions={{ 
headerShown: false, 
}} 
> 
{/* TAB CATÁLOGO */} 
<Tab.Screen 
name="CatalogoTab" 
component={CatalogoStack} 
options={{ 
title: 'Catálogo', 
tabBarIcon: ({ color, size }) => ( 
<Ionicons 
name="albums-outline" 
size={size} 
color={color} 
/> 
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
<Ionicons 
name="information-circle-outline" 
size={size} 
color={color} 
/> 
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
<Ionicons 
name="heart-outline" 
size={size} 
color={color} 
/> 
), 
}} 
/> 
</Tab.Navigator> 
</NavigationContainer> 
); 
}
