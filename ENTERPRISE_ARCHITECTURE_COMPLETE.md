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
## 🚨 7. AUTH-FEHLERQUELLEN <a name="auth-errors"></a>

### 7.1 Häufige Auth-Fehler und Lösungen

```javascript
// Common Auth Error Handling
class AuthErrorHandler {
    static errors = {
        'Invalid login credentials': {
            userMessage: '❌ Email oder Passwort falsch',
            action: 'checkCredentials',
            retry: false
        },
        'Email not confirmed': {
            userMessage: '📧 Bitte bestätige zuerst deine Email',
            action: 'resendConfirmation',
            retry: false
        },
        'User already registered': {
            userMessage: '⚠️ Email bereits registriert',
            action: 'switchToLogin',
            retry: false
        },
        'Invalid refresh token': {
            userMessage: '🔄 Session abgelaufen - bitte neu einloggen',
            action: 'forceLogout',
            retry: false
        },
        'JWT expired': {
            userMessage: '⏰ Sitzung abgelaufen',
            action: 'refreshSession',
            retry: true
        },
        'Network request failed': {
            userMessage: '🌐 Verbindungsfehler - bitte prüfe deine Internet-Verbindung',
            action: 'retryConnection',
            retry: true
        }
    };

    static handle(error) {
        const errorInfo = this.errors[error.message] || {
            userMessage: '❌ Ein Fehler ist aufgetreten: ' + error.message,
            action: 'contactSupport',
            retry: false
        };

        // Log to monitoring
        logger.error('Auth Error', {
            message: error.message,
            code: error.code,
            status: error.status
        });

        // Handle specific actions
        switch(errorInfo.action) {
            case 'refreshSession':
                return this.attemptSessionRefresh();
            case 'forceLogout':
                return this.performLogout();
            case 'resendConfirmation':
                return this.resendConfirmationEmail();
            case 'switchToLogin':
                openAuthModal(true);
                break;
            case 'retryConnection':
                if (errorInfo.retry) {
                    return this.retryWithBackoff();
                }
                break;
        }

        return errorInfo.userMessage;
    }

    static async attemptSessionRefresh() {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (!error && data.session) {
                return '✅ Session erneuert';
            }
        } catch (e) {
            return this.handle({ message: 'Invalid refresh token' });
        }
    }

    static async performLogout() {
        await supabase.auth.signOut();
        currentUser = null;
        renderAuthUI();
        return '👋 Automatisch ausgeloggt - bitte neu einloggen';
    }

    static async resendConfirmationEmail() {
        const email = prompt('Deine Email-Adresse:');
        if (email) {
            await supabase.auth.resend({
                type: 'signup',
                email: email
            });
            return '📧 Bestätigungs-Email erneut gesendet';
        }
    }

    static async retryWithBackoff(attempt = 1, maxAttempts = 3) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error) {
                return '✅ Verbindung wiederhergestellt';
            }
        } catch (error) {
            if (attempt < maxAttempts) {
                return this.retryWithBackoff(attempt + 1, maxAttempts);
            }
        }
        
        return '❌ Verbindung konnte nicht wiederhergestellt werden';
    }
}

// Usage in auth functions
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            const message = AuthErrorHandler.handle(error);
            alert(message);
            return false;
        }
        
        return true;
    } catch (error) {
        const message = AuthErrorHandler.handle(error);
        alert(message);
        return false;
    }
}
```

### 7.2 Session Management Best Practices

```javascript
// Robust Session Management
class SessionManager {
    constructor() {
        this.refreshInterval = null;
        this.sessionCheckInterval = 5 * 60 * 1000; // 5 minutes
        this.refreshBeforeExpiry = 10 * 60 * 1000; // 10 minutes
    }

    startSessionMonitoring() {
        this.refreshInterval = setInterval(async () => {
            await this.checkAndRefreshSession();
        }, this.sessionCheckInterval);
        
        // Handle visibility change (tab focus)
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                await this.checkAndRefreshSession();
            }
        });
    }

    stopSessionMonitoring() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    async checkAndRefreshSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error || !session) {
                logger.warn('No valid session found');
                await this.handleExpiredSession();
                return;
            }
            
            // Check if session expires soon
            const expiresAt = new Date(session.expires_at * 1000);
            const now = new Date();
            const timeUntilExpiry = expiresAt - now;
            
            if (timeUntilExpiry < this.refreshBeforeExpiry) {
                logger.info('Session expiring soon, refreshing...');
                await this.refreshSession();
            }
            
        } catch (error) {
            logger.error('Session check failed', { error: error.message });
        }
    }

    async refreshSession() {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
                logger.error('Session refresh failed', { error: error.message });
                await this.handleExpiredSession();
                return false;
            }
            
            logger.info('Session refreshed successfully');
            return true;
            
        } catch (error) {
            logger.error('Session refresh error', { error: error.message });
            return false;
        }
    }

    async handleExpiredSession() {
        // Show warning to user
        const shouldRelogin = confirm('⏰ Deine Sitzung ist abgelaufen. Möchtest du dich neu einloggen?');
        
        if (shouldRelogin) {
            await supabase.auth.signOut();
            openAuthModal(true);
        } else {
            // Continue as guest
            await supabase.auth.signOut();
            currentUser = null;
            renderAuthUI();
        }
    }
}

const sessionManager = new SessionManager();
// Start monitoring after successful login
```

