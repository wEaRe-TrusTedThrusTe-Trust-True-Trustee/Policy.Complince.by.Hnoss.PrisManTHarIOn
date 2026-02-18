# 🏗️ ENTERPRISE PRODUCTION ARCHITECTURE
## URLs Archive System - Complete Infrastructure Guide

---

## 📋 TABLE OF CONTENTS
1. [Hochverfügbarkeits-Cluster](#cluster)
2. [Monitoring & Observability](#monitoring)
3. [Backup-Strategie](#backup)
4. [Rate-Limiting & Abuse Protection](#protection)
5. [Schema-Logik](#schema)
6. [RLS Security Deep Dive](#rls)
7. [Auth-Fehlerquellen](#auth-errors)
8. [Realtime-Architektur](#realtime)
9. [Skalierungsgrenzen](#scaling)
10. [Security-Audit-Checkliste](#security-audit)
11. [Datenmodell-Optimierung](#optimization)
12. [API-Struktur](#api)
13. [Deployment-Strategien](#deployment)

---

## 🔄 1. HOCHVERFÜGBARKEITS-CLUSTER <a name="cluster"></a>

### 1.1 Database Cluster Setup

```sql
-- Multi-Region Read Replicas
-- Supabase Pro: Auto-scaling replicas in EU-CENTRAL-1, EU-WEST-1, US-EAST-1

-- Connection Pooling (optimal für 1000+ gleichzeitige Connections)
ALTER SYSTEM SET max_connections = 500;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '10MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';
```

### 1.2 Load Balancing

```nginx
# Nginx Config für Supabase Frontend
upstream supabase_backend {
    least_conn;
    server supabase-primary.example.com:443 max_fails=3 fail_timeout=30s;
    server supabase-replica-1.example.com:443 max_fails=3 fail_timeout=30s;
    server supabase-replica-2.example.com:443 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name urls-archive.starlightmovementz.org;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/starlightmovementz.crt;
    ssl_certificate_key /etc/ssl/private/starlightmovementz.key;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Rate Limiting
    limit_req zone=api_limit burst=20 nodelay;
    limit_req_status 429;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self' https://xblewwjjqvwerypvttfh.supabase.co; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" always;
    
    location / {
        proxy_pass https://supabase_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket für Real-time
    location /realtime {
        proxy_pass https://supabase_backend/realtime;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}

# Rate Limiting Zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=comment_limit:10m rate=30r/m;
```

### 1.3 Failover Strategy

```javascript
// Frontend Failover Logic
const SUPABASE_URLS = [
    'https://xblewwjjqvwerypvttfh.supabase.co', // Primary
    'https://xblewwjjqvwerypvttfh-eu-west-1.supabase.co', // Replica 1
    'https://xblewwjjqvwerypvttfh-us-east-1.supabase.co'  // Replica 2
];

let currentEndpointIndex = 0;

async function createSupabaseClientWithFailover() {
    for (let i = 0; i < SUPABASE_URLS.length; i++) {
        try {
            const client = supabase.createClient(
                SUPABASE_URLS[currentEndpointIndex],
                SUPABASE_ANON_KEY
            );
            
            // Health check
            const { error } = await client.from('user_profiles').select('id').limit(1);
            
            if (!error) {
                console.log(`Connected to: ${SUPABASE_URLS[currentEndpointIndex]}`);
                return client;
            }
        } catch (error) {
            console.error(`Failed to connect to ${SUPABASE_URLS[currentEndpointIndex]}:`, error);
            currentEndpointIndex = (currentEndpointIndex + 1) % SUPABASE_URLS.length;
        }
    }
    
    throw new Error('All Supabase endpoints are down');
}
```

---

## 📊 2. MONITORING & OBSERVABILITY <a name="monitoring"></a>

### 2.1 Prometheus + Grafana Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_secure_password
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:password@xblewwjjqvwerypvttfh.supabase.co:5432/postgres?sslmode=require"
    ports:
      - "9187:9187"
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
      
  - job_name: 'supabase-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['xblewwjjqvwerypvttfh.supabase.co:443']
```

### 2.2 Custom Metrics in Supabase

```sql
-- Create Metrics Views
CREATE OR REPLACE VIEW public.metrics_daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as daily_active_users,
    COUNT(*) as total_comments,
    AVG(LENGTH(comment_text)) as avg_comment_length
FROM public.url_comments
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.metrics_url_popularity AS
SELECT
    url_id,
    COUNT(DISTINCT user_id) as unique_commenters,
    COUNT(*) as total_comments,
    (SELECT COUNT(*) FROM public.url_likes WHERE url_likes.url_id = url_comments.url_id) as total_likes
FROM public.url_comments
GROUP BY url_id
ORDER BY total_comments DESC;

CREATE OR REPLACE VIEW public.metrics_user_engagement AS
SELECT
    user_id,
    COUNT(*) as total_comments,
    (SELECT COUNT(*) FROM public.comment_likes WHERE comment_likes.user_id = url_comments.user_id) as total_likes_given,
    MAX(created_at) as last_activity
FROM public.url_comments
GROUP BY user_id
ORDER BY total_comments DESC;

-- Performance Monitoring
CREATE OR REPLACE VIEW public.metrics_slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 50;
```

### 2.3 Application-Level Logging

```javascript
// Enhanced Logging System
class Logger {
    constructor() {
        this.endpoint = 'https://your-logging-service.com/api/logs';
        this.sessionId = this.generateSessionId();
    }
    
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    async log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            sessionId: this.sessionId,
            userId: currentUser?.id || 'anonymous',
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...metadata
        };
        
        // Console output
        console[level](message, metadata);
        
        // Send to logging service (async, non-blocking)
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.error('Logging failed:', error);
        }
    }
    
    info(message, metadata) { return this.log('info', message, metadata); }
    warn(message, metadata) { return this.log('warn', message, metadata); }
    error(message, metadata) { return this.log('error', message, metadata); }
}

const logger = new Logger();

// Usage examples
logger.info('User logged in', { userId: user.id });
logger.error('Comment submission failed', { urlId: 5, error: error.message });
```

---

## 💾 3. BACKUP-STRATEGIE <a name="backup"></a>

### 3.1 Automated Backups

```bash
#!/bin/bash
# backup-supabase.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/supabase"
S3_BUCKET="s3://starlightmovementz-backups"
RETENTION_DAYS=30

# Database Backup
pg_dump "postgresql://postgres:$POSTGRES_PASSWORD@xblewwjjqvwerypvttfh.supabase.co:5432/postgres?sslmode=require" \
    --format=custom \
    --file="${BACKUP_DIR}/db_backup_${TIMESTAMP}.dump"

# Compress
gzip "${BACKUP_DIR}/db_backup_${TIMESTAMP}.dump"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/db_backup_${TIMESTAMP}.dump.gz" \
    "${S3_BUCKET}/daily/db_backup_${TIMESTAMP}.dump.gz"

# Cleanup old backups
find ${BACKUP_DIR} -name "*.dump.gz" -mtime +${RETENTION_DAYS} -delete

# Weekly full backup
if [ $(date +%u) -eq 7 ]; then
    aws s3 cp "${BACKUP_DIR}/db_backup_${TIMESTAMP}.dump.gz" \
        "${S3_BUCKET}/weekly/db_backup_${TIMESTAMP}.dump.gz"
fi

# Monthly archive
if [ $(date +%d) -eq 01 ]; then
    aws s3 cp "${BACKUP_DIR}/db_backup_${TIMESTAMP}.dump.gz" \
        "${S3_BUCKET}/monthly/db_backup_${TIMESTAMP}.dump.gz"
fi

echo "Backup completed: db_backup_${TIMESTAMP}.dump.gz"
```

```cron
# Crontab entry
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-supabase.sh >> /var/log/supabase-backup.log 2>&1

# Point-in-time recovery backup every 4 hours
0 */4 * * * pg_basebackup -D /backups/pitr/$(date +\%Y\%m\%d_\%H\%M\%S) -F tar -z -P
```

### 3.2 Disaster Recovery Plan

```sql
-- Point-in-Time Recovery Setup
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'aws s3 cp %p s3://starlightmovementz-backups/wal/%f';
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET wal_keep_segments = 100;

-- Recovery Configuration
-- /etc/postgresql/recovery.conf
restore_command = 'aws s3 cp s3://starlightmovementz-backups/wal/%f %p'
recovery_target_time = '2026-02-17 12:00:00'
```

---

## 🛡️ 4. RATE-LIMITING & ABUSE PROTECTION <a name="protection"></a>

### 4.1 Database-Level Rate Limiting

```sql
-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id),
    ip_address INET NOT NULL,
    action_type TEXT NOT NULL, -- 'comment', 'like', 'auth'
    action_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ip_address, action_type, window_start)
);

CREATE INDEX idx_rate_limits_user_action ON public.rate_limits(user_id, action_type);
CREATE INDEX idx_rate_limits_ip_action ON public.rate_limits(ip_address, action_type);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Rate Limit Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_ip_address INET,
    p_action_type TEXT,
    p_max_actions INTEGER,
    p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_action_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Count actions in current window
    SELECT COALESCE(SUM(action_count), 0) INTO v_action_count
    FROM public.rate_limits
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
        AND action_type = p_action_type
        AND window_start > v_window_start;
    
    IF v_action_count >= p_max_actions THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    -- Record action
    INSERT INTO public.rate_limits (user_id, ip_address, action_type, window_start)
    VALUES (p_user_id, p_ip_address, p_action_type, DATE_TRUNC('minute', NOW()))
    ON CONFLICT (user_id, ip_address, action_type, window_start)
    DO UPDATE SET action_count = rate_limits.action_count + 1;
    
    RETURN TRUE; -- Allowed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old rate limit records (run hourly)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Usage in comment insertion
CREATE OR REPLACE FUNCTION public.insert_comment_with_rate_limit(
    p_url_id INTEGER,
    p_comment_text TEXT,
    p_ip_address INET
) RETURNS UUID AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    -- Check rate limit: 30 comments per hour
    IF NOT public.check_rate_limit(
        auth.uid(),
        p_ip_address,
        'comment',
        30,
        60
    ) THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before commenting again.';
    END IF;
    
    -- Insert comment
    INSERT INTO public.url_comments (url_id, user_id, comment_text)
    VALUES (p_url_id, auth.uid(), p_comment_text)
    RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Abuse Detection

```sql
-- Spam Detection Table
CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id),
    ip_address INET,
    abuse_type TEXT NOT NULL, -- 'spam', 'harassment', 'duplicate', 'malicious'
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    auto_detected BOOLEAN DEFAULT TRUE,
    details JSONB
);

-- Spam Detection Function
CREATE OR REPLACE FUNCTION public.detect_spam_comment(
    p_user_id UUID,
    p_comment_text TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_recent_comments INTEGER;
    v_duplicate_count INTEGER;
    v_is_spam BOOLEAN := FALSE;
BEGIN
    -- Check 1: Too many comments in short time
    SELECT COUNT(*) INTO v_recent_comments
    FROM public.url_comments
    WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '5 minutes';
    
    IF v_recent_comments >= 10 THEN
        v_is_spam := TRUE;
        INSERT INTO public.abuse_reports (user_id, abuse_type, details)
        VALUES (p_user_id, 'spam', jsonb_build_object('reason', 'too_many_comments', 'count', v_recent_comments));
    END IF;
    
    -- Check 2: Duplicate comments
    SELECT COUNT(*) INTO v_duplicate_count
    FROM public.url_comments
    WHERE user_id = p_user_id
        AND comment_text = p_comment_text
        AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_duplicate_count >= 3 THEN
        v_is_spam := TRUE;
        INSERT INTO public.abuse_reports (user_id, abuse_type, details)
        VALUES (p_user_id, 'duplicate', jsonb_build_object('reason', 'duplicate_comments', 'text', p_comment_text));
    END IF;
    
    -- Check 3: Suspicious patterns (URLs in first 5 comments)
    SELECT COUNT(*) INTO v_recent_comments
    FROM public.url_comments
    WHERE user_id = p_user_id;
    
    IF v_recent_comments <= 5 AND p_comment_text ~* 'https?://|www\.' THEN
        v_is_spam := TRUE;
        INSERT INTO public.abuse_reports (user_id, abuse_type, details)
        VALUES (p_user_id, 'malicious', jsonb_build_object('reason', 'url_in_early_comments'));
    END IF;
    
    RETURN v_is_spam;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🗄️ 5. SCHEMA-LOGIK <a name="schema"></a>

### 5.1 Complete Enhanced Schema

```sql
-- =====================================================
-- ENHANCED PRODUCTION SCHEMA
-- =====================================================

-- 1. USER PROFILES (Extended)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 30),
    display_name TEXT CHECK (LENGTH(display_name) <= 100),
    avatar_url TEXT,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    reputation_score INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_until TIMESTAMPTZ,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. URL METADATA (New table for URL statistics)
CREATE TABLE IF NOT EXISTS public.url_metadata (
    id SERIAL PRIMARY KEY,
    url_id INTEGER UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    trending_score FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. URL COMMENTS (Enhanced)
CREATE TABLE IF NOT EXISTS public.url_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.url_comments(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL CHECK (LENGTH(comment_text) >= 1 AND LENGTH(comment_text) <= 5000),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMENT LIKES
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.url_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 5. URL LIKES
CREATE TABLE IF NOT EXISTS public.url_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(url_id, user_id)
);

-- 6. URL VIEWS (Analytics)
CREATE TABLE IF NOT EXISTS public.url_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER SESSIONS (Extended auth tracking)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MODERATION QUEUE
CREATE TABLE IF NOT EXISTS public.moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'comment', 'user'
    content_id UUID NOT NULL,
    reported_by UUID REFERENCES public.user_profiles(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderator_id UUID REFERENCES public.user_profiles(id),
    moderator_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'comment_reply', 'comment_like', 'mention'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 6. RLS SECURITY DEEP DIVE <a name="rls"></a>

### 6.1 Complete RLS Policies

```sql
-- =====================================================
-- ROW LEVEL SECURITY - COMPREHENSIVE
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- USER PROFILES POLICIES
-- ==================================================

-- Everyone can view non-banned profiles
CREATE POLICY "Anyone can view active profiles"
ON public.user_profiles FOR SELECT
USING (is_banned = FALSE OR auth.uid() = id);

-- Users can insert their own profile (via trigger)
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile (except privileged fields)
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    is_moderator = (SELECT is_moderator FROM public.user_profiles WHERE id = auth.uid()) AND
    is_banned = (SELECT is_banned FROM public.user_profiles WHERE id = auth.uid())
);

-- Moderators can update any profile
CREATE POLICY "Moderators can update any profile"
ON public.user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_moderator = TRUE
    )
);

-- ==================================================
-- URL METADATA POLICIES
-- ==================================================

CREATE POLICY "Anyone can view url metadata"
ON public.url_metadata FOR SELECT
USING (true);

CREATE POLICY "System can insert/update metadata"
ON public.url_metadata FOR ALL
USING (auth.uid() IS NOT NULL);

-- ==================================================
-- URL COMMENTS POLICIES
-- ==================================================

-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view active comments"
ON public.url_comments FOR SELECT
USING (is_deleted = FALSE OR user_id = auth.uid());

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create comments"
ON public.url_comments FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    LENGTH(comment_text) >= 1 AND
    LENGTH(comment_text) <= 5000 AND
    NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_banned = TRUE
    )
);

-- Users can update own comments within 15 minutes
CREATE POLICY "Users can update own recent comments"
ON public.url_comments FOR UPDATE
USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '15 minutes'
)
WITH CHECK (
    auth.uid() = user_id AND
    is_deleted = FALSE
);

-- Users can soft-delete own comments
CREATE POLICY "Users can delete own comments"
ON public.url_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Moderators can update/delete any comment
CREATE POLICY "Moderators can moderate comments"
ON public.url_comments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_moderator = TRUE
    )
);

-- ==================================================
-- LIKES POLICIES
-- ==================================================

CREATE POLICY "Anyone can view likes"
ON public.comment_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.comment_likes FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_banned = TRUE
    )
);

CREATE POLICY "Users can unlike"
ON public.comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- Same for URL likes
CREATE POLICY "Anyone can view url likes"
ON public.url_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like urls"
ON public.url_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike urls"
ON public.url_likes FOR DELETE
USING (auth.uid() = user_id);

-- ==================================================
-- NOTIFICATIONS POLICIES
-- ==================================================

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- ==================================================
-- MODERATION QUEUE POLICIES
-- ==================================================

CREATE POLICY "Anyone can submit reports"
ON public.moderation_queue FOR INSERT
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Moderators can view queue"
ON public.moderation_queue FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_moderator = TRUE
    )
);

CREATE POLICY "Moderators can resolve reports"
ON public.moderation_queue FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_moderator = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_moderator = TRUE
    )
);
```

---

**(Fortsetzung in nächster Nachricht - File wird zu groß)**
