import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';

// La barre de saisie en bas de l'écran
// Props :
//   value      → texte actuellement écrit
//   onChange   → appelé quand l'utilisateur tape
//   onEnvoyer  → appelé quand l'utilisateur appuie sur Envoyer
export default function MessageInput({ value, onChange, onEnvoyer }) {
  return (
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordure,
    backgroundColor: COLORS.blanc,
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