---

## 📡 8. REALTIME-ARCHITEKTUR <a name="realtime"></a>

### 8.1 Realtime Internal Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│                                                             │
│  ┌──────────────┐     ┌──────────────┐                    │
│  │  UI Layer    │────▶│  Supabase    │                    │
│  │              │     │  Client SDK  │                    │
│  └──────────────┘     └──────┬───────┘                    │
│                              │                             │
│                              │ WebSocket                   │
│                              │ Connection                  │
└──────────────────────────────┼─────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE PLATFORM                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Realtime Server (Phoenix)                │  │
│  │                                                      │  │
│  │  ┌────────────┐    ┌─────────────┐   ┌──────────┐  │  │
│  │  │ WebSocket  │───▶│  Channel    │──▶│  Presence│  │  │
│  │  │  Handler   │    │  Manager    │   │  Tracker │  │  │
│  │  └────────────┘    └─────────────┘   └──────────┘  │  │
│  │                                                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│                         ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PostgreSQL with Replication                │  │
│  │                                                      │  │
│  │  ┌──────────────┐          ┌──────────────┐        │  │
│  │  │   WAL (Write │          │  Replication │        │  │
│  │  │   Ahead Log) │─────────▶│    Slot      │        │  │
│  │  └──────────────┘          └──────┬───────┘        │  │
│  │                                   │                 │  │
│  │                                   ▼                 │  │
│  │                         ┌───────────────────┐      │  │
│  │                         │  CDC (Change Data │      │  │
│  │                         │    Capture)       │      │  │
│  │                         └─────────┬─────────┘      │  │
│  └───────────────────────────────────┼────────────────┘  │
│                                      │                    │
│                                      │ Broadcasts Changes │
│                                      │                    │
│                                      ▼                    │
│  ┌──────────────────────────────────────────────────────┐│
│  │            Realtime Broadcast Layer                  ││
│  │         (Publishes to all subscribers)               ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Enhanced Realtime Implementation

```javascript
class RealtimeManager {
    constructor() {
        this.channels = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    subscribeToComments() {
        const channel = supabase
            .channel('url_comments_channel')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'url_comments' 
                },
                (payload) => this.handleNewComment(payload)
            )
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'url_comments'
                },
                (payload) => this.handleUpdatedComment(payload)
            )
            .on('postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'url_comments'
                },
                (payload) => this.handleDeletedComment(payload)
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger.info('✅ Subscribed to comments');
                    this.showRealtimeIndicator(true);
                } else if (status === 'CHANNEL_ERROR') {
                    logger.error('❌ Channel error');
                    this.handleReconnect();
                } else if (status === 'TIMED_OUT') {
                    logger.error('⏱️ Connection timed out');
                    this.handleReconnect();
                }
            });

        this.channels.set('comments', channel);
    }

    subscribeToLikes() {
        const channel = supabase
            .channel('likes_channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'comment_likes' },
                (payload) => this.handleLikeChange(payload)
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'url_likes' },
                (payload) => this.handleUrlLikeChange(payload)
            )
            .subscribe();

        this.channels.set('likes', channel);
    }

    subscribeToPresence() {
        const channel = supabase
            .channel('online_users')
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                this.updateOnlineUsers(state);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                logger.info('User joined', { key, newPresences });
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                logger.info('User left', { key, leftPresences });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && currentUser) {
                    await channel.track({
                        user_id: currentUser.id,
                        online_at: new Date().toISOString(),
                        username: currentUser.profile?.display_name || 'Anonymous'
                    });
                }
            });

        this.channels.set('presence', channel);
    }

    async handleNewComment(payload) {
        const comment = payload.new;
        
        // Fetch user profile for new comment
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', comment.user_id)
            .single();

        // Show notification if not own comment
        if (currentUser && comment.user_id !== currentUser.id) {
            this.showNotification('💬 Neuer Kommentar', {
                body: `${profile?.display_name || 'Someone'} hat kommentiert`,
                icon: profile?.avatar_url
            });
        }

        // Update UI
        await renderUrls(document.querySelector('.filter-btn.active')?.dataset.category || 'all');
    }

    async handleUpdatedComment(payload) {
        const comment = payload.new;
        
        // Update specific comment in DOM without full reload
        const commentElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
        if (commentElement) {
            // Update only the text
            const textElement = commentElement.querySelector('.comment-text');
            if (textElement) {
                textElement.textContent = comment.comment_text;
                textElement.classList.add('updated');
                setTimeout(() => textElement.classList.remove('updated'), 1000);
            }
        }
    }

    async handleDeletedComment(payload) {
        const commentId = payload.old.id;
        
        // Remove from DOM
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.style.transition = 'opacity 0.3s';
            commentElement.style.opacity = '0';
            setTimeout(() => commentElement.remove(), 300);
        }
    }

    handleLikeChange(payload) {
        // Update like counter in real-time
        const commentId = payload.new?.comment_id || payload.old?.comment_id;
        this.updateLikeCounter(commentId);
    }

    async updateLikeCounter(commentId) {
        const { count } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', commentId);

        const likeButton = document.querySelector(`[data-comment-id="${commentId}"] .comment-like-btn`);
        if (likeButton) {
            const currentText = likeButton.textContent;
            const emoji = currentText.includes('❤️') ? '❤️' : '🤍';
            likeButton.textContent = `${emoji} ${count} ${count !== 1 ? 'Likes' : 'Like'}`;
        }
    }

    updateOnlineUsers(presenceState) {
        const onlineCount = Object.keys(presenceState).length;
        const indicator = document.getElementById('onlineIndicator');
        
        if (indicator) {
            indicator.textContent = `👥 ${onlineCount} online`;
        }
    }

    showNotification(title, options) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
    }

    showRealtimeIndicator(connected) {
        const indicator = document.getElementById('realtimeIndicator');
        if (indicator) {
            indicator.style.display = connected ? 'block' : 'none';
            indicator.style.background = connected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
            indicator.textContent = connected ? '🟢 Live Sync' : '🔴 Reconnecting...';
        }
    }

    async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnect attempts reached');
            this.showRealtimeIndicator(false);
            alert('⚠️ Real-time Verbindung verloren. Bitte Seite neu laden.');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);

        logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));

        // Unsubscribe all channels
        for (const [name, channel] of this.channels) {
            await channel.unsubscribe();
        }
        this.channels.clear();

        // Resubscribe
        this.subscribeToComments();
        this.subscribeToLikes();
        this.subscribeToPresence();
    }

    unsubscribeAll() {
        for (const [name, channel] of this.channels) {
            channel.unsubscribe();
        }
        this.channels.clear();
        this.showRealtimeIndicator(false);
    }
}

const realtimeManager = new RealtimeManager();
```

