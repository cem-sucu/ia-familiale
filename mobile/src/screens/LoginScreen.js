import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { supabase } from '../services/supabase';

export default function LoginScreen() {
  const [mode, setMode]         = useState('login');  // 'login' | 'register'
  const [nom, setNom]           = useState('');
  const [email, setEmail]       = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur]     = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !motDePasse.trim()) {
      setErreur('Email et mot de passe requis.');
      return;
    }
    setErreur('');
    setChargement(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    });
    setChargement(false);
    if (error) setErreur(error.message);
    // Si succès, App.js détecte le changement de session et redirige automatiquement
  }

  async function handleRegister() {
    if (!nom.trim() || !email.trim() || !motDePasse.trim()) {
      setErreur('Tous les champs sont requis.');
      return;
    }
    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setErreur('');
    setChargement(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: motDePasse,
      options: {
        data: { nom: nom.trim() },
      },
    });
    setChargement(false);
    if (error) {
      setErreur(error.message);
    } else {
      setErreur('✅ Compte créé ! Connecte-toi maintenant.');
      setMode('login');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.titre}>IA Familiale 👨‍👩‍👦</Text>
          <Text style={styles.sousTitre}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formulaire}>

          {mode === 'register' && (
            <TextInput
              style={styles.champ}
              placeholder="Ton prénom (ex: Cem)"
              placeholderTextColor={COLORS.texteClair}
              value={nom}
              onChangeText={setNom}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.champ}
            placeholder="Email"
            placeholderTextColor={COLORS.texteClair}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.champ}
            placeholder="Mot de passe"
            placeholderTextColor={COLORS.texteClair}
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
          />

          {erreur !== '' && (
            <Text style={[styles.erreur, erreur.startsWith('✅') && styles.succes]}>
              {erreur}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.bouton, chargement && styles.boutonDesactive]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={chargement}
          >
            {chargement ? (
              <ActivityIndicator color={COLORS.blanc} />
            ) : (
              <Text style={styles.boutonTexte}>
                {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Basculer entre login et register */}
          <TouchableOpacity
            style={styles.lien}
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErreur('');
            }}
          >
            <Text style={styles.lienTexte}>
              {mode === 'login'
                ? "Pas encore de compte ? Créer un compte"
                : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fond,
  },
  inner: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.violet,
    paddingVertical: 48,
    paddingHorizontal: 24,
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
  formulaire: {
    padding: 24,
    gap: 14,
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
  succes: {
    color: '#27AE60',
  },
  bouton: {
    backgroundColor: COLORS.violet,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  boutonDesactive: {
    opacity: 0.6,
  },
  boutonTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
  },
  lien: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  lienTexte: {
    color: COLORS.violet,
    fontSize: 14,
    fontWeight: '500',
  },
});
