import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { demanderPermission } from './src/services/notifications';
import ChatScreen from './src/screens/ChatScreen';
import ProfilScreen from './src/screens/ProfilScreen';

const Stack = createNativeStackNavigator();

export default function App() {

  useEffect(() => {
    demanderPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Profil" component={ProfilScreen} />
          <Stack.Screen name="Chat"   component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