---

## 📈 9. SKALIERUNGSGRENZEN <a name="scaling"></a>

### 9.1 Supabase Free Tier Limits

| Resource | Free Tier | Pro Tier | Enterprise |
|----------|-----------|----------|------------|
| **Database** | 500 MB | 8 GB | Unlimited |
| **API Requests** | Unlimited | Unlimited | Unlimited |
| **Realtime Connections** | 200 concurrent | 500 concurrent | Custom |
| **Storage** | 1 GB | 100 GB | Unlimited |
| **Bandwidth** | 2 GB | 50 GB | Custom |
| **Auth Users** | 50,000 MAU | Unlimited | Unlimited |
| **File Uploads** | 50 MB | 5 GB | Custom |

### 9.2 Performance Optimization

```sql
-- Database Optimization für Skalierung

-- 1. Partitioning für url_comments (nach Datum)
CREATE TABLE url_comments_2026_01 PARTITION OF url_comments
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE url_comments_2026_02 PARTITION OF url_comments
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Automatisches Partitioning via Trigger
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    start_date := DATE_TRUNC('month', CURRENT_DATE);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'url_comments_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF url_comments
        FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Materialized Views für Analytics
CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT
    DATE(created_at) as date,
    url_id,
    COUNT(*) as comment_count,
    COUNT(DISTINCT user_id) as unique_users
FROM url_comments
WHERE is_deleted = FALSE
GROUP BY DATE(created_at), url_id;

CREATE UNIQUE INDEX ON mv_daily_stats (date, url_id);

-- Refresh hourly
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;
END;
$$ LANGUAGE plpgsql;

-- 3. Connection Pooling konfigurieren
-- pgBouncer Setup
[databases]
postgres = host=xblewwjjqvwerypvttfh.supabase.co port=5432 dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### 9.3 Caching Strategy

```javascript
// Client-Side Cache mit Service Worker
// service-worker.js
const CACHE_NAME = 'urls-archive-v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only cache API requests
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        const cachedTime = response.headers.get('sw-cached-time');
                        if (cachedTime && Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
                            return response;
                        }
                    }
                    
                    return fetch(event.request).then((response) => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            const headers = new Headers(responseClone.headers);
                            headers.append('sw-cached-time', Date.now().toString());
                            
                            const cachedResponse = new Response(responseClone.body, {
                                status: responseClone.status,
                                statusText: responseClone.statusText,
                                headers: headers
                            });
                            
                            cache.put(event.request, cachedResponse);
                        }
                        return response;
                    });
                });
            })
        );
    }
});

