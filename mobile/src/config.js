import { Platform } from 'react-native';

// ── Supabase ──────────────────────────────────────────────────────────────────
// Remplace ces deux valeurs avec celles de ton projet Supabase :
// Dashboard → Settings → API
export const SUPABASE_URL      = 'https://qwexoqlfjetwoxxsyxnh.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_k7JFPKGB06q1Z5KyDxDpBQ_14LAUDwT';

// ── Backend FastAPI ───────────────────────────────────────────────────────────
// Pendant le développement local (avant Railway) :
// - Android émulateur → 10.0.2.2 (accès au PC hôte)
// - iPhone → tunnel Dev Tunnels (change l'URL si elle a changé)
export const API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'https://tqb2dd4b-8000.uks1.devtunnels.ms';

export const WS_URL = Platform.OS === 'android'
  ? 'ws://10.0.2.2:8000'
  : 'wss://tqb2dd4b-8000.uks1.devtunnels.ms';
