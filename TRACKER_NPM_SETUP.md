# API Failure Tracker - NPM Package Setup

## ✅ What's Ready for Publication

Your tracker middleware is now prepared as a production-ready npm package!

### Files Created/Updated

| File | Status | Purpose |
|------|--------|---------|
| `tracker/package.json` | ✅ Updated | Official npm package metadata |
| `tracker/README.md` | ✅ Created | Complete documentation |
| `tracker/.npmignore` | ✅ Created | Exclude unnecessary files |
| `tracker/EXAMPLE_USAGE.js` | ✅ Created | Usage example & demo |
| `tracker/tracker.js` | ✅ Existing | Main middleware (exports correctly) |
| `tracker/sendLog.js` | ✅ Existing | Log submission helper |
| `tracker/logger.js` | ✅ Existing | Local logging utility |

---

## 🎯 Package Details

### Name
```
api-failure-tracker
```

### Main Entry Point
```javascript
module.exports = tracker;  // in tracker.js
```

### Usage Pattern (as requested)
```javascript
// Users can install and use like this:
const tracker = require('api-failure-tracker');

app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'my-service'
}));
```

### Version
```
1.0.0
```

### License
```
MIT
```

### Keywords
```
api, tracking, middleware, express, observability, monitoring, 
development, debugging, http, requests, responses
```

---

## 📋 Pre-Publication Checklist

Before publishing to npm, complete these steps:

### 1. Update Author Information ⚠️
```json
"author": "Your Name <your.email@example.com>"
```
- [ ] Replace "Your Name" with actual author name
- [ ] Replace "your.email@example.com" with actual email

### 2. Update Repository URL ⚠️
```json
"repository": {
  "type": "git",
  "url": "https://github.com/yourusername/api-failure-visualizer.git"
}
```
- [ ] Replace "yourusername" with your GitHub username
- [ ] Update homepage and bugs URLs similarly:
  - [ ] `"homepage"` - main project repo URL
  - [ ] `"bugs.url"` - issues page URL

### 3. Create LICENSE File
If not already present in root:
```bash
# In root directory
touch LICENSE

# Add MIT license text, or:
# npm-license-cli install-mit
```
- [ ] Create LICENSE file
- [ ] Use MIT license (recommended)

### 4. Verify Package Contents
Test what will be published:
```bash
cd tracker
npm pack --dry-run
```
- [ ] Confirms only necessary files are included
- [ ] No node_modules or logs directories

### 5. Create npm Account
```bash
npm adduser
# or login if you have an account:
npm login
```
- [ ] Create account at https://www.npmjs.com
- [ ] Login locally with `npm login`
- [ ] Verify with `npm whoami`

### 6. Test Installation Locally (Optional)
```bash
# From tracker directory
npm install -g .

# In another directory
node -e "const t = require('api-failure-tracker'); console.log(typeof t);"
# Should print: function
```
- [ ] Package installs without errors
- [ ] Can be required and used

### 7. Git Commit (Recommended)
```bash
git add tracker/
git commit -m "chore: prepare tracker as standalone npm package

- Add comprehensive package.json metadata
- Create README with examples and API reference
- Add .npmignore to exclude unnecessary files
- Ready for npm publication"
```
- [ ] Commit changes to version control
- [ ] Document the changes clearly

---

## 🚀 Publishing to NPM

### One-Time Setup
```bash
# Navigate to tracker directory
cd tracker

# Verify package.json metadata is complete
cat package.json

# Check what will be published
npm pack --dry-run
```

### Publish Command
```bash
# From tracker directory
npm publish
```

**Output should show:**
```
+ api-failure-tracker@1.0.0
```

### Verify Published Package
```bash
# Check on npm
npm view api-failure-tracker

# Install from npm (anywhere)
npm install api-failure-tracker

# Use it
const tracker = require('api-failure-tracker');
```

---

## 📈 Post-Publication

### 1. Update Main Project
If your main project uses the tracker, update to use published version:

**Before:**
```json
// Original path
const tracker = require('./tracker/tracker');
```