// Application-Level Cache
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.cacheDuration) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    invalidate(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

const cacheManager = new CacheManager();

// Usage in comment loading
async function loadCommentsWithCache(urlId) {
    const cacheKey = `comments_${urlId}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
        return cached;
    }

    const { data, error } = await supabase
        .from('url_comments')
        .select('*')
        .eq('url_id', urlId);

    if (!error) {
        cacheManager.set(cacheKey, data);
    }

    return data;
}
```

---

## 🔒 10. SECURITY-AUDIT-CHECKLISTE <a name="security-audit"></a>

### 10.1 Complete Security Checklist

```markdown
# Security Audit Checklist

## 🔐 Authentication & Authorization
- [ ] Multi-factor authentication implementiert?
- [ ] Password complexity requirements (min. 8 chars, Zahlen, Sonderzeichen)?
- [ ] Rate limiting auf Auth-Endpoints?
- [ ] Session timeout konfiguriert (max. 1h)?
- [ ] Refresh token rotation aktiviert?
- [ ] Email verification erforderlich?
- [ ] Password reset flow sicher?
- [ ] Account lockout nach failed attempts?

## 🛡️ Row Level Security (RLS)
- [ ] RLS auf allen Tabellen aktiviert?
- [ ] Policies für SELECT, INSERT, UPDATE, DELETE definiert?
- [ ] Keine USING(true) Policies ohne guten Grund?
- [ ] Moderator/Admin Policies korrekt?
- [ ] Sensitive Daten nur für Owner sichtbar?
- [ ] Cascade deletes sicher konfiguriert?

## 💉 SQL Injection Prevention
- [ ] Alle User-Inputs parametrisiert?
- [ ] Keine String-Concatenation in SQL?
- [ ] Prepared Statements verwendet?
- [ ] Input validation auf Client UND Server?

## 🌐 XSS Prevention
- [ ] Content Security Policy (CSP) Header gesetzt?
- [ ] User-generated Content sanitized?
- [ ] HTML Entity Encoding bei Output?
- [ ] Keine eval() oder innerHTML mit User-Data?
- [ ] HttpOnly cookies für Session?

## 🔒 CSRF Protection
- [ ] CSRF Tokens implementiert?
- [ ] SameSite cookie attribute gesetzt?
- [ ] Origin/Referer Header Validierung?

## 📡 API Security
- [ ] API Keys sicher gespeichert (nicht in Git)?
- [ ] CORS korrekt konfiguriert?
- [ ] Rate limiting auf API-Endpoints?
- [ ] Request size limits gesetzt?
- [ ] Error messages nicht zu detailliert (keine Stack Traces)?

## 🔐 Data Encryption
- [ ] HTTPS/TLS überall?
- [ ] Database connections verschlüsselt (sslmode=require)?
- [ ] Sensitive data in DB verschlüsselt (z.B. pgcrypto)?
- [ ] Encryption at rest aktiviert?

## 📝 Logging & Monitoring
- [ ] Failed auth attempts geloggt?
- [ ] Suspicious activity detection?
- [ ] Audit logs für admin actions?
- [ ] Log retention policy definiert?
- [ ] PII nicht in Logs?

## 👥 User Privacy
- [ ] GDPR compliant?
- [ ] Privacy Policy vorhanden?
- [ ] Data minimization (nur nötige Daten sammeln)?
- [ ] User data deletion möglich?
- [ ] Cookie consent banner?

## 🚨 Incident Response
- [ ] Incident response plan dokumentiert?
- [ ] Backup & recovery procedure getestet?
- [ ] Security contacts definiert?
- [ ] Breach notification process?

## 🔄 Regular Maintenance
- [ ] Dependencies regelmäßig updaten?
- [ ] Security patches zeitnah einspielen?
- [ ] Penetration tests durchführen?
- [ ] Security audits planen?
```

### 10.2 Automated Security Scanning

```bash
#!/bin/bash
# security-scan.sh

echo "🔍 Running Security Audit..."

# 1. Dependency vulnerabilities
echo "📦 Checking dependencies..."
npm audit --audit-level=moderate

# 2. Secrets in code
echo "🔑 Scanning for secrets..."
gitleaks detect --source . --verbose

# 3. SQL injection vulnerabilities
echo "💉 Checking for SQL injection risks..."
semgrep --config=p/sql-injection .

# 4. XSS vulnerabilities
echo "🌐 Checking for XSS risks..."
semgrep --config=p/xss .

# 5. Insecure dependencies
echo "⚠️  Checking for insecure packages..."
snyk test

# 6. OWASP Top 10
echo "🛡️  Running OWASP checks..."
zap-cli quick-scan --self-contained http://localhost:8080

# 7. SSL/TLS configuration
echo "🔒 Checking SSL/TLS..."
testssl.sh https://urls-archive.starlightmovementz.org

echo "✅ Security Audit Complete!"
```

---

**(Dieses File wird in nächster Nachricht fortgesetzt mit Datenmodell-Optimierung, API-Struktur & Deployment)**
## 🎯 11. DATENMODELL-OPTIMIERUNG <a name="data-optimization"></a>

### 11.1 Query Performance Analysis

```sql
-- Performance Analysis Views

CREATE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- > 100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Index Usage Analysis
CREATE VIEW unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Table bloat detection
CREATE VIEW table_bloat AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as bloat_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 11.2 Optimized Indexes

```sql
-- Composite Indexes für häufige Queries

-- 1. Comments by URL and Date (for pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_comments_url_date 
ON url_comments(url_id, created_at DESC) 
WHERE is_deleted = FALSE;

-- 2. User's own comments (for profile page)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_comments_user_date
ON url_comments(user_id, created_at DESC)
WHERE is_deleted = FALSE;

-- 3. Popular URLs (with view counts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_views_url_date
ON url_views(url_id, viewed_at DESC);

-- 4. Likes lookup (to check if user already liked)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_likes_lookup
ON comment_likes(comment_id, user_id);

-- 5. Full-text search on comments
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_comments_search
ON url_comments USING gin(to_tsvector('english', comment_text))
WHERE is_deleted = FALSE;

-- 6. Moderation queue priority
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_queue_status_priority
ON moderation_queue(status, priority DESC, created_at ASC)
WHERE resolved_at IS NULL;
```

### 11.3 Denormalization Strategy

```sql
-- Denormalized counters für Performance

-- Add counter columns to url_comments
ALTER TABLE url_comments
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE url_comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE url_comments
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

-- Trigger to update replies_count
CREATE OR REPLACE FUNCTION update_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
        UPDATE url_comments
        SET replies_count = replies_count + 1
        WHERE id = NEW.parent_comment_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
        UPDATE url_comments
        SET replies_count = GREATEST(0, replies_count - 1)
        WHERE id = OLD.parent_comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_replies_count
AFTER INSERT OR DELETE ON url_comments
FOR EACH ROW
EXECUTE FUNCTION update_replies_count();

-- Populate existing counts
UPDATE url_comments c
SET likes_count = (
    SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = c.id
),
replies_count = (
    SELECT COUNT(*) FROM url_comments r WHERE r.parent_comment_id = c.id
);
```

### 11.4 Query Optimization Examples

```sql
-- BEFORE: N+1 Query Problem
-- Getting comments with user profiles separately
SELECT * FROM url_comments WHERE url_id = 'github-repo-1';
-- Then for each comment:
SELECT * FROM user_profiles WHERE id = <user_id>;

-- AFTER: Single JOIN Query
SELECT
    c.*,
    p.display_name,
    p.avatar_url,
    p.reputation_score,
    p.is_verified,
    p.is_moderator
FROM url_comments c
LEFT JOIN user_profiles p ON c.user_id = p.id
WHERE c.url_id = 'github-repo-1'
  AND c.is_deleted = FALSE
ORDER BY c.created_at DESC
LIMIT 50;

-- Optimized pagination with cursor
SELECT
    c.*,
    p.display_name,
    p.avatar_url
FROM url_comments c
LEFT JOIN user_profiles p ON c.user_id = p.id
WHERE c.url_id = 'github-repo-1'
  AND c.is_deleted = FALSE
  AND (c.created_at, c.id) < ('2026-01-15 12:00:00', 'last_id')  -- Cursor
ORDER BY c.created_at DESC, c.id DESC
LIMIT 50;

-- Efficient counting ohne COUNT(*)
SELECT EXISTS(
    SELECT 1
    FROM url_comments
    WHERE url_id = 'github-repo-1'
    AND is_deleted = FALSE
) AS has_comments;

-- Statt:
SELECT COUNT(*) FROM url_comments WHERE url_id = 'github-repo-1';
```

---

## 🔌 12. API-STRUKTUR & ENDPOINTS <a name="api-structure"></a>

### 12.1 RESTful API Design

```javascript
// API Endpoint Structure für Custom Backend (optional)

const API_BASE = 'https://api.urls-archive.starlightmovementz.org/v1';

const API_ENDPOINTS = {
    // Auth endpoints
    auth: {
        register: '/auth/register',
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        verify: '/auth/verify/:token',
        resetPassword: '/auth/reset-password',
        changePassword: '/auth/change-password'
    },
    
    // User endpoints
    users: {
        getProfile: '/users/:userId',
        updateProfile: '/users/:userId',
        getStats: '/users/:userId/stats',
        getComments: '/users/:userId/comments',
        getBadges: '/users/:userId/badges'
    },
    
    // URLs endpoints
    urls: {
        list: '/urls',
        get: '/urls/:urlId',
        stats: '/urls/:urlId/stats',
        views: '/urls/:urlId/views',
        trending: '/urls/trending'
    },
    
    // Comments endpoints
    comments: {
        list: '/urls/:urlId/comments',
        create: '/urls/:urlId/comments',
        get: '/comments/:commentId',
        update: '/comments/:commentId',
        delete: '/comments/:commentId',
        like: '/comments/:commentId/like',
        unlike: '/comments/:commentId/unlike',
        replies: '/comments/:commentId/replies',
        report: '/comments/:commentId/report'
    },
    
    // Moderation endpoints
    moderation: {
        queue: '/moderation/queue',
        resolve: '/moderation/queue/:reportId/resolve',
        ban: '/moderation/users/:userId/ban',
        unban: '/moderation/users/:userId/unban',
        deleteComment: '/moderation/comments/:commentId/delete',
        pinComment: '/moderation/comments/:commentId/pin'
    },
    
    // Analytics endpoints
    analytics: {
        overview: '/analytics/overview',
        urls: '/analytics/urls',
        users: '/analytics/users',
        engagement: '/analytics/engagement',
        export: '/analytics/export'
    }
};

// API Client Class
class APIClient {
    constructor(baseURL, token = null) {
        this.baseURL = baseURL;
        this.token = token;
    }

    setToken(token) {
        this.token = token;
    }

    async request(method, endpoint, data = null, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
            ...options
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new APIError(error.message, response.status, error);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError('Network request failed', 0, error);
        }
    }

    // Auth methods
    async register(email, password, displayName) {
        return this.request('POST', API_ENDPOINTS.auth.register, {
            email,
            password,
            display_name: displayName
        });
    }

    async login(email, password) {
        const response = await this.request('POST', API_ENDPOINTS.auth.login, {
            email,
            password
        });
        this.setToken(response.access_token);
        return response;
    }

    // Comments methods
    async getComments(urlId, options = {}) {
        const queryParams = new URLSearchParams({
            page: options.page || 1,
            limit: options.limit || 50,
            sort: options.sort || 'newest'
        });

        const endpoint = API_ENDPOINTS.comments.list
            .replace(':urlId', urlId) + `?${queryParams}`;
        
        return this.request('GET', endpoint);
    }

    async createComment(urlId, commentText, parentCommentId = null) {
        const endpoint = API_ENDPOINTS.comments.create.replace(':urlId', urlId);
        return this.request('POST', endpoint, {
            comment_text: commentText,
            parent_comment_id: parentCommentId
        });
    }

    async likeComment(commentId) {
        const endpoint = API_ENDPOINTS.comments.like.replace(':commentId', commentId);
        return this.request('POST', endpoint);
    }

    // Moderation methods
    async getModerationQueue(status = 'pending') {
        return this.request('GET', `${API_ENDPOINTS.moderation.queue}?status=${status}`);
    }

    async resolveReport(reportId, action, reason) {
        const endpoint = API_ENDPOINTS.moderation.resolve.replace(':reportId', reportId);
        return this.request('POST', endpoint, { action, reason });
    }
}

class APIError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

// Usage
const apiClient = new APIClient(API_BASE);

// After login
const { access_token } = await apiClient.login('user@example.com', 'password');
apiClient.setToken(access_token);

// Fetch comments
const comments = await apiClient.getComments('github-repo-1', {
    page: 1,
    limit: 50,
    sort: 'popular'
});
```

### 12.2 GraphQL Alternative (Optional)

```graphql
# GraphQL Schema für fortgeschrittene Queries

type User {
    id: ID!
    email: String!
    displayName: String!
    avatarUrl: String
    reputationScore: Int!
    isVerified: Boolean!
    isModerator: Boolean!
    createdAt: DateTime!
    comments(limit: Int, offset: Int): [Comment!]!
    commentCount: Int!
    likesReceived: Int!
}

type URL {
    id: ID!
    category: String!
    title: String!
    url: String!
    description: String
    repo: String
    type: String!
    viewCount: Int!
    commentCount: Int!
    likeCount: Int!
    comments(limit: Int, offset: Int, sort: CommentSort): [Comment!]!
    trending: Boolean!
}

type Comment {
    id: ID!
    urlId: String!
    userId: String!
    commentText: String!
    parentCommentId: String
    isEdited: Boolean!
    isDeleted: Boolean!
    isPinned: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    likes: [CommentLike!]!
    likesCount: Int!
    replies: [Comment!]!
    repliesCount: Int!
    canEdit: Boolean!
    canDelete: Boolean!
}

type CommentLike {
    id: ID!
    commentId: String!
    userId: String!
    user: User!
    createdAt: DateTime!
}

enum CommentSort {
    NEWEST
    OLDEST
    POPULAR
    TRENDING
}

type Query {
    # URLs
    urls(category: String, search: String): [URL!]!
    url(id: ID!): URL
    trendingUrls(limit: Int): [URL!]!
    
    # Comments
    comments(urlId: ID!, limit: Int, offset: Int, sort: CommentSort): [Comment!]!
    comment(id: ID!): Comment
    
    # Users
    user(id: ID!): User
    currentUser: User
    topContributors(limit: Int): [User!]!
    
    # Moderation
    moderationQueue(status: String): [ModerationReport!]!
    
    # Analytics
    analytics: Analytics!
}

type Mutation {
    # Auth
    register(email: String!, password: String!, displayName: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
    
    # Comments
    createComment(urlId: ID!, commentText: String!, parentCommentId: ID): Comment!
    updateComment(id: ID!, commentText: String!): Comment!
    deleteComment(id: ID!): Boolean!
    
    # Likes
    likeComment(commentId: ID!): CommentLike!
    unlikeComment(commentId: ID!): Boolean!
    
    # Moderation
    reportComment(commentId: ID!, reason: String!): ModerationReport!
    resolveReport(reportId: ID!, action: String!, reason: String): Boolean!
    banUser(userId: ID!, reason: String!, duration: Int): Boolean!
    pinComment(commentId: ID!): Boolean!
}

type Subscription {
    commentAdded(urlId: ID!): Comment!
    commentUpdated(urlId: ID!): Comment!
    commentDeleted(urlId: ID!): ID!
    likeAdded(commentId: ID!): CommentLike!
}

type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
}

type Analytics {
    totalUsers: Int!
    totalComments: Int!
    totalViews: Int!
    activeUsers24h: Int!
    averageCommentsPerUrl: Float!
    topUrls(limit: Int): [URL!]!
}

type ModerationReport {
    id: ID!
    commentId: String!
    reporterId: String!
    reason: String!
    status: String!
    resolvedBy: String
    createdAt: DateTime!
}
```

---

## 🚀 13. DEPLOYMENT-STRATEGIEN <a name="deployment"></a>

### 13.1 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy URLs Archive

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Security audit
        run: npm audit --audit-level=moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build application
        run: |
          echo "Building application..."
          mkdir -p dist
          cp urls-archive.html dist/index.html
          cp TrustedTrustThrust.html dist/
          
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.urls-archive.starlightmovementz.org
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          
      - name: Deploy to Netlify (Staging)
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: '.'
          production-deploy: false
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions (Staging)"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://urls-archive.starlightmovementz.org
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          
      - name: Deploy to Netlify (Production)
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: '.'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions (Production)"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_PRODUCTION_SITE_ID }}
          
      - name: Run smoke tests
        run: |
          curl --fail https://urls-archive.starlightmovementz.org || exit 1

  database-migration:
    needs: deploy-production
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Run database migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: xblewwjjqvwerypvttfh
        run: |
          npx supabase db push
```

### 13.2 Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

set -e

PROJECT_ID="xblewwjjqvwerypvttfh"
CURRENT_ENV=$(supabase status | grep "Environment" | awk '{print $2}')

echo "🔵 Current environment: $CURRENT_ENV"

if [ "$CURRENT_ENV" == "blue" ]; then
    NEW_ENV="green"
else
    NEW_ENV="blue"
fi

echo "🟢 Deploying to: $NEW_ENV"

# 1. Deploy to new environment
echo "📦 Building application..."
npm run build

echo "🚀 Deploying to $NEW_ENV..."
netlify deploy --dir=dist --site=$NEW_ENV-site-id --prod

# 2. Run smoke tests
echo "🧪 Running smoke tests..."
curl --fail https://$NEW_ENV.urls-archive.starlightmovementz.org/health || {
    echo "❌ Smoke tests failed!"
    exit 1
}

# 3. Database migrations (if needed)
if [ -f "migrations/new_migration.sql" ]; then
    echo "📊 Running database migrations..."
    psql $DATABASE_URL < migrations/new_migration.sql
fi

# 4. Switch traffic
echo "🔀 Switching traffic to $NEW_ENV..."
supabase projects switch $PROJECT_ID --environment $NEW_ENV

# 5. Monitor for 5 minutes
echo "👀 Monitoring for 5 minutes..."
for i in {1..30}; do
    sleep 10
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://urls-archive.starlightmovementz.org)
    if [ "$STATUS" != "200" ]; then
        echo "❌ Health check failed! Rolling back..."
        supabase projects switch $PROJECT_ID --environment $CURRENT_ENV
        exit 1
    fi
    echo "✅ Health check $i/30 passed"
done

echo "🎉 Deployment successful!"
echo "Old environment ($CURRENT_ENV) still available for rollback"
```

### 13.3 Rollback Strategy

```bash
#!/bin/bash
# rollback.sh

set -e

echo "⚠️  ROLLBACK INITIATED"

# 1. Get last successful deployment
LAST_DEPLOYMENT=$(git log --grep="Deploy:" --format="%H" -n 2 | tail -1)

echo "📜 Last successful deployment: $LAST_DEPLOYMENT"

# 2. Revert to last deployment
git checkout $LAST_DEPLOYMENT

# 3. Rebuild
npm run build

# 4. Deploy
netlify deploy --dir=dist --prod

# 5. Database rollback (if needed)
if [ -f "rollback.sql" ]; then
    echo "📊 Rolling back database..."
    psql $DATABASE_URL < rollback.sql
fi

# 6. Clear CDN cache
curl -X POST "https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys/latest/cache" \
     -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}"

echo "✅ Rollback complete!"
```

### 13.4 Environment Configuration

```javascript
// config.js - Environment-specific configuration

const ENVIRONMENTS = {
    development: {
        supabaseUrl: 'http://localhost:54321',
        supabaseAnonKey: 'local-anon-key',
        apiUrl: 'http://localhost:3000',
        environment: 'development',
        debug: true,
        logLevel: 'debug'
    },
    
    staging: {
        supabaseUrl: 'https://xblewwjjqvwerypvttfh.supabase.co',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        apiUrl: 'https://api-staging.urls-archive.starlightmovementz.org',
        environment: 'staging',
        debug: true,
        logLevel: 'info'
    },
    
    production: {
        supabaseUrl: 'https://xblewwjjqvwerypvttfh.supabase.co',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        apiUrl: 'https://api.urls-archive.starlightmovementz.org',
        environment: 'production',
        debug: false,
        logLevel: 'error'
    }
};

// Auto-detect environment
function getEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('staging')) {
        return 'staging';
    } else {
        return 'production';
    }
}

