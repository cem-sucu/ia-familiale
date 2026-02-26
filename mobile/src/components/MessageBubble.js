import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

// Une bulle de message
// Props :
//   sender      → nom de l'expéditeur (ex: "Maman")
//   text        → contenu du message
//   sentAt      → heure d'envoi (ex: "15:00")
//   deliveredAt → heure de livraison (ex: "18:05")
//   isMe        → true si c'est MOI qui ai envoyé
export default function MessageBubble({ sender, text, sentAt, deliveredAt, isMe }) {
  const estDiffere = sentAt !== deliveredAt;

  return (
    <View style={[styles.bulle, isMe ? styles.bulleNous : styles.bulleEux]}>

      {/* Nom de l'expéditeur — uniquement pour les autres membres */}
      {!isMe && <Text style={styles.expediteur}>{sender}</Text>}

      {/* Texte du message */}
      <Text style={[styles.texte, isMe && styles.texteNous]}>
        {text}
      </Text>

      {/* Horodatage */}
      <View style={styles.horodatage}>
        <Text style={[styles.heure, isMe && styles.heureNous]}>
          Envoyé {sentAt}
        </Text>
        {estDiffere && (
          <Text style={styles.delai}> · Reçu {deliveredAt} ⏰</Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  bulle: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 12,
  },
  bulleEux: {
    backgroundColor: COLORS.grisClair,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bulleNous: {
    backgroundColor: COLORS.violet,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  expediteur: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.violet,
    marginBottom: 4,
  },
  texte: {
    fontSize: 15,
    color: COLORS.texte,
    lineHeight: 21,
  },
  texteNous: {
    color: COLORS.blanc,
  },
  horodatage: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  heure: {
    fontSize: 11,
    color: COLORS.texteClair,
  },
  heureNous: {
    color: 'rgba(255,255,255,0.65)',
  },
  delai: {
    fontSize: 11,
    color: COLORS.delai,
    fontWeight: '600',
  },
});
