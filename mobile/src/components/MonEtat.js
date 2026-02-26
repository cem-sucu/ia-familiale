import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { ETATS } from '../constants/etats';

// Barre d'état en haut — montre ton état actuel + boutons pour changer
// Props :
//   etat          → id de l'état actuel ('au_travail', 'en_route', 'a_la_maison')
//   onChangerEtat → appelé avec le nouvel id quand l'utilisateur appuie
export default function MonEtat({ etat, onChangerEtat }) {
  const etatActuel = ETATS.find((e) => e.id === etat);

  return (
    <View style={styles.container}>

      {/* État actuel */}
      <View style={styles.etatActuel}>
        <View style={[styles.point, { backgroundColor: etatActuel.couleur }]} />
        <Text style={styles.texteEtat}>
          {etatActuel.icon} {etatActuel.label}
        </Text>
      </View>

      {/* Boutons d'action — uniquement ceux qui sont différents de l'état actuel */}
      <View style={styles.boutons}>
        {ETATS.filter((e) => e.id !== etat).map((e) => (
          <TouchableOpacity
            key={e.id}
            style={[styles.bouton, { borderColor: e.couleur }]}
            onPress={() => onChangerEtat(e.id)}
          >
            <Text style={[styles.texteBouton, { color: e.couleur }]}>
              {e.icon} {e.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordure,
    flexWrap: 'wrap',
    gap: 8,
  },
  etatActuel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  point: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  texteEtat: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.texte,
  },
  boutons: {
    flexDirection: 'row',
    gap: 8,
  },
  bouton: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  texteBouton: {
    fontSize: 12,
    fontWeight: '600',
  },
});
