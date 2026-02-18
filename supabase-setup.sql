-- =====================================================
-- SUPABASE DATABASE SETUP
-- URLs Archive System mit echten Nutzern & Sync
-- =====================================================

-- 1. BENUTZER PROFILE TABELLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. URL KOMMENTARE TABELLE
CREATE TABLE IF NOT EXISTS public.url_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    likes INTEGER DEFAULT 0,
    parent_comment_id UUID REFERENCES public.url_comments(id) ON DELETE CASCADE
);

-- 3. URL LIKES TABELLE
CREATE TABLE IF NOT EXISTS public.url_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(url_id, user_id)
);

-- 4. COMMENT LIKES TABELLE
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.url_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 5. URL VIEWS TRACKING
CREATE TABLE IF NOT EXISTS public.url_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_views ENABLE ROW LEVEL SECURITY;

-- USER PROFILES: Jeder kann lesen, nur eigenes Profil editieren
CREATE POLICY "Public profiles are viewable by everyone"
ON public.user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- URL COMMENTS: Jeder kann lesen, nur eingeloggte User können schreiben
CREATE POLICY "Comments are viewable by everyone"
ON public.url_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.url_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.url_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.url_comments FOR DELETE
USING (auth.uid() = user_id);

-- URL LIKES: Jeder kann lesen, nur eingeloggte können liken
CREATE POLICY "Likes are viewable by everyone"
ON public.url_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like URLs"
ON public.url_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike URLs"
ON public.url_likes FOR DELETE
USING (auth.uid() = user_id);

-- COMMENT LIKES: Jeder kann lesen, nur eingeloggte können liken
CREATE POLICY "Comment likes are viewable by everyone"
ON public.comment_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like comments"
ON public.comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON public.comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- URL VIEWS: Tracking für alle
CREATE POLICY "Views are insertable by everyone"
ON public.url_views FOR INSERT
WITH CHECK (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp on profile update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_url_comments_updated_at
    BEFORE UPDATE ON public.url_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES für Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_url_comments_url_id ON public.url_comments(url_id);
CREATE INDEX IF NOT EXISTS idx_url_comments_user_id ON public.url_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_url_comments_created_at ON public.url_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_likes_url_id ON public.url_likes(url_id);
CREATE INDEX IF NOT EXISTS idx_url_likes_user_id ON public.url_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_url_views_url_id ON public.url_views(url_id);
CREATE INDEX IF NOT EXISTS idx_url_views_viewed_at ON public.url_views(viewed_at DESC);

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS aktivieren
-- =====================================================

-- Publikation für Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.url_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.url_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- =====================================================
-- FERTIG!
-- =====================================================
