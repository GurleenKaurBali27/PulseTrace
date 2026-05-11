# 🔐 Secrets Management Guide

## Overview

This guide covers best practices for managing secrets and sensitive configuration values in the API Failure Visualizer across development, staging, and production environments.

---

## Table of Contents

1. [Never Commit Secrets](#never-commit-secrets)
2. [Environment-Based Secrets](#environment-based-secrets)
3. [Development Secrets](#development-secrets)
4. [Production Secrets](#production-secrets)
5. [Third-Party Integration Secrets](#third-party-integration-secrets)
6. [Rotating Secrets](#rotating-secrets)
7. [Secret Leakage Detection](#secret-leakage-detection)

---

## Never Commit Secrets

### ❌ DO NOT commit to git:

- `.env` (development environment file)
- `.env.local` (local overrides)
- `.env.production` (production values)
- Private keys, API keys, credentials
- Database passwords or connection strings with credentials

### ✅ DO commit to git:

- `.env.example` (template with placeholder values)
- `.env.production.example` (template for production)
- Configuration files with dummy values
- `.gitignore` entries

### Updated .gitignore

Ensure your `.gitignore` includes:

```
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Dependencies
node_modules/
dist/
build/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.db
*.sqlite
*.sqlite3

# OS
.DS_Store
Thumbs.db

# Temporary
temp/
tmp/
.cache/
```

---

## Environment-Based Secrets

### Structure

Use separate `.env` files for each environment:

```
.env                              # Development (git-ignored)
.env.example                      # Development template (committed)
.env.staging                      # Staging (git-ignored)
.env.production                   # Production (git-ignored, never in repo)
.env.production.example          # Production template (committed)
```

### Loading Order

Services load environment variables in this order (first match wins):

1. System environment variables
2. `.env` file in root (development)
3. `.env.[NODE_ENV]` file (staging/production)
4. Default values in code

```javascript
// Example: server/server.js
require("dotenv").config({ 
  path: require("path").join(__dirname, "../.env") 
});

const PORT = process.env.SERVER_PORT || 5000;
```

---

## Development Secrets

### Setup

1. **Copy template:**
   ```bash
   cp .env.example .env
   ```

2. **Update with local values:**
   ```env
   NODE_ENV=development
   DATABASE_URL=sqlite://./database.db
   JWT_SECRET=dev-secret-key-change-in-production
   API_KEY=dev-api-key-12345
   ```

3. **Never commit `.env`:**
   ```bash
   git status  # Should NOT show .env
   ```

### Safe Defaults for Development

```env
# Development safe defaults
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4000
FEATURE_REALTIME=true
FEATURE_ALERTS=true
DEPLOYMENT_PLATFORM=local
```

---

## Production Secrets

### Management Strategy

#### Option 1: Environment Variables (Recommended for small projects)

Deploy secrets as environment variables:

```bash
# On Vercel
vercel env add DATABASE_URL postgresql://user:pass@host/db
vercel env add JWT_SECRET your-super-secret-key

# On Render
render env set DATABASE_URL postgresql://user:pass@host/db
```

#### Option 2: Secrets Manager (Recommended for enterprises)

Use native secrets management:

- **AWS:** Secrets Manager, Parameter Store
- **Azure:** Key Vault
- **Google Cloud:** Secret Manager
- **Vercel:** Environment Variables (built-in)
- **Render:** Environment Groups

#### Option 3: Encrypted .env Files

Use `dotenv-vault` for encrypted secrets:

```bash
# Install
npm install dotenv-vault

# Initialize
dotenv-vault new

# Encrypt production secrets
echo "DATABASE_URL=..." > .env.production.encrypted
dotenv-vault push production
```

### Production .env Template

Create `.env.production.example`:

```env
# ============================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================

# Core
NODE_ENV=production
DEPLOYMENT_PLATFORM=vercel  # or render, heroku, aws

# Server
SERVER_PORT=8000            # Port on platform (may be overridden)
LOG_LEVEL=error             # Reduce logs in production
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Database (REQUIRED - Use PostgreSQL in production)
DATABASE_URL=postgresql://user:password@host:5432/db_name

# Security
JWT_SECRET=your-secret-key-minimum-32-characters
API_KEY=your-api-key-from-service
ENCRYPTION_KEY=your-encryption-key

# URLs
VITE_API_URL=https://api.yourdomain.com
TRACKER_URL=https://api.yourdomain.com

# Third-party Integrations (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SENDGRID_API_KEY=SG.xxx...
PAGERDUTY_API_KEY=xxx...

# Features
FEATURE_REALTIME=true
FEATURE_ALERTS=true
FEATURE_MULTISERVICE=true
FEATURE_ANALYTICS=true

# Performance
STATS_CACHE_TTL=3600        # Increase cache in production
MAX_CONNECTIONS=50
REQUEST_TIMEOUT=30000
```

---

## Third-Party Integration Secrets

### Slack Integration

1. **Create incoming webhook:**
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Enable Incoming Webhooks
   - Add Webhook to Workspace
   - Copy webhook URL

2. **Store secret:**
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Use in alerts:**
   ```javascript
   if (process.env.SLACK_WEBHOOK_URL) {
     // Send alert to Slack
   }
   ```

### SendGrid Integration

1. **Create API key:**
   - Go to https://app.sendgrid.com/settings/api_keys
   - Create new API key with Mail Send permissions
   - Copy the key (only shown once!)

2. **Store secret:**
   ```env
   SENDGRID_API_KEY=SG.4zWxx1234567890...
   ```

3. **Use in notifications:**
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   ```

### PagerDuty Integration

1. **Create API token:**
   - Go to PagerDuty → Settings → API Tokens
   - Create new API token
   - Copy the token

2. **Store secret:**
   ```env
   PAGERDUTY_API_KEY=u+xxx...
   ```

---

## Rotating Secrets

### Guide: Key Rotation Without Downtime

#### Step 1: Create New Secret

```bash
# Generate new JWT secret
openssl rand -base64 32
# Output: abc123xyz...

# Add to environment
vercel env add JWT_SECRET_NEW abc123xyz...
```

#### Step 2: Update Code to Accept Both

```javascript
// server/auth.js
const verifyToken = (token) => {
  try {
    // Try new secret first
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Fall back to old secret (if exists)
    if (process.env.JWT_SECRET_OLD) {
      return jwt.verify(token, process.env.JWT_SECRET_OLD);
    }
    throw err;
  }
};
```

#### Step 3: Deploy Update

```bash
git push origin main
# Services continue accepting old tokens
```

#### Step 4: Wait for Token Expiration

- Let all old tokens expire naturally
- Monitor logs for token errors
- Verify all users have new tokens

#### Step 5: Remove Old Secret

```bash
# After old tokens have expired
vercel env rm JWT_SECRET_OLD
```

---

## Secret Leakage Detection

### Prevent Accidental Commits

#### 1. git-secrets

```bash
# Install
brew install git-secrets  # macOS
# or download from github.com/awslabs/git-secrets

# Install hooks into local repo
git secrets --install

# Add patterns to detect
git secrets --register-aws
```

#### 2. Pre-commit Hooks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check for secrets
if grep -r "DATABASE_URL.*password" .env 2>/dev/null; then
  echo "❌ Sensitive data detected in uncommitted changes"
  exit 1
fi

if grep -r "PRIVATE_KEY\|API_SECRET" . --include="*.js" --include="*.env"; then
  echo "❌ Hardcoded secrets detected"
  exit 1
fi

exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Detect Exposed Secrets

Use tools to scan your repository:

```bash
# Scan with GitHub
# Enable on repo → Settings → Security → Secret scanning

# Scan with Snyk
npm install -g snyk
snyk monitor --all-projects

# Scan with TruffleHog
pip install truffleHog
truffleHog filesystem . --json
```

### If Secrets Are Exposed

1. **Immediately:**
   - Revoke/rotate the exposed secret
   - Force password changes
   - Audit logs for unauthorized access

2. **Remove from history:**
   ```bash
   # Use BFG Repo-Cleaner
   bfg --replace-text secrets.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push (after team coordination):**
   ```bash
   git push origin --force --all
   ```

---

## Authentication Tokens

### JWT (JSON Web Tokens)

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Use output as JWT_SECRET
```

Secure JWT setup:

```javascript
const jwt = require('jsonwebtoken');

// Sign
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d', algorithm: 'HS256' }
);

// Verify
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### API Keys

Generate unique API keys per integrations:

```javascript
// Generate API key
const apiKey = require('crypto')
  .randomBytes(32)
  .toString('hex');
// Output: abc123xyz...
```

Store hashed in database:

```javascript
const bcrypt = require('bcrypt');

const hashedKey = await bcrypt.hash(apiKey, 10);
// Store hashedKey in database
// Never store plaintext API key
```

---

## Checklists

### Pre-Deployment Checklist

- [ ] `.env.production.example` created with all required variables
- [ ] Actual `.env.production` file is in `.gitignore`
- [ ] All secrets are in environment variables (not code)
- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] Database password is strong and unique
- [ ] CORS_ORIGINS limited to production domains
- [ ] LOG_LEVEL set to `error` (not debug)
- [ ] All API keys from third parties are valid
- [ ] git-secrets installed and configured
- [ ] `.env` file not accidentally committed

### After Deployment Checklist

- [ ] Verify secrets loaded correctly (check startup logs)
- [ ] Test authentication flows work
- [ ] Monitor for secret-related errors
- [ ] Set up secret rotation reminders
- [ ] Document which secrets were deployed
- [ ] Notify team of secret locations

---

## Quick Reference

| Task | Command |
|------|---------|
| Copy template | `cp .env.example .env` |
| Check secrets in git | `git log -p -S"PASSWORD" \|\| grep -r "SECRET" .` |
| Generate strong secret | `openssl rand -base64 32` |
| Encrypt .env | `dotenv-vault push production` |
| Scan repo | `snyk monitor` |
| Find exposed API keys | `git log --all -G "api_key" -p` |

---

## Resources

- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [dotenv-vault Documentation](https://www.dotenv.org/docs)
- [GitHub: Keep Secrets Out of Git](https://docs.github.com/en/code-security/secret-scanning)
- [AWS: Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [12-Factor App: Config](https://12factor.net/config)

---

## Support

For questions about secrets management:

1. Check this guide first
2. Review [.env.example](.env.example) for structure
3. Check deployment platform documentation
4. Ask in project discussions

**Never share secrets or API keys in issues, discussions, or logs.**
