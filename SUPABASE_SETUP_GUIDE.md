# 🚀 URLs Archive System - Supabase Setup Guide

## 📋 SCHRITT-FÜR-SCHRITT ANLEITUNG

### 1. Supabase Dashboard öffnen
- Gehe zu: https://supabase.com/dashboard
- Login mit deinem Account
- Projekt auswählen: `xblewwjjqvwerypvttfh`

### 2. SQL Editor öffnen
- Im linken Menü: **SQL Editor** klicken
- Neues Query erstellen
- Den kompletten Inhalt von `supabase-setup.sql` kopieren und einfügen

### 3. SQL Script ausführen
- Auf **RUN** klicken (oder Strg+Enter)
- Warte bis alle Tabellen erstellt sind
- Du solltest folgende Meldung sehen: "Success. No rows returned"

### 4. Authentication konfigurieren
**4.1 Email Provider aktivieren:**
- Gehe zu **Authentication** → **Providers**
- **Email** Provider aktivieren
- Optionen:
  - ✅ Enable Email provider
  - ✅ Confirm email (empfohlen für Produktion)
  - ⚠️ Für Tests: Deaktiviere "Confirm email"

**4.2 Email Templates anpassen (optional):**
- **Authentication** → **Email Templates**
- Passe die Bestätigungs-Emails an

### 5. Real-time aktivieren
- Gehe zu **Database** → **Replication**
- Stelle sicher, dass **Realtime** für folgende Tabellen aktiviert ist:
  - ✅ `url_comments`
  - ✅ `url_likes`
  - ✅ `comment_likes`
  - ✅ `user_profiles`

### 6. Row Level Security überprüfen
- Gehe zu **Authentication** → **Policies**
- Prüfe, dass alle Policies aktiv sind:
  - `user_profiles`: 3 Policies
  - `url_comments`: 4 Policies
  - `url_likes`: 3 Policies
  - `comment_likes`: 3 Policies
  - `url_views`: 1 Policy

### 7. API Keys überprüfen
- Gehe zu **Settings** → **API**
- Kopiere deine Keys (bereits in Code integriert):
  - **URL**: `https://xblewwjjqvwerypvttfh.supabase.co`
  - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🧪 TESTEN

### Test 1: Registrierung
1. Öffne `urls-archive.html`
2. Klicke auf **Register**
3. Gebe Email, Passwort, Username, Displayname ein
4. Account wird erstellt

### Test 2: Login
1. Klicke auf **Login**
2. Gebe Email & Passwort ein
3. Du siehst dein Profil oben rechts
4. 🟢 Live Sync Indikator erscheint

### Test 3: Kommentare schreiben
1. Klicke auf 💬 Kommentieren bei einer URL
2. Schreibe einen Kommentar
3. Kommentar wird in Datenbank gespeichert
4. Dein Avatar & Name werden angezeigt

### Test 4: Likes
1. Klicke auf 🤍 bei einem Kommentar
2. Like wird gezählt
3. Herz wird zu ❤️

### Test 5: Real-time Sync
1. Öffne die Seite in 2 Browsern/Tabs
2. Kommentiere in Tab 1
3. Tab 2 zeigt den Kommentar SOFORT (ohne Reload!)

---

## 📊 DATENBANK-STRUKTUR

### Tabellen:
1. **user_profiles** - Benutzerprofile
   - id (UUID, FK zu auth.users)
   - username (TEXT, UNIQUE)
   - display_name (TEXT)
   - avatar_url (TEXT)
   - bio (TEXT)
   - created_at, updated_at

2. **url_comments** - Kommentare zu URLs
   - id (UUID)
   - url_id (INTEGER)
   - user_id (UUID, FK zu user_profiles)
   - comment_text (TEXT)
   - likes (INTEGER)
   - parent_comment_id (UUID, für Replies)
   - created_at, updated_at

3. **url_likes** - Likes für URLs
   - id (UUID)
   - url_id (INTEGER)
   - user_id (UUID)
   - created_at

4. **comment_likes** - Likes für Kommentare
   - id (UUID)
   - comment_id (UUID)
   - user_id (UUID)
   - created_at

5. **url_views** - View Tracking
   - id (UUID)
   - url_id (INTEGER)
   - user_id (UUID, nullable)
   - viewed_at
   - ip_address, user_agent

---

## 🔐 SECURITY (RLS - Row Level Security)

### Policies:
- **Public Read**: Jeder kann Kommentare, Likes, Profile lesen
- **Authenticated Write**: Nur eingeloggte User können schreiben
- **Own Data**: User können nur eigene Daten editieren/löschen

---

## 🚨 TROUBLESHOOTING

### Problem: "JWT expired"
→ User muss sich neu einloggen (Session abgelaufen nach 1h)

### Problem: "Row Level Security policy violation"
→ Prüfe ob RLS Policies korrekt erstellt wurden in SQL Editor

### Problem: "Real-time not working"
→ Prüfe ob Realtime für Tabellen aktiviert ist (Database → Replication)

### Problem: "Email not confirmed"
→ Deaktiviere "Confirm email" in Auth Settings für Tests

### Problem: "Anonymous users can't comment"
→ Das ist korrekt! Nur eingeloggte User dürfen kommentieren

---

## ✅ PRODUCTION CHECKLIST

Vor dem Live-Gehen:
- [ ] Email Confirmation aktiviert?
- [ ] Email Templates angepasst?
- [ ] RLS Policies doppelt gecheckt?
- [ ] API Keys sicher gespeichert?
- [ ] Backup-Strategie definiert?
- [ ] Rate Limiting konfiguriert?
- [ ] Custom Domain konfiguriert (optional)?

---

## 🎯 FEATURES

✅ **Echte Nutzer-Accounts** mit Email/Passwort
✅ **Real-time Synchronisierung** zwischen allen Nutzern
✅ **Persistente Datenbank** (keine localStorage!)
✅ **Like-System** für Kommentare
✅ **Avatare** für alle Nutzer
✅ **Sicherheit** durch Row Level Security
✅ **Skalierbar** für tausende Nutzer
✅ **Kostenlos** bis 500MB Database & 2GB Bandwidth/Monat

---

## 📞 SUPPORT

Bei Problemen:
1. Supabase Docs: https://supabase.com/docs
2. Discord: https://discord.supabase.com
3. GitHub Issues: https://github.com/supabase/supabase/issues

---

**READY TO GO! 🚀**
