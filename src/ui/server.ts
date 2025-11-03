import express from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { AuditNarrator } from '../services/audit-narrator';
import { OperationLogger } from '../services/operation-logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface WebUIConfig {
  port: number;
  host: string;
  projectPath: string;
  autoStart: boolean;
}

/**
 * Embedded Web UI for monitoring and managing audits
 */
export class WebUIServer {
  private app: express.Application;
  private server?: Server;
  private wsServer?: WebSocketServer;
  private projectPath: string;
  private config: WebUIConfig;

  constructor(config: WebUIConfig) {
    this.config = config;
    this.projectPath = config.projectPath;
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Start the Web UI server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          console.log(`🌐 Web UI running at http://${this.config.host}:${this.config.port}`);
          console.log(`📂 Serving project: ${this.projectPath}`);
          console.log(`📊 Monitoring .delobotomize in ${this.projectPath}`);
          resolve();
        });

        this.server.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🔴 Web UI server stopped');
          resolve();
        });
      }

      if (this.wsServer) {
        this.wsServer.close();
      }
    });

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          console.log(`🌐 Web UI running at http://${this.config.host}:${this.config.port}`);
          console.log(`📂 Serving project: ${this.projectPath}`);
          console.log(`📊 Monitoring .delobotomize in ${this.projectPath}`);
          resolve();
        });

        this.server.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, 'static')));

    // Serve client app
    this.app.use(express.static(path.join(__dirname, 'client')));

    // Parse JSON body
    this.app.use(express.json());

    // CORS for dev
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Main page
    this.app.get('/', async (req, res) => {
      try {
        const content = await fs.readFile(
          path.join(__dirname, 'client', 'index.html'),
          'utf-8'
        );
        res.send(content);
      } catch {
        res.status(404).send('Not found');
      }
    });

    // Get current narrative
    this.app.get('/api/narrative/:sessionId?', async (req, res) => {
      try {
        const { sessionId } = req.params;

        if (sessionId) {
          // Load specific session
          const narrative = await AuditNarrator.load(this.projectPath, sessionId);
          res.json({ success: true, data: narrative });
        } else {
          // List all sessions
          const sessions = await AuditNarrator.listSessions(this.projectPath);
          res.json({ success: true, data: sessions });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get operation log
    this.app.get('/api/logs/:sessionId?', async (req, res) => {
      try {
        const { sessionId, limit, filter } = req.query;

        const logs = await this.queryLogs(sessionId as string, {
          limit: limit ? parseInt(limit as string) : 50,
          ...(filter as any)
        });
        res.json({ success: true, data: logs });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get operation history for undo
    this.app.get('/api/history/:sessionId?', async (req, res) => {
      try {
        const { sessionId } = req.params;

        if (!sessionId || !this.logger) {
          res.json({ success: true, data: [] });
          return;
        }

        const history = await this.logger.getOperationHistory(sessionId);
        res.json({ success: true, data: history });
      } catch (error) {
        res.status(500).json({
         _success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get project structure
    this.app.get('/api/structure', async (req, res) => {
      try {
        const structure = await this.getProjectStructure();
        res.json({ success: true, data: structure });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get backup history
    this.app.get('/api/backups', async (req, res) => {
      try {
        const backups = await this.getBackupHistory();
        res.json({ success: true, data: backups });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Trigger backup
    this.app.post('/api/backup', async (req, res) => {
      try {
        const { reason } = req.body;
        const backupId = await this.createBackup(reason);
        res.json({ success: true, data: { backupId } });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Restore from backup
    this.app.post('/api/restore', async (req, res) => {
      try {
        const { backupId } = req.body;
        await this.restoreBackup(backupId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  private setupWebSocket(): void {
    this.wsServer = new WebSocketServer({
      noServer: this.server,
      path: '/ws'
    });

    this.wsServer.on('connection', (ws) => {
      console.log('📡 New WebSocket connection');

      // Send initial state
      this.sendInitialState(ws);

      // Watch for file changes
      const watcher = fs.watch(
        path.join(this.projectPath, '.delobotomize'),
        { recursive: true },
        async (eventType, filename) => {
          if (eventType === 'change' && filename) {
            ws.send(JSON.stringify({
              type: 'file_change',
              data: { filename, timestamp: new Date().toISOString() }
            }));
          }
        }
      );

      ws.on('close', () => {
        console.log('📡 WebSocket connection closed');
        watcher.close();
      });
    });
  }

  /**
   * Send initial state to new WebSocket client
   */
  private async sendInitialState(ws: WebSocket): Promise<void> {
    const state = {
      type: 'initial_state',
      data: {
        sessions: await AuditNarrator.listSessions(this.projectPath),
        structure: await this.getProjectStructure(),
        backups: await this.getBackupHistory()
      }
    };
    ws.send(JSON.stringify(state));
  }

  /**
   * Query operation logs
   */
  private async queryLogs(sessionId?: string, options: any = {}): Promise<any[]> {
    // This would use OperationLogger from active session
    // For now, return mock data
    return [];
  }

  /**
   * Get project structure for display
   */
  private async getProjectStructure(): Promise<any> {
    const config = {
      command: 'tree',
      args: ['-I', '-L', '2', this.projectPath],
      silent: true
    };

    try {
      const { execSync } = require('child_process');
      const output = execSync(`${config.command} ${config.args.join(' ')}`, config);
      return this.parseTreeOutput(output.toString());
    } catch {
      // Fallback to manual structure
      return this.buildManualStructure();
    }
  }

  /**
   * Parse tree output
   */
  private parseTreeOutput(output: string): any {
    const lines = output.split('\n');
    const structure = {};
    // Simple tree parser - would need more sophisticated logic
    return structure;
  }

  /**
   * Build manual structure
   */
  private async buildManualStructure(): Promise<any> {
    const dirs = {
      src: {}, tests: {}, docs: {}, '.claude': {}
    };

    // Scan specific directories
    for (const dir of ['src', 'tests', 'docs', '.claude']) {
      try {
        const dirPath = path.join(this.projectPath, dir);
        const stat = await fs.stat(dirPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(dirPath);
          dirs[dir] = {
            type: 'directory',
            contents: files.slice(0, 10) // Limit for display
          };
        }
      } catch {
        // Directory doesn't exist
      }
    }

    return dirs;
  }

  /**
   * Get backup history
   */
  private async getBackupHistory(): Promise<any[]> {
    try {
      const backupsDir = path.join(this.projectPath, '.delobotomize', 'backups');
      const backups = await fs.readdir(backupsDir);
      const history = [];

      for (const backup of backups.slice(-10)) { // Last 10 backups
        try {
          const backupPath = path.join(backupsDir, backup);
          const stat = await fs.stat(backupPath);
          history.push({
            id: backup,
            date: stat.mtime.toISOString(),
            size: 'Unknown'
          });
        } catch {
          // Skip invalid backup
        }
      }

      return history.reverse(); // Newest first
    } catch {
      return [];
    }
  }

  /**
   * Create backup
   */
  private async createBackup(reason?: string): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .substring(0, 19);

    const backupId = `${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
    console.log(`💾 Creating backup: ${backupId} (${reason || 'Manual'})`);

    // Backup logic would go here
    return backupId;
  }

  /**
   * Restore from backup
   */
  private async restoreBackup(backupId: string): Promise<void> {
    console.log(`📦 Restoring backup: ${backupId}`);
    // Restore logic would go here
  }
}