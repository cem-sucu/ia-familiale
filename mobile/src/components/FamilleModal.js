import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { ETATS } from '../constants/etats';

// Modal qui affiche d'un coup d'œil tous les membres et leur état actuel
export default function FamilleModal({ visible, membres, onFermer }) {

  function getInfoEtat(etatId) {
    return ETATS.find(e => e.id === etatId) ?? { label: etatId, icon: '❓', couleur: COLORS.texteClair };
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.overlay}>
        <View style={styles.panneau}>

          <Text style={styles.titre}>La famille 👨‍👩‍👦</Text>

          {membres.map(m => {
            const { label, icon, couleur } = getInfoEtat(m.etat);
            return (
              <View key={m.id} style={styles.ligne}>
                {/* Avatar avec la première lettre du prénom */}
                <View style={[styles.avatar, { backgroundColor: couleur }]}>
                  <Text style={styles.avatarTexte}>{m.nom.charAt(0).toUpperCase()}</Text>
                </View>

                {/* Prénom */}
                <Text style={styles.nom}>{m.nom}</Text>

                {/* Badge d'état coloré */}
                <View style={[styles.badge, { backgroundColor: couleur + '22' }]}>
                  <Text style={[styles.badgeTexte, { color: couleur }]}>
                    {icon} {label}
                  </Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.boutonFermer} onPress={onFermer}>
            <Text style={styles.texteFermer}>Fermer</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panneau: {
    backgroundColor: COLORS.blanc,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  titre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.texte,
    marginBottom: 4,
    textAlign: 'center',
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexte: {
    color: COLORS.blanc,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nom: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.texte,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexte: {
    fontSize: 13,
    fontWeight: '600',
  },
  boutonFermer: {
    backgroundColor: COLORS.grisClair,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  texteFermer: {
    color: COLORS.texte,
    fontWeight: '600',
    fontSize: 15,
  },
});
