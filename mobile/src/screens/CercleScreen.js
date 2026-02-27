import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { creerCircle, getCircles, rejoindreCircle } from '../services/api';
import { supabase } from '../services/supabase';

export default function CercleScreen({ navigation }) {
  const [chargement, setChargement]   = useState(true);
  const [mode, setMode]               = useState(null);   // null | 'creer' | 'rejoindre'
  const [nomCercle, setNomCercle]     = useState('');
  const [token, setToken]             = useState('');
  const [erreur, setErreur]           = useState('');
  const [enCours, setEnCours]         = useState(false);

  useEffect(() => {
    verifierCercle();
  }, []);

  // Vérifie si l'utilisateur est déjà dans un cercle → ChatScreen directement
  async function verifierCercle() {
    try {
      const cercles = await getCircles();
      if (cercles.length > 0) {
        allerAuChat(cercles[0]);
      }
    } catch (e) {
      console.error('Erreur vérification cercle :', e);
    } finally {
      setChargement(false);
    }
  }

  async function allerAuChat(cercle) {
    const { data: { session } } = await supabase.auth.getSession();
    const profil = await import('../services/api').then(api => api.getProfil());
    navigation.replace('Chat', {
      membreId: session.user.id,
      membreNom: profil.nom,
      circleId: cercle.id,
    });
  }

  async function handleCreerCercle() {
    if (!nomCercle.trim()) {
      setErreur('Entre un nom pour ton cercle.');
      return;
    }
    setErreur('');
    setEnCours(true);
    try {
      const cercle = await creerCircle(nomCercle.trim());
      await allerAuChat(cercle);
    } catch (e) {
      setErreur("Impossible de créer le cercle. Réessaie.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleRejoindre() {
    if (!token.trim()) {
      setErreur('Entre le code d\'invitation.');
      return;
    }
    setErreur('');
    setEnCours(true);
    try {
      const result = await rejoindreCircle(token.trim());
      await allerAuChat({ id: result.circle_id, nom: result.nom });
    } catch (e) {
      setErreur("Code invalide ou déjà utilisé.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleDeconnexion() {
    await supabase.auth.signOut();
    // App.js détecte le changement de session → retour à LoginScreen
  }

  if (chargement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centrer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.titre}>Ton cercle familial 👨‍👩‍👦</Text>
        <Text style={styles.sousTitre}>Crée ou rejoins un cercle</Text>
      </View>

      <View style={styles.contenu}>

        {mode === null && (
          <>
            <Text style={styles.description}>
              Un cercle familial regroupe tous les membres de ta famille.
              Crée-en un ou rejoins-en un existant via un code d'invitation.
            </Text>

            <TouchableOpacity style={styles.boutonPrimaire} onPress={() => setMode('creer')}>
              <Text style={styles.boutonPrimaireTexte}>🏠 Créer mon cercle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.boutonSecondaire} onPress={() => setMode('rejoindre')}>
              <Text style={styles.boutonSecondaireTexte}>🔑 J'ai un code d'invitation</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.lienDeconnexion} onPress={handleDeconnexion}>
              <Text style={styles.lienDeconnexionTexte}>Se déconnecter</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'creer' && (
          <>
            <Text style={styles.label}>Nom du cercle</Text>
            <TextInput
              style={styles.champ}
              placeholder="ex: Famille Sucu"
              placeholderTextColor={COLORS.texteClair}
              value={nomCercle}
              onChangeText={setNomCercle}
              autoCapitalize="words"
            />

            {erreur !== '' && <Text style={styles.erreur}>{erreur}</Text>}

            <TouchableOpacity
              style={[styles.boutonPrimaire, enCours && styles.boutonDesactive]}
              onPress={handleCreerCercle}
              disabled={enCours}
            >
              {enCours
                ? <ActivityIndicator color={COLORS.blanc} />
                : <Text style={styles.boutonPrimaireTexte}>Créer le cercle</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.lien} onPress={() => { setMode(null); setErreur(''); }}>
              <Text style={styles.lienTexte}>← Retour</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'rejoindre' && (
          <>
            <Text style={styles.label}>Code d'invitation</Text>
            <TextInput
              style={styles.champ}
              placeholder="Colle le code ici"
              placeholderTextColor={COLORS.texteClair}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {erreur !== '' && <Text style={styles.erreur}>{erreur}</Text>}

            <TouchableOpacity
              style={[styles.boutonPrimaire, enCours && styles.boutonDesactive]}
              onPress={handleRejoindre}
              disabled={enCours}
            >
              {enCours
                ? <ActivityIndicator color={COLORS.blanc} />
                : <Text style={styles.boutonPrimaireTexte}>Rejoindre</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.lien} onPress={() => { setMode(null); setErreur(''); }}>
              <Text style={styles.lienTexte}>← Retour</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fond,
  },
  centrer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: COLORS.violet,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  titre: {
    color: COLORS.blanc,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sousTitre: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginTop: 6,
  },
  contenu: {
    padding: 24,
    gap: 16,
  },
  description: {
    color: COLORS.texteClair,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.texte,
  },
  champ: {
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.texte,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  erreur: {
    color: '#E74C3C',
    fontSize: 13,
    textAlign: 'center',
  },
  boutonPrimaire: {
    backgroundColor: COLORS.violet,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  boutonPrimaireTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
  },
  boutonSecondaire: {
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.violet,
  },
  boutonSecondaireTexte: {
    color: COLORS.violet,
    fontSize: 16,
    fontWeight: '600',
  },
  boutonDesactive: {
    opacity: 0.6,
  },
  lien: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  lienTexte: {
    color: COLORS.violet,
    fontSize: 14,
    fontWeight: '500',
  },
  lienDeconnexion: {
    alignItems: 'center',
    marginTop: 16,
  },
  lienDeconnexionTexte: {
    color: COLORS.texteClair,
    fontSize: 13,
  },
});
