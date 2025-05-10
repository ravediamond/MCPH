#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log with timestamp
function log(message) {
    console.log(`[fix-native-deps] [${new Date().toISOString()}] ${message}`);
}

log('Starting native dependencies fix');

const nativeDependencies = [
    '@tailwindcss/oxide',
    'lightningcss',
    '@parcel/watcher'
];

// Helper to safely run a build command
function safeBuild(packagePath) {
    try {
        if (!fs.existsSync(packagePath)) {
            log(`Skipping ${packagePath} - directory not found`);
            return false;
        }

        // Check if package has a build script
        const packageJsonPath = path.join(packagePath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            log(`Skipping ${packagePath} - package.json not found`);
            return false;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (!packageJson.scripts || !packageJson.scripts.build) {
            log(`Skipping ${packagePath} - no build script found`);
            return false;
        }

        log(`Building ${packagePath}`);
        const cwd = process.cwd();
        process.chdir(packagePath);
        execSync('npm run build', { stdio: 'inherit' });
        process.chdir(cwd);
        log(`Successfully built ${packagePath}`);
        return true;
    } catch (error) {
        log(`Error building ${packagePath}: ${error.message}`);
        // Don't fail the postinstall script, just continue
        return false;
    }
}

// Try to rebuild each native dependency
nativeDependencies.forEach(dep => {
    const depPath = path.join(process.cwd(), 'node_modules', dep);
    safeBuild(depPath);
});

// Check for platform-specific modules
const platform = process.platform;
const arch = process.arch;
log(`Running on platform: ${platform}, architecture: ${arch}`);

// Display npm version
try {
    const npmVersion = execSync('npm -v').toString().trim();
    log(`npm version: ${npmVersion}`);
} catch (error) {
    log(`Could not determine npm version: ${error.message}`);
}

log('Native dependencies fix completed');