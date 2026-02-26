import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { getMembres } from '../services/api';

export default function ProfilScreen({ navigation }) {
  const [membres, setMembres] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerMembres();
  }, []);

  async function chargerMembres() {
    try {
      const data = await getMembres();
      setMembres(data);
    } catch (erreur) {
      console.error('Impossible de charger les membres :', erreur);
    } finally {
      setChargement(false);
    }
  }

  function choisirMembre(membre) {
    navigation.navigate('Chat', { membreId: membre.id, membreNom: membre.nom });
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.titre}>IA Familiale</Text>
        <Text style={styles.sousTitre}>Qui es-tu ?</Text>
      </View>

      {chargement ? (
        <View style={styles.centrer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      ) : (
        <FlatList
          data={membres}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.liste}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.carte} onPress={() => choisirMembre(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexte}>
                  {item.nom.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.nom}>{item.nom}</Text>
              <Text style={styles.fleche}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

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
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  titre: {
    color: COLORS.blanc,
    fontSize: 28,
    fontWeight: 'bold',
  },
  sousTitre: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 8,
  },
  liste: {
    padding: 20,
    gap: 12,
  },
  carte: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexte: {
    color: COLORS.blanc,
    fontSize: 20,
    fontWeight: 'bold',
  },
  nom: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.texte,
  },
  fleche: {
    fontSize: 24,
    color: COLORS.texteClair,
  },
  centrer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
