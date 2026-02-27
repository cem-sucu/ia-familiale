import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/colors';
import CercleScreen from './src/screens/CercleScreen';
import ChatScreen from './src/screens/ChatScreen';
import LoginScreen from './src/screens/LoginScreen';
import { demanderPermission } from './src/services/notifications';
import { supabase } from './src/services/supabase';

const Stack = createNativeStackNavigator();

export default function App() {
  // undefined = vérification en cours, null = non connecté, objet = connecté
  const [session, setSession]       = useState(undefined);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    demanderPermission();

    // Récupère la session persistée (AsyncStorage) au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChargement(false);
    });

    // Écoute les changements d'auth : login, logout, refresh du token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Spinner de démarrage le temps de vérifier la session
  if (chargement) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fond }}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            // Connecté → vérifie le cercle, puis chat
            <>
              <Stack.Screen name="Cercle" component={CercleScreen} />
              <Stack.Screen name="Chat"   component={ChatScreen} />
            </>
          ) : (
            // Non connecté → login / register
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
