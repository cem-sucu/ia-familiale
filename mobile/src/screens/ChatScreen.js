import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FamilleModal from '../components/FamilleModal';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import MonEtat from '../components/MonEtat';
import { COLORS } from '../constants/colors';
import { ETAT_DEFAUT } from '../constants/etats';
import { TRIGGER_DEFAUT } from '../constants/triggers';
import { changerEtat, envoyerMessageAPI, getMembres, getTousMessages } from '../services/api';
import { afficherNotification } from '../services/notifications';

export default function ChatScreen({ route }) {
  const { membreId: MON_ID, membreNom } = route.params;

  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [trigger, setTrigger]           = useState(TRIGGER_DEFAUT);
  const [etat, setEtat]                 = useState(ETAT_DEFAUT);
  const [chargement, setChargement]     = useState(true);
  const [membres, setMembres]           = useState([]);
  const [destinataireId, setDestinataire] = useState(null);
  const [voirFamille, setVoirFamille]   = useState(false);

  // Les autres membres (tout le monde sauf moi) → pour envoyer et pour le modal
  const autresMembres = membres.filter(m => m.id !== MON_ID);

  useEffect(() => {
    chargerTout();
  }, []);

  // Quand les membres sont chargés, on sélectionne le premier par défaut
  useEffect(() => {
    if (autresMembres.length > 0 && !destinataireId) {
      setDestinataire(autresMembres[0].id);
    }
  }, [membres]);

  async function chargerTout() {
    await Promise.all([chargerMessages(), chargerMembres()]);
  }

  async function chargerMessages() {
    try {
      setChargement(true);
      const data = await getTousMessages(MON_ID);
      setMessages(data.map(adapterMessage));
    } catch (erreur) {
      console.error('Impossible de charger les messages :', erreur);
    } finally {
      setChargement(false);
    }
  }

  async function chargerMembres() {
    try {
      const data = await getMembres();
      setMembres(data);
    } catch (erreur) {
      console.error('Impossible de charger les membres :', erreur);
    }
  }

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
      await chargerMessages();
      if (resultat.messages_livres > 0) {
        const messagesLivres = messages.filter(m => m.statut === 'en_attente' && !m.isMe);
        for (const msg of messagesLivres) {
          await afficherNotification(msg.sender, msg.text);
        }
      }
    } catch (erreur) {
      console.error('Erreur changement état :', erreur);
    }
  }

  async function envoyerMessage() {
    if (input.trim() === '' || !destinataireId) return;

    const texte = input;
    setInput('');
    setTrigger(TRIGGER_DEFAUT);

    try {
      await envoyerMessageAPI(MON_ID, destinataireId, texte, trigger);
      await chargerMessages();
    } catch (erreur) {
      console.error('Erreur envoi message :', erreur);
    }
  }

  function ouvrirFamille() {
    // Rafraîchit les états avant d'ouvrir le modal
    chargerMembres();
    setVoirFamille(true);
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerContenu}>
          <View>
            <Text style={styles.headerTitre}>Famille 👨‍👩‍👦</Text>
            <Text style={styles.headerSousTitre}>Connecté : {membreNom}</Text>
          </View>
          {/* Bouton "voir la famille" */}
          <TouchableOpacity style={styles.boutonFamille} onPress={ouvrirFamille}>
            <Text style={styles.boutonFamilleTexte}>👁 Famille</Text>
          </TouchableOpacity>
        </View>
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
        autresMembres={autresMembres}
        destinataireId={destinataireId}
        onDestinataireChange={setDestinataire}
      />

      {/* Modal famille */}
      <FamilleModal
        visible={voirFamille}
        membres={membres}
        onFermer={() => setVoirFamille(false)}
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
  },
  headerContenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  boutonFamille: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  boutonFamilleTexte: {
    color: COLORS.blanc,
    fontWeight: '600',
    fontSize: 13,
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