const CONFIG = ENVIRONMENTS[getEnvironment()];

// Feature flags
const FEATURE_FLAGS = {
    enableRealtime: CONFIG.environment !== 'development',
    enableNotifications: CONFIG.environment === 'production',
    enableAnalytics: CONFIG.environment === 'production',
    enableModeration: true,
    maxCommentLength: 2000,
    maxCommentsPerHour: 30,
    enableRateLimiting: CONFIG.environment === 'production'
};

export { CONFIG, FEATURE_FLAGS };
```

### 13.5 Monitoring & Alerting

```yaml
# docker-compose.monitoring.yml
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

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
```

```yaml
# alertmanager.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    title: '🚨 URL Archive Alert'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

- name: 'email-notifications'
  email_configs:
  - to: 'admin@starlightmovementz.org'
    from: 'alerts@starlightmovementz.org'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'alerts@starlightmovementz.org'
    auth_password: '${SMTP_PASSWORD}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
```

---

## ✅ DEPLOYMENT CHECKLIST

```markdown
# Pre-Deployment Checklist

## Code Quality
- [ ] All tests passing
- [ ] Linting passed
- [ ] Security audit clean (npm audit)
- [ ] Code review approved
- [ ] No console.log() in production code

## Database
- [ ] Migrations tested in staging
- [ ] Rollback scripts prepared
- [ ] Backup created before migration
- [ ] RLS policies verified
- [ ] Indexes optimized

