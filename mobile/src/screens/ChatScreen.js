import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import MonEtat from '../components/MonEtat';
import { COLORS } from '../constants/colors';
import { DECLENCHEMENTS, ETAT_DEFAUT } from '../constants/etats';
import { TRIGGER_DEFAUT } from '../constants/triggers';
import { MESSAGES_DEMO } from '../data/demo';

export default function ChatScreen() {
  const [messages, setMessages] = useState(MESSAGES_DEMO);
  const [input, setInput] = useState('');
  const [trigger, setTrigger] = useState(TRIGGER_DEFAUT);
  const [etat, setEtat] = useState(ETAT_DEFAUT);

  // Appelé quand l'utilisateur change son état (ex: "Je pars du travail")
  function changerEtat(nouvelEtat) {
    setEtat(nouvelEtat);

    // Quel trigger faut-il déclencher avec ce nouvel état ?
    const triggerADeclencher = DECLENCHEMENTS[nouvelEtat];
    if (!triggerADeclencher) return;

    // On cherche l'heure actuelle pour la livraison
    const maintenant = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // On met à jour tous les messages en attente avec ce trigger
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.statut === 'en_attente' && msg.trigger === triggerADeclencher) {
          return {
            ...msg,
            statut: 'livre',
            deliveredAt: maintenant,
          };
        }
        return msg;
      })
    );
  }

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
      deliveredAt: trigger === 'maintenant' ? maintenant : null,
      trigger: trigger,
      statut: trigger === 'maintenant' ? 'livre' : 'en_attente',
      isMe: true,
    };

    setMessages((prev) => [...prev, nouveauMessage]);
    setInput('');
    setTrigger(TRIGGER_DEFAUT);
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitre}>Famille 👨‍👩‍👦</Text>
        <Text style={styles.headerSousTitre}>3 membres connectés</Text>
      </View>

      {/* Barre d'état de l'utilisateur */}
      <MonEtat etat={etat} onChangerEtat={changerEtat} />

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
            trigger={item.trigger}
            statut={item.statut}
            isMe={item.isMe}
          />
        )}
      />

      {/* Zone de saisie */}
      <MessageInput
        value={input}
        onChange={setInput}
        onEnvoyer={envoyerMessage}
        trigger={trigger}
        onTriggerChange={setTrigger}
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
