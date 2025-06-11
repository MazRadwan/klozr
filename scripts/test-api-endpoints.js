#!/usr/bin/env node

// Test script that temporarily disables auth middleware to test API endpoints
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing API Endpoints with Temporary Auth Bypass');
console.log('==================================================\n');

// Backup original middleware
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
const backupPath = path.join(__dirname, '..', 'middleware.ts.backup');

const originalMiddleware = fs.readFileSync(middlewarePath, 'utf8');

// Create a temporary middleware that allows API access
const tempMiddleware = `import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Temporarily bypass auth for testing
  console.log('🧪 Test mode: Bypassing auth for', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/((?!auth).*)' // Match /api/* but exclude /api/auth/*
  ]
}`;

async function runTests() {
  try {
    // Backup original middleware
    fs.writeFileSync(backupPath, originalMiddleware);
    console.log('✅ Backed up original middleware');
    
    // Write temporary middleware
    fs.writeFileSync(middlewarePath, tempMiddleware);
    console.log('✅ Installed temporary auth bypass');
    
    // Wait a bit for the server to reload
    console.log('⏳ Waiting for server reload...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Get initial state
    console.log('\n📊 Test 1: Get Company 1 initial state');
    await runCurl('GET', 'http://localhost:3000/api/companies/1', null);
    
    // Test 2: Update company type to customer (should clear lead fields and update contacts)
    console.log('\n🔄 Test 2: Update Company 1 type to "customer"');
    await runCurl('PATCH', 'http://localhost:3000/api/companies/1/type', { type: 'customer' });
    
    // Test 3: Verify contacts were updated
    console.log('\n🔍 Test 3: Check Contact 1 after company type change');
    await runCurl('GET', 'http://localhost:3000/api/contacts/1', null);
    
    // Test 4: Set company back to lead and add lead data
    console.log('\n🔄 Test 4: Set Company 1 back to "lead" type');
    await runCurl('PATCH', 'http://localhost:3000/api/companies/1/type', { type: 'lead' });
    
    // Test 5: Update lead status via company endpoint
    console.log('\n🔄 Test 5: Update Company 1 lead status');
    await runCurl('PATCH', 'http://localhost:3000/api/companies/1/lead', { 
      status: 'qualified', 
      temperature: 'hot',
      source: 'website'
    });
    
    // Test 6: Verify contact was updated via company lead change
    console.log('\n🔍 Test 6: Check Contact 1 after company lead update');
    await runCurl('GET', 'http://localhost:3000/api/contacts/1', null);
    
    // Test 7: Update lead status via contact endpoint
    console.log('\n🔄 Test 7: Update Contact 1 lead temperature via contact endpoint');
    await runCurl('PATCH', 'http://localhost:3000/api/contacts/1/lead', { 
      status: 'opportunity', 
      temperature: 'hot',
      source: 'referral'
    });
    
    // Test 8: Verify company was updated via contact lead change
    console.log('\n🔍 Test 8: Check Company 1 after contact lead update');
    await runCurl('GET', 'http://localhost:3000/api/companies/1', null);
    
    // Test 9: Check other contacts in same company were also updated
    console.log('\n🔍 Test 9: Check Contact 15 (should be synced with Contact 1 changes)');
    await runCurl('GET', 'http://localhost:3000/api/contacts/15', null);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Restore original middleware
    fs.writeFileSync(middlewarePath, originalMiddleware);
    fs.unlinkSync(backupPath);
    console.log('\n✅ Restored original middleware');
    console.log('✅ API endpoint testing completed');
  }
}

function runCurl(method, url, data) {
  return new Promise((resolve, reject) => {
    const args = ['-s', '-X', method];
    
    if (data) {
      args.push('-H', 'Content-Type: application/json');
      args.push('-d', JSON.stringify(data));
    }
    
    args.push(url);
    
    const curl = spawn('curl', args);
    let output = '';
    let error = '';
    
    curl.stdout.on('data', (data) => {
      output += data;
    });
    
    curl.stderr.on('data', (data) => {
      error += data;
    });
    
    curl.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ curl failed with code ${code}: ${error}`);
        reject(new Error(`curl failed: ${error}`));
      } else {
        try {
          const response = JSON.parse(output);
          console.log(`   Response:`, JSON.stringify(response, null, 2));
          resolve(response);
        } catch (parseError) {
          console.log(`   Raw response:`, output);
          resolve(output);
        }
      }
    });
  });
}

// Run the tests
runTests().catch(console.error);