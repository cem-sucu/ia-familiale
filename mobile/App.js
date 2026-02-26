import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { demanderPermission } from './src/services/notifications';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {

  // Au démarrage : demande la permission de notifications
  useEffect(() => {
    demanderPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ChatScreen />
    </SafeAreaProvider>
  );
}
