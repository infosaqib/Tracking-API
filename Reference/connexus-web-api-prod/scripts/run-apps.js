#!/usr/bin/env node

/**
 * Script to run multiple NestJS applications concurrently with color coding
 *
 * Usage:
 *   node scripts/run-apps.js --apps=connexus-be,sow-rfq
 *   node scripts/run-apps.js --apps=connexus-be --port=3001
 *   node scripts/run-apps.js --all
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

// Available color combinations for apps
const appColors = [
  { name: 'blue', value: colors.blue },
  { name: 'green', value: colors.green },
  { name: 'yellow', value: colors.yellow },
  { name: 'magenta', value: colors.magenta },
  { name: 'cyan', value: colors.cyan },
  { name: 'brightRed', value: colors.brightRed },
  { name: 'brightGreen', value: colors.brightGreen },
  { name: 'brightBlue', value: colors.brightBlue },
  { name: 'brightMagenta', value: colors.brightMagenta },
  { name: 'brightCyan', value: colors.brightCyan },
];

// Parse command line arguments
const args = process.argv.slice(2);
const appFlag = args.find((arg) => arg.startsWith('--apps='));
const portFlag = args.find((arg) => arg.startsWith('--port='));
const allFlag = args.includes('--all');

let appNames = [];
let startingPort = portFlag ? parseInt(portFlag.split('=')[1], 10) : 3000;

// Find all available apps in the monorepo
const findAllApps = () => {
  const appsDir = path.join(__dirname, '..', 'apps');
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

// Determine which apps to run
if (allFlag) {
  appNames = findAllApps();
} else if (appFlag) {
  appNames = appFlag.split('=')[1].split(',');
} else {
  console.log('Please specify which apps to run:');
  console.log('  node scripts/run-apps.js --apps=connexus-be,sow-rfq');
  console.log('  node scripts/run-apps.js --all');
  process.exit(1);
}

// Prepare the processes to run
const processes = appNames.map((appName, index) => {
  const color = appColors[index % appColors.length];
  const port = startingPort + index;

  return {
    name: appName,
    color: color.value,
    colorName: color.name,
    command: 'nest',
    args: ['start', appName, '--watch'],
    env: { ...process.env, PORT: port.toString() },
  };
});

console.log('Starting the following applications:');
processes.forEach((proc) => {
  console.log(
    `${proc.color}[${proc.name}]${colors.reset} on port ${proc.env.PORT} (${proc.colorName})`,
  );
});

// Start all processes
processes.forEach((proc) => {
  const childProcess = spawn(proc.command, proc.args, {
    env: proc.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  // Helper function to format output with app name and color
  const formatOutput = (data) => {
    const lines = data.toString().trim().split('\n');
    return lines
      .map((line) => `${proc.color}[${proc.name}]${colors.reset} ${line}`)
      .join('\n');
  };

  // Handle process output
  childProcess.stdout.on('data', (data) => {
    console.log(formatOutput(data));
  });

  childProcess.stderr.on('data', (data) => {
    console.error(formatOutput(data));
  });

  // Handle process exit
  childProcess.on('close', (code) => {
    console.log(
      `${proc.color}[${proc.name}]${colors.reset} Process exited with code ${code}`,
    );
  });
});

// Handle SIGINT (Ctrl+C) to gracefully shut down all processes
process.on('SIGINT', () => {
  console.log('\nShutting down all applications...');
  process.exit();
});
