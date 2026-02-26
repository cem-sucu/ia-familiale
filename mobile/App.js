import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Données de démonstration — le message de maman envoyé à 15h mais livré à 18h05
const MESSAGES_DEMO = [
  {
    id: '1',
    sender: 'Maman',
    text: 'Achète du pain en rentrant 🍞',
    sentAt: '15:00',
    deliveredAt: '18:05',
    isMe: false,
  },
  {
    id: '2',
    sender: 'Moi',
    text: 'OK pas de problème ! 👍',
    sentAt: '18:06',
    deliveredAt: '18:06',
    isMe: true,
  },
];

export default function App() {
  const [messages, setMessages] = useState(MESSAGES_DEMO);
  const [input, setInput] = useState('');

  function envoyerMessage() {
    if (input.trim() === '') return;

    const nouveauMessage = {
      id: Date.now().toString(),
      sender: 'Moi',
      text: input,
      sentAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      deliveredAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages((prev) => [...prev, nouveauMessage]);
    setInput('');
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Famille 👨‍👩‍👦</Text>
        <Text style={styles.headerSubtitle}>3 membres connectés</Text>
      </View>

      {/* Liste des messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.bulle, item.isMe ? styles.bulleNous : styles.bulleEux]}>
            {/* Nom de l'expéditeur (uniquement pour les autres) */}
            {!item.isMe && <Text style={styles.expediteur}>{item.sender}</Text>}

            {/* Texte du message */}
            <Text style={styles.texteMessage}>{item.text}</Text>

            {/* Horodatage */}
            <View style={styles.horodatage}>
              <Text style={styles.texteHeure}>Envoyé {item.sentAt}</Text>
              {item.sentAt !== item.deliveredAt && (
                <Text style={styles.texteDelai}> · Reçu {item.deliveredAt} ⏰</Text>
              )}
            </View>
          </View>
        )}
      />

      {/* Zone de saisie */}
      <View style={styles.zoneInput}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor="#999"
          onSubmitEditing={envoyerMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.boutonEnvoyer} onPress={envoyerMessage}>
          <Text style={styles.texteEnvoyer}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const VIOLET = '#6C63FF';
const GRIS_CLAIR = '#F0F0F5';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // En-tête
  header: {
    backgroundColor: VIOLET,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },

  // Liste
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Bulles de message
  bulle: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 12,
  },
  bulleEux: {
    backgroundColor: GRIS_CLAIR,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bulleNous: {
    backgroundColor: VIOLET,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  expediteur: {
    fontSize: 12,
    fontWeight: 'bold',
    color: VIOLET,
    marginBottom: 4,
  },
  texteMessage: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 21,
  },

  // Pour nos messages, texte en blanc
  bulleNous_texte: {
    color: '#fff',
  },

  // Horodatage
  horodatage: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  texteHeure: {
    fontSize: 11,
    color: '#999',
  },
  texteDelai: {
    fontSize: 11,
    color: '#E67E22',
    fontWeight: '600',
  },

  // Zone de saisie
  zoneInput: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: GRIS_CLAIR,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A2E',
  },
  boutonEnvoyer: {
    backgroundColor: VIOLET,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  texteEnvoyer: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