## Configuration
- [ ] Environment variables set
- [ ] API keys rotated
- [ ] Feature flags configured
- [ ] Rate limits configured
- [ ] CORS settings correct

## Security
- [ ] SSL/TLS certificates valid
- [ ] Security headers configured
- [ ] Secrets not in code
- [ ] Authentication working
- [ ] Authorization policies tested

## Performance
- [ ] Load testing completed
- [ ] CDN configured
- [ ] Caching strategy implemented
- [ ] Image optimization done
- [ ] Bundle size acceptable

## Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Analytics enabled
- [ ] Logging configured
- [ ] Alerts set up
- [ ] Health check endpoint working

## Documentation
- [ ] README updated
- [ ] API docs current
- [ ] Changelog updated
- [ ] Deployment guide updated
- [ ] Rollback procedure documented

## Post-Deployment
- [ ] Smoke tests passed
- [ ] Real-user monitoring active
- [ ] Team notified
- [ ] Monitoring dashboards checked
- [ ] Old deployment available for rollback
```

---

## 🎓 ZUSAMMENFASSUNG

Diese Enterprise-Architektur bietet:

✅ **Hochverfügbarkeit**: Load Balancing, Failover, Multi-Region
✅ **Monitoring**: Prometheus, Grafana, Custom Metrics
✅ **Sicherheit**: RLS, Rate Limiting, Abuse Protection
✅ **Performance**: Caching, Indexing, Denormalization
✅ **Skalierung**: Connection Pooling, Partitioning, CDN
✅ **Deployment**: CI/CD, Blue-Green, Rollback-Strategie
✅ **Observability**: Logging, Tracing, Alerting

**Nächste Schritte:**
1. URLs in urls-archive.html aktualisieren (50 unique URLs)
2. Enhanced Schema deployen (10 Tabellen)
3. Monitoring Stack aufsetzen
4. CI/CD Pipeline konfigurieren
5. Production Deployment durchführen

🚀 **Production-Ready Enterprise System!**
