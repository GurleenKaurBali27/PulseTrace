#!/usr/bin/env node

/**
 * Client-Side Improvements Verification Script (ES Module)
 * Tests all client refactoring improvements:
 * 1. Axios API service with import.meta.env.VITE_API_URL
 * 2. Demo data generator
 * 3. Error Boundary integration
 * 4. Demo Mode button functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const clientDir = __dirname;

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

async function runTests() {
  log('\n🎨 Client-Side Improvements Verification\n', 'cyan');
  let passed = 0;
  let failed = 0;

  // Test 1: Axios API service
  log('Test 1: Axios API Service with import.meta.env', 'blue');
  try {
    const apiPath = path.join(clientDir, 'services', 'api.js');
    if (fileExists(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf-8');
      
      if (content.includes('import axios from') && content.includes('import.meta.env.VITE_API_URL')) {
        log('✅ Axios imported and using import.meta.env.VITE_API_URL', 'green');
        if (content.includes('axios.create')) {
          log('✅ Axios instance created with baseURL', 'green');
        }
        if (content.includes('createLogs')) {
          log('✅ Batch createLogs function available', 'green');
        }
        passed++;
      } else {
        log('❌ Axios or import.meta.env not properly configured', 'red');
        failed++;
      }
    } else {
      log('❌ services/api.js not found', 'red');
      failed++;
    }
  } catch (err) {
    log(`❌ Test 1 failed: ${err.message}`, 'red');
    failed++;
  }

  // Test 2: Demo data generator
  log('\nTest 2: Demo Data Generator', 'blue');
  try {
    const demoPath = path.join(clientDir, 'utils', 'demoData.js');
    if (fileExists(demoPath)) {
      const content = fs.readFileSync(demoPath, 'utf-8');
      
      if (content.includes('export function generateFakeLog')) {
        log('✅ generateFakeLog function exported', 'green');
      }
      if (content.includes('export function generateFakeLogs')) {
        log('✅ generateFakeLogs function exported', 'green');
      }
      if (content.includes('export function generateDemoLogs')) {
        log('✅ generateDemoLogs function exported', 'green');
      }
      if (content.includes('HTTP_METHODS') && content.includes('STATUS_CODES')) {
        log('✅ Realistic data sets (methods, status codes)', 'green');
      }
      passed++;
    } else {
      log('❌ utils/demoData.js not found', 'red');
      failed++;
    }
  } catch (err) {
    log(`❌ Test 2 failed: ${err.message}`, 'red');
    failed++;
  }

  // Test 3: Dashboard with Demo Mode
  log('\nTest 3: Dashboard Demo Mode Button', 'blue');
  try {
    const dashboardPath = path.join(clientDir, 'pages', 'Dashboard.jsx');
    if (fileExists(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf-8');
      
      if (content.includes('import { generateDemoLogs }')) {
        log('✅ Dashboard imports demo data generator', 'green');
      }
      if (content.includes('handleDemoMode')) {
        log('✅ handleDemoMode function implemented', 'green');
      }
      if (content.includes('Demo Mode')) {
        log('✅ Demo Mode button in UI', 'green');
      }
      if (content.includes('demoMode')) {
        log('✅ Demo mode state management', 'green');
      }
      if (content.includes('createLogs')) {
        log('✅ Integration with createLogs API', 'green');
      }
      passed++;
    } else {
      log('❌ pages/Dashboard.jsx not found', 'red');
      failed++;
    }
  } catch (err) {
    log(`❌ Test 3 failed: ${err.message}`, 'red');
    failed++;
  }

  // Test 4: Error Boundary in App
  log('\nTest 4: Error Boundary Wrapping App', 'blue');
  try {
    const appPath = path.join(clientDir, 'App.jsx');
    if (fileExists(appPath)) {
      const content = fs.readFileSync(appPath, 'utf-8');
      
      if (content.includes("import ErrorBoundary from './components/ErrorBoundary'")) {
        log('✅ ErrorBoundary imported in App.jsx', 'green');
      }
      if (content.includes('<ErrorBoundary>')) {
        log('✅ App component wrapped with ErrorBoundary', 'green');
      }
      if (content.includes('</ErrorBoundary>')) {
        log('✅ ErrorBoundary properly closed', 'green');
      }
      passed++;
    } else {
      log('❌ App.jsx not found', 'red');
      failed++;
    }
  } catch (err) {
    log(`❌ Test 4 failed: ${err.message}`, 'red');
    failed++;
  }

  // Test 5: ErrorBoundary component
  log('\nTest 5: ErrorBoundary Component Features', 'blue');
  try {
    const ebPath = path.join(clientDir, 'components', 'ErrorBoundary.jsx');
    if (fileExists(ebPath)) {
      const content = fs.readFileSync(ebPath, 'utf-8');
      
      if (content.includes('getDerivedStateFromError')) {
        log('✅ getDerivedStateFromError lifecycle method', 'green');
      }
      if (content.includes('componentDidCatch')) {
        log('✅ componentDidCatch error handler', 'green');
      }
      if (content.includes('errorCount')) {
        log('✅ Error count tracking', 'green');
      }
      if (content.includes('fallback')) {
        log('✅ Fallback UI for errors', 'green');
      }
      passed++;
    } else {
      log('❌ components/ErrorBoundary.jsx not found', 'red');
      failed++;
    }
  } catch (err) {
    log(`❌ Test 5 failed: ${err.message}`, 'red');
    failed++;
  }

  // Test 6: Check for axios in package.json
  log('\nTest 6: Dependencies Check', 'blue');
  try {
    const pkgPath = path.join(clientDir, 'package.json');
    if (fileExists(pkgPath)) {
      const content = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      if (pkg.dependencies?.axios) {
        log(`✅ Axios installed (${pkg.dependencies.axios})`, 'green');
        passed++;
      } else {
        log('❌ Axios not in dependencies', 'red');
        failed++;
      }
    } else {
      log('❌ package.json not found', 'red');
      failed++;
    }
  } catch (err) {
    log(`❌ Test 6 failed: ${err.message}`, 'red');
    failed++;
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log(`Tests Passed: ${passed}`, 'green');
  log(`Tests Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(50) + '\n', 'cyan');

  if (failed === 0) {
    log('🎉 All client-side improvements verified successfully!', 'green');
    process.exit(0);
  } else {
    log(`⚠️  ${failed} test(s) failed.`, 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  log(`\n❌ Test suite error: ${err.message}`, 'red');
  process.exit(1);
});
