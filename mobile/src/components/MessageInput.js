import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { TRIGGERS } from '../constants/triggers';

export default function MessageInput({
  value, onChange, onEnvoyer,
  trigger, onTriggerChange,
  autresMembres, destinataireId, onDestinataireChange,
}) {
  return (
    <View style={styles.container}>

      {/* Ligne 1 : sélection du destinataire "À :" */}
      {autresMembres.length > 0 && (
        <View style={styles.destinataireLigne}>
          <Text style={styles.destinataireLabel}>À :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.destinataireChips}>
              {autresMembres.map(m => {
                const estSelectionne = destinataireId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.destChip, estSelectionne && styles.destChipActif]}
                    onPress={() => onDestinataireChange(m.id)}
                  >
                    <Text style={[styles.destChipTexte, estSelectionne && styles.destChipTexteActif]}>
                      {m.nom}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Ligne 2 : chips de sélection du déclencheur */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {TRIGGERS.map((t) => {
          const estActif = trigger === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, estActif && styles.chipActif]}
              onPress={() => onTriggerChange(t.id)}
            >
              <Text style={[styles.chipTexte, estActif && styles.chipTexteActif]}>
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Ligne 3 : zone de texte + bouton envoyer */}
      <View style={styles.inputLigne}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="Écrire un message..."
          placeholderTextColor={COLORS.texteClair}
          onSubmitEditing={onEnvoyer}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.bouton} onPress={onEnvoyer}>
          <Text style={styles.texteBouton}>Envoyer</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: COLORS.bordure,
    backgroundColor: COLORS.blanc,
    paddingBottom: 8,
  },
  // Destinataire
  destinataireLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  destinataireLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.texteClair,
  },
  destinataireChips: {
    flexDirection: 'row',
    gap: 8,
  },
  destChip: {
    borderWidth: 1.5,
    borderColor: COLORS.bordure,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: COLORS.blanc,
  },
  destChipActif: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet,
  },
  destChipTexte: {
    fontSize: 13,
    color: COLORS.texte,
    fontWeight: '500',
  },
  destChipTexteActif: {
    color: COLORS.blanc,
    fontWeight: '600',
  },
  // Triggers
  chipsContainer: {
    paddingTop: 8,
  },
  chipsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.bordure,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.blanc,
  },
  chipActif: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet,
  },
  chipTexte: {
    fontSize: 13,
    color: COLORS.texte,
    fontWeight: '500',
  },
  chipTexteActif: {
    color: COLORS.blanc,
    fontWeight: '600',
  },
  // Input
  inputLigne: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.grisClair,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.texte,
  },
  bouton: {
    backgroundColor: COLORS.violet,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  texteBouton: {
    color: COLORS.blanc,
    fontWeight: '600',
    fontSize: 14,
  },
});