**After:**
```json
// Published package
const tracker = require('api-failure-tracker');
```

### 2. Link in Main README
Update main project's README to mention the standalone package:

```markdown
## Tracker Setup

### Option 1: Standalone Package (Recommended)
```bash
npm install api-failure-tracker
```

### Option 2: From Source
```bash
npm install ../tracker
```
```

### 3. Create Release Notes
```markdown
## Release v1.0.0 - api-failure-tracker

🎉 **Initial Release**

- Express middleware for API request/response tracking
- Real-time submission to visualization server
- Multi-service support
- Automatic error detection
- Local logging with retry logic

### Installation
```bash
npm install api-failure-tracker
```

### Quick Usage
```javascript
const tracker = require('api-failure-tracker');
app.use(tracker({
  serverUrl: 'http://localhost:5000'
}));
```

[See full documentation](https://www.npmjs.com/package/api-failure-tracker)
```

---

## 🔄 Future Updates

### Updating to New Version

When you fix bugs or add features:

```bash
# Update version in package.json
# 1.0.0 → 1.0.1 (patch/bugfix)
# 1.0.0 → 1.1.0 (new feature)
# 1.0.0 → 2.0.0 (breaking change)

npm version patch  # or minor, major, prerelease

npm publish
```

### Versioning Convention
- **1.0.1** - Bug fixes
- **1.1.0** - New features (backwards compatible)
- **2.0.0** - Breaking changes

---

## 📊 Package Statistics

After publishing, you can track:

```bash
# View package info
npm view api-failure-tracker

# Check download stats (after a few weeks)
npm view api-failure-tracker downloads

# Monitor package health
# Go to: https://www.npmjs.com/package/api-failure-tracker
```

---

## 🆘 Troubleshooting

### "npm ERR! 404 Unauthorized"
```bash
# Solution: Login first
npm login

# Verify login
npm whoami
```

### "Package name already exists"
The name `api-failure-tracker` might be taken. Choose alternative:
- `@yourname/api-failure-tracker`
- `api-tracker-middleware`
- `failure-tracker-express`

Update in `package.json` scoped name:
```json
"name": "@yourname/api-failure-tracker"
```

Then publish with:
```bash
npm publish --access public  // for scoped packages
```

### "ENEEDAUTH - Need to be logged in"
```bash
npm logout
npm login
npm publish
```

### "Not in marked or out of date"
Ensure you're publishing from the tracker directory:
```bash
cd tracker
git status  # Check directory
npm publish
```

---

## 📚 Package Structure (Published)

What users will get when they install:

```
node_modules/api-failure-tracker/
├── README.md           (documentation)
├── package.json        (metadata)
├── tracker.js          (main middleware)
├── sendLog.js          (helper for submissions)
└── logger.js           (local logging)
```

**NOT included** (due to .npmignore):
- node_modules/
- logs/
- examples
- .git/
- tests/

---

## ✨ Key Features Documented

The published package includes:

- ✅ Simple usage: `const tracker = require('api-failure-tracker')`
- ✅ Express middleware pattern: `app.use(tracker({...}))`
- ✅ Configuration options explained
- ✅ Multi-service support documented
- ✅ Security considerations noted
- ✅ Troubleshooting guide included
- ✅ Multiple code examples provided
- ✅ API reference complete
- ✅ Integration instructions clear
- ✅ Local logging explained

---

## 🎯 Next Steps (In Order)

1. **Update Metadata** (⚠️ Required)
   - [ ] Author name and email
   - [ ] GitHub username in URLs
   - [ ] Create LICENSE file

2. **Test Locally** (Recommended)
   - [ ] Run `npm pack --dry-run`
   - [ ] Verify included files

3. **Create npm Account** (Required)
   - [ ] Sign up at npmjs.com
   - [ ] Run `npm login`

4. **Publish** (Final Step)
   - [ ] Run `npm publish` from tracker directory
   - [ ] Verify with `npm view api-failure-tracker`

5. **Update Main Project** (Optional)
   - [ ] Update to use published version
   - [ ] Update main README

---

**Your tracker is ready to share with the world! 🚀**
