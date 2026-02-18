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
