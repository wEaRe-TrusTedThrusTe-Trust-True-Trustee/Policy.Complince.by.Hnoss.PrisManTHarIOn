#!/usr/bin/env node
// scripts/ghost-buster.js
// 🚨 Ghost Detection & Clean Code Enforcement System

import fs from 'fs';
import path from 'path';

// 🚫 FORBIDDEN PATTERNS (Ghost Detection Rules)
const FORBIDDEN_PATTERNS = [
    { pattern: /lovable\.dev/gi, name: 'Lovable.dev Reference' },
    { pattern: /hello-hug-wave/gi, name: 'Hello-Hug-Wave Project' },
    { pattern: /REPLACE_WITH_PROJECT_ID/gi, name: 'Placeholder ID' },
    { pattern: /onbiela\.dev/gi, name: 'Biela.dev Reference' },
    { pattern: /macaly-app\.com/gi, name: 'Macaly App Reference' },
    { pattern: /PLACEHOLDER/gi, name: 'Generic Placeholder' },
    { pattern: /TODO: FIX/gi, name: 'Unresolved TODO' }
];

// 📂 DIRECTORIES TO SCAN
const SCAN_TARGETS = [
    './urls-archive.html',
    './ENTERPRISE_ARCHITECTURE_COMPLETE.md',
    './ENTERPRISE_ARCHITECTURE.md',
    './ENTERPRISE_ARCHITECTURE_PART2.md',
    './ENTERPRISE_ARCHITECTURE_PART3.md',
    './URL_SYSTEM_STATUS.md',
    './SUPABASE_SETUP_GUIDE.md',
    './src'
];

// 🚫 IGNORE PATTERNS (Don't scan these)
const IGNORE_PATHS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'URL_ANALYSE',
    'ANALYSE_BERICHT',
    'URL_EXTRAKTION',
    'URL_TABELLE',
    'URL_LISTE',
    'ALLE_URLS'
];

console.log('\n🚀 Starting Ghost-Buster: Scanning for unauthorized references...\n');

let ghostCount = 0;
let filesScanned = 0;
const ghostFindings = [];

/**
 * Scan a single file for ghost patterns
 */
function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let fileHasGhost = false;

        FORBIDDEN_PATTERNS.forEach(({ pattern, name }) => {
            lines.forEach((line, lineNumber) => {
                if (pattern.test(line)) {
                    ghostCount++;
                    fileHasGhost = true;
                    
                    const finding = {
                        file: filePath,
                        line: lineNumber + 1,
                        pattern: name,
                        content: line.trim().substring(0, 80)
                    };
                    
                    ghostFindings.push(finding);
                    
                    console.error(`⚠️  GHOST DETECTED!`);
                    console.error(`   📄 File: ${filePath}`);
                    console.error(`   📍 Line: ${lineNumber + 1}`);
                    console.error(`   👻 Pattern: ${name}`);
                    console.error(`   💬 Content: ${line.trim().substring(0, 80)}...`);
                    console.error('');
                }
            });
        });

        if (!fileHasGhost) {
            filesScanned++;
        }
    } catch (error) {
        console.warn(`⚠️  Could not read file: ${filePath} - ${error.message}`);
    }
}

/**
 * Check if path should be ignored
 */
function shouldIgnore(fullPath) {
    return IGNORE_PATHS.some(ignorePath => fullPath.includes(ignorePath));
}

/**
 * Recursively walk directory
 */
function walkDir(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️  Directory not found: ${dir}`);
        return;
    }

    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        
        if (shouldIgnore(fullPath)) {
            return;
        }

        try {
            const stat = fs.lstatSync(fullPath);
            
            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else if (stat.isFile()) {
                // Only scan relevant file types
                if (/\.(ts|tsx|js|jsx|md|html|json|sql)$/.test(fullPath)) {
                    scanFile(fullPath);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Error accessing: ${fullPath}`);
        }
    });
}

/**
 * Main execution
 */
SCAN_TARGETS.forEach(target => {
    if (fs.existsSync(target)) {
        const stat = fs.lstatSync(target);
        
        if (stat.isDirectory()) {
            console.log(`📂 Scanning directory: ${target}`);
            walkDir(target);
        } else {
            console.log(`📄 Scanning file: ${target}`);
            scanFile(target);
        }
    } else {
        console.warn(`⚠️  Target not found: ${target}`);
    }
});

// 📊 FINAL REPORT
console.log('\n' + '═'.repeat(70));
console.log('📊 GHOST-BUSTER SCAN COMPLETE');
console.log('═'.repeat(70));
console.log(`✅ Files scanned (clean): ${filesScanned}`);
console.log(`👻 Ghost references found: ${ghostCount}`);
console.log('═'.repeat(70) + '\n');

if (ghostCount === 0) {
    console.log('✅ ✅ ✅ SYSTEM CLEAN: No ghosts or unauthorized references found!');
    console.log('🎉 Your codebase follows the Single Source of Truth principle!\n');
    process.exit(0);
} else {
    console.log('❌ ❌ ❌ GHOSTS DETECTED: System requires cleanup!');
    console.log('\n📋 Summary by Pattern:\n');
    
    // Group findings by pattern
    const grouped = {};
    ghostFindings.forEach(finding => {
        if (!grouped[finding.pattern]) {
            grouped[finding.pattern] = [];
        }
        grouped[finding.pattern].push(finding);
    });
    
    Object.entries(grouped).forEach(([pattern, findings]) => {
        console.log(`   👻 ${pattern}: ${findings.length} occurrence(s)`);
    });
    
    console.log('\n💡 Action Required:');
    console.log('   1. Review the findings above');
    console.log('   2. Replace ghost references with official URLs from project-constants.ts');
    console.log('   3. Remove placeholder IDs and TODOs');
    console.log('   4. Re-run this script to verify cleanup\n');
    
    process.exit(1);
}
