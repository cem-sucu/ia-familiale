import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { COLORS } from '../constants/colors';
import { MESSAGES_DEMO } from '../data/demo';

export default function ChatScreen() {
  const [messages, setMessages] = useState(MESSAGES_DEMO);
  const [input, setInput] = useState('');

  function envoyerMessage() {
    if (input.trim() === '') return;

    const maintenant = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const nouveauMessage = {
      id: Date.now().toString(),
      sender: 'Moi',
      text: input,
      sentAt: maintenant,
      deliveredAt: maintenant,
      isMe: true,
    };

    setMessages((prev) => [...prev, nouveauMessage]);
    setInput('');
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitre}>Famille 👨‍👩‍👦</Text>
        <Text style={styles.headerSousTitre}>3 membres connectés</Text>
      </View>

      {/* Liste des messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        renderItem={({ item }) => (
          <MessageBubble
            sender={item.sender}
            text={item.text}
            sentAt={item.sentAt}
            deliveredAt={item.deliveredAt}
            isMe={item.isMe}
          />
        )}
      />

      {/* Zone de saisie */}
      <MessageInput
        value={input}
        onChange={setInput}
        onEnvoyer={envoyerMessage}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fond,
  },
  header: {
    backgroundColor: COLORS.violet,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitre: {
    color: COLORS.blanc,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSousTitre: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  liste: {
    padding: 16,
    gap: 12,
  },
});
