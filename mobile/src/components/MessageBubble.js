import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { TRIGGERS } from '../constants/triggers';

function getTrigger(id) {
  return TRIGGERS.find((t) => t.id === id);
}

// Extrait juste l'heure depuis "2026-02-27T14:32" → "14:32"
// (pas de new Date() pour éviter les problèmes Hermes/React Native)
function formaterDate(isoStr) {
  if (!isoStr) return '';
  const timePart = isoStr.split('T')[1];
  return timePart ? timePart.substring(0, 5) : '';
}

export default function MessageBubble({ sender, text, sentAt, deliveredAt, trigger, statut, isMe, onModifier, onAnnuler }) {
  const estEnAttente = statut === 'en_attente';
  const estAnnule   = statut === 'annule';
  const estDiffere  = deliveredAt && sentAt !== deliveredAt;
  const infoDeclencheur = getTrigger(trigger);

  return (
    <View style={[
      styles.bulle,
      isMe ? styles.bulleNous : styles.bulleEux,
      estEnAttente && styles.bulleEnAttente,
      estAnnule    && styles.bulleAnnule,
    ]}>

      {/* Nom de l'expéditeur */}
      {!isMe && (
        <Text style={[styles.expediteur, estEnAttente && styles.expediteurAttente]}>
          {sender}
        </Text>
      )}

      {/* Badge déclencheur */}
      {trigger !== 'maintenant' && infoDeclencheur && !estAnnule && (
        <View style={[styles.badge, isMe && !estEnAttente && styles.badgeNous]}>
          <Text style={[styles.badgeTexte, isMe && !estEnAttente && styles.badgeTexteNous]}>
            {infoDeclencheur.icon} {infoDeclencheur.label}
          </Text>
        </View>
      )}

      {/* Texte du message */}
      <Text style={[
        styles.texte,
        isMe && !estEnAttente && !estAnnule && styles.texteNous,
        estAnnule && styles.texteAnnule,
      ]}>
        {text}
      </Text>

      {/* Horodatage ou indicateur d'attente */}
      <View style={styles.horodatage}>
        {estAnnule ? (
          <Text style={styles.annule}>Message annulé</Text>
        ) : estEnAttente ? (
          <Text style={styles.enAttente}>⏳ En attente de livraison...</Text>
        ) : (
          <>
            <Text style={[styles.heure, isMe && styles.heureNous]}>
              Envoyé {formaterDate(sentAt)}
            </Text>
            {estDiffere && (
              <Text style={styles.delai}> · Reçu {formaterDate(deliveredAt)} ⏰</Text>
            )}
          </>
        )}
      </View>

      {/* Boutons modifier / annuler — uniquement sur mes messages en attente */}
      {isMe && estEnAttente && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.boutonAction} onPress={() => onModifier && onModifier()}>
            <Text style={styles.boutonActionTexte}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boutonAction, styles.boutonAnnuler]} onPress={() => onAnnuler && onAnnuler()}>
            <Text style={[styles.boutonActionTexte, styles.boutonAnnulerTexte]}>✕ Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

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
  // Message en attente : fond blanc avec bordure pointillée
  bulleEnAttente: {
    backgroundColor: '#FFFBF0',
    borderWidth: 1.5,
    borderColor: '#F39C12',
    borderStyle: 'dashed',
  },
  expediteur: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.violet,
    marginBottom: 4,
  },
  expediteurAttente: {
    color: '#E67E22',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeNous: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeTexte: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.violet,
  },
  badgeTexteNous: {
    color: COLORS.blanc,
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
  enAttente: {
    fontSize: 11,
    color: '#E67E22',
    fontStyle: 'italic',
  },
  // Message annulé
  bulleAnnule: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'solid',
    opacity: 0.7,
  },
  texteAnnule: {
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
  annule: {
    fontSize: 11,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  // Boutons modifier / annuler
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  boutonAction: {
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  boutonAnnuler: {
    backgroundColor: 'rgba(231,76,60,0.1)',
  },
  boutonActionTexte: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.violet,
  },
  boutonAnnulerTexte: {
    color: '#E74C3C',
  },
});
