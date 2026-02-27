-- ═══════════════════════════════════════════════════════════════════════════
-- IA Familiale — Phase 2 — Schéma Supabase
-- Colle ce SQL dans : Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- Extension UUID (normalement déjà active sur Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profils utilisateurs ────────────────────────────────────────────────────
-- Étend la table auth.users gérée par Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom         TEXT NOT NULL,
    etat        TEXT NOT NULL DEFAULT 'au_travail',
    push_token  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Cercles familiaux ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom         TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Membres d'un cercle ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circle_members (
    circle_id   UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'membre',  -- 'admin' | 'membre'
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (circle_id, user_id)
);

-- ─── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediteur_id    UUID NOT NULL REFERENCES public.profiles(id),
    destinataire_id  UUID NOT NULL REFERENCES public.profiles(id),
    circle_id        UUID NOT NULL REFERENCES public.circles(id),
    texte            TEXT NOT NULL,
    trigger          TEXT NOT NULL DEFAULT 'maintenant',
    statut           TEXT NOT NULL DEFAULT 'en_attente',  -- 'en_attente' | 'livre' | 'annule'
    envoye_a         TIMESTAMPTZ DEFAULT NOW(),
    livre_a          TIMESTAMPTZ
);

-- ─── Invitations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id    UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    inviteur_id  UUID NOT NULL REFERENCES public.profiles(id),
    email_invite TEXT NOT NULL,
    token        TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
    statut       TEXT NOT NULL DEFAULT 'en_attente',  -- 'en_attente' | 'accepte' | 'refuse'
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Index pour les performances ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON public.messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur   ON public.messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_statut       ON public.messages(statut);
CREATE INDEX IF NOT EXISTS idx_circle_members_user   ON public.circle_members(user_id);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────
-- Active la sécurité ligne par ligne : chaque user ne voit que ses données
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations    ENABLE ROW LEVEL SECURITY;

-- Profiles : visible par tous les membres du même cercle
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (true);  -- simplifié pour le dev, à restreindre en prod

CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Messages : visible par expéditeur et destinataire
CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (
        auth.uid() = expediteur_id OR
        (auth.uid() = destinataire_id AND statut = 'livre')
    );

CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = expediteur_id);

CREATE POLICY "messages_update" ON public.messages
    FOR UPDATE USING (auth.uid() = expediteur_id OR auth.uid() = destinataire_id);

-- ─── Trigger : créer un profil automatiquement à l'inscription ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nom)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nom', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
