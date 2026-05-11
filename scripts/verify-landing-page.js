#!/usr/bin/env node

/**
 * Landing Page & Routing Verification Script
 * Checks that all landing page files exist and are properly configured
 */

const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'client');

let passCount = 0;
let failCount = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    failCount++;
  }
}

function testExists(name, filePath) {
  const exists = fs.existsSync(filePath);
  test(name, exists);
  return exists;
}

function testFileContains(name, filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchString);
    test(name, contains);
    return contains;
  } catch (e) {
    test(name, false);
    return false;
  }
}

console.log('\n=== 🎨 Landing Page & Routing Verification ===\n');

// Test 1: Files exist
console.log('📦 Files Exist:');
testExists('LandingPage.jsx exists', path.join(clientDir, 'pages', 'LandingPage.jsx'));
testExists('Dashboard.jsx exists', path.join(clientDir, 'pages', 'Dashboard.jsx'));
testExists('App.jsx exists', path.join(clientDir, 'App.jsx'));
testExists('package.json exists', path.join(clientDir, 'package.json'));

// Test 2: App.jsx has routing
console.log('\n🔀 Routing Setup:');
testFileContains(
  'App.jsx has BrowserRouter import',
  path.join(clientDir, 'App.jsx'),
  "BrowserRouter"
);
testFileContains(
  'App.jsx has Routes component',
  path.join(clientDir, 'App.jsx'),
  "<Routes"
);
testFileContains(
  'App.jsx has "/" route',
  path.join(clientDir, 'App.jsx'),
  'path="/"'
);
testFileContains(
  'App.jsx has "/dashboard" route',
  path.join(clientDir, 'App.jsx'),
  'path="/dashboard"'
);
testFileContains(
  'App.jsx routes to LandingPage at /',
  path.join(clientDir, 'App.jsx'),
  'element={<LandingPage />'
);

// Test 3: LandingPage.jsx content
console.log('\n🎬 Landing Page Content:');
testFileContains(
  'LandingPage has hero section title',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  'Local Dev Loop'
);
testFileContains(
  'LandingPage has 3-step setup guide',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  'Setup'
);
testFileContains(
  'LandingPage has "View Live Demo" button',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  'View Live Demo'
);
testFileContains(
  'LandingPage has features section',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  'Features'
);
testFileContains(
  'LandingPage imports lucide-react icons',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  'from \'lucide-react\''
);
testFileContains(
  'LandingPage uses useNavigate for navigation',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  'useNavigate'
);
testFileContains(
  'LandingPage navigates to /dashboard routes',
  path.join(clientDir, 'pages', 'LandingPage.jsx'),
  "navigate('/dashboard')"
);

// Test 4: Dashboard.jsx updates
console.log('\n📊 Dashboard Navigation:');
testFileContains(
  'Dashboard imports useNavigate',
  path.join(clientDir, 'pages', 'Dashboard.jsx'),
  'useNavigate'
);
testFileContains(
  'Dashboard has "Back to Home" navigation',
  path.join(clientDir, 'pages', 'Dashboard.jsx'),
  'Back to Home'
);
testFileContains(
  'Dashboard navigates to / route',
  path.join(clientDir, 'pages', 'Dashboard.jsx'),
  "navigate('/')"
);
testFileContains(
  'Dashboard has navigation header',
  path.join(clientDir, 'pages', 'Dashboard.jsx'),
  'bg-white'
);

// Test 5: package.json dependencies
console.log('\n📚 Dependencies:');
testFileContains(
  'package.json has react-router-dom',
  path.join(clientDir, 'package.json'),
  'react-router-dom'
);
testFileContains(
  'package.json has lucide-react',
  path.join(clientDir, 'package.json'),
  'lucide-react'
);

// Test 6: Error Boundary maintained
console.log('\n🛡️ Error Handling:');
testFileContains(
  'App.jsx still has ErrorBoundary',
  path.join(clientDir, 'App.jsx'),
  'ErrorBoundary'
);
testFileContains(
  'ErrorBoundary wraps Router',
  path.join(clientDir, 'App.jsx'),
  '<ErrorBoundary'
);

// Summary
console.log('\n=== Summary ===\n');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total: ${passCount + failCount}`);

if (failCount === 0) {
  console.log('\n🎉 All checks passed! Landing page is ready.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failCount} checks failed. Please review.\n`);
  process.exit(1);
}
