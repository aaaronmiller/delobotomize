#!/usr/bin/env node

/**
 * Start Delobotomize Web UI
 * This script serves the web interface for monitoring audits
 */

import { WebUIServer } from '../src/ui/server';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface StartOptions {
  port?: number;
  host?: string;
  path?: string;
  auto?: boolean;
}

function parseArgs(): StartOptions {
  const args = process.argv.slice(2);
  const options: StartOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-p':
      case '--port':
        options.port = parseInt(args[++i]);
        break;
      case '-h':
      case '--host':
        options.host = args[++i];
        break;
      case '--auto':
        options.auto = true;
        break;
      default:
        options.path = args[i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  // Find project path
  let projectPath = options.path || process.cwd();

  // If a path is provided, validate it
  if (options.path && options.path !== process.cwd()) {
    try {
      const fs = await import('fs/promises');
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) {
        console.error(`❌ Path is not a directory: ${projectPath}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Invalid path: ${projectPath}`);
      process.exit(1);
    }
  }

  const config = {
    port: options.port || 3000,
    host: options.host || 'localhost',
    projectPath,
    autoStart: options.auto || false
  };

  console.log(`🌐 Starting Delobotomize Web UI...`);
  console.log(`📂 Project: ${projectPath}`);
  console.log(`🌍 URL: http://${config.host}:${config.port}`);

  const server = new WebUIServer(config);

  try {
    await server.start();

    console.log(`\n✅ Web UI is running!`);
    console.log(`   • URL: http://${config.host}:${config.port}`);
    console.log(`   • Project: ${projectPath}`);
    console.log(`   • Monitoring: ${config.autoStart ? 'Auto-started' : 'Manual start'}`);
    if (!config.autoStart) {
      console.log(`\n💡 Tip: Use --auto to start monitoring automatically`);
    }

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log(`\n🔴 Stopping Web UI...`);
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log(`\n🔴 Stopping Web UI...`);
      await server.stop();
      process.exit(0);
    });

    // Keep process running
    console.log(`\nPress Ctrl+C to stop`);

  } catch (error) {
    console.error(`❌ Failed to start Web UI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main();