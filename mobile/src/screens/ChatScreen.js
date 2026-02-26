import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import MonEtat from '../components/MonEtat';
import { COLORS } from '../constants/colors';
import { ETAT_DEFAUT } from '../constants/etats';
import { TRIGGER_DEFAUT } from '../constants/triggers';
import { changerEtat, envoyerMessageAPI, getTousMessages } from '../services/api';
import { afficherNotification } from '../services/notifications';

// L'identifiant de l'utilisateur courant (en dur pour l'instant)
const MON_ID = 'moi';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [trigger, setTrigger] = useState(TRIGGER_DEFAUT);
  const [etat, setEtat] = useState(ETAT_DEFAUT);
  const [chargement, setChargement] = useState(true);

  // Charge les messages depuis le serveur au démarrage
  useEffect(() => {
    chargerMessages();
  }, []);

  async function chargerMessages() {
    try {
      setChargement(true);
      const data = await getTousMessages(MON_ID);
      // On adapte le format du serveur au format de nos composants
      setMessages(data.map(adapterMessage));
    } catch (erreur) {
      console.error('Impossible de charger les messages :', erreur);
    } finally {
      setChargement(false);
    }
  }

  // Convertit le format serveur → format composants
  function adapterMessage(msg) {
    return {
      id:          msg.id,
      sender:      msg.expediteur_id,
      text:        msg.texte,
      sentAt:      msg.envoye_a,
      deliveredAt: msg.livre_a,
      trigger:     msg.trigger,
      statut:      msg.statut,
      isMe:        msg.expediteur_id === MON_ID,
    };
  }

  async function handleChangerEtat(nouvelEtat) {
    setEtat(nouvelEtat);
    try {
      const resultat = await changerEtat(MON_ID, nouvelEtat);

      // Recharge les messages pour voir les nouveaux livrés
      await chargerMessages();

      // Affiche une notification locale pour chaque message livré
      if (resultat.messages_livres > 0) {
        const messagesLivres = messages.filter(
          (m) => m.statut === 'en_attente' && !m.isMe
        );
        for (const msg of messagesLivres) {
          await afficherNotification(msg.sender, msg.text);
        }
      }
    } catch (erreur) {
      console.error('Erreur changement état :', erreur);
    }
  }

  async function envoyerMessage() {
    if (input.trim() === '') return;

    const texte = input;
    setInput('');
    setTrigger(TRIGGER_DEFAUT);

    try {
      await envoyerMessageAPI(MON_ID, MON_ID, texte, trigger);
      await chargerMessages();
    } catch (erreur) {
      console.error('Erreur envoi message :', erreur);
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitre}>Famille 👨‍👩‍👦</Text>
        <Text style={styles.headerSousTitre}>3 membres connectés</Text>
      </View>

      {/* Barre d'état */}
      <MonEtat etat={etat} onChangerEtat={handleChangerEtat} />

      {/* Messages ou indicateur de chargement */}
      {chargement ? (
        <View style={styles.centrer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.texteChargement}>Chargement des messages...</Text>
        </View>
      ) : (
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
      )}

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
  centrer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  texteChargement: {
    color: COLORS.texteClair,
    fontSize: 14,
  },
});
