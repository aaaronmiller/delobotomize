class DelobotomizeUI {
  constructor() {
    this.ws = null;
    this.currentSessionId = null;
    this.currentData = {
      sessions: [],
      narrative: null,
      timeline: [],
      metrics: {},
      structure: {},
      backups: []
    };

    this.init();
  }

  async init() {
    // Connect WebSocket
    await this.connectWebSocket();

    // Load initial data
    await this.loadInitialData();

    // Setup refresh interval
    setInterval(() => this.refreshData(), 5000);
  }

  async connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✓ Connected to Delobotomize server');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  async loadInitialData() {
    try {
      // Load all sessions
      const sessionsResponse = await this.fetchAPI('/api/narrative');
      if (sessionsResponse.success) {
        this.currentData.sessions = sessionsResponse.data;
        this.renderSessionList();

        // Load most recent session
        if (this.currentData.sessions.length > 0) {
          this.selectSession(this.currentData.sessions[0].sessionId);
        }
      }

      // Load project structure
      const structureResponse = await this.fetchAPI('/api/structure');
      if (structureResponse.success) {
        this.currentData.structure = structureResponse.data;
        this.renderStructure();
      }

      // Load backup history
      const backupsResponse = await this.fetchAPI('/api/backups');
      if (backupsResponse.success) {
        this.currentData.backups = backupsResponse.data;
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  async refreshData() {
    if (!this.currentSessionId) return;

    try {
      // Refresh narrative
      const narrativeResponse = await this.fetchAPI(`/api/narrative/${this.currentSessionId}`);
      if (narrativeResponse.success) {
        this.currentData.narrative = narrativeResponse.data;
        this.renderNarrative();
        this.updateMetrics();
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  }

  async selectSession(sessionId) {
    this.currentSessionId = sessionId;
    const session = this.currentData.sessions.find(s => s.sessionId === sessionId);

    // Update UI
    document.getElementById('current-session').textContent =
      session ? `${session.projectName} - ${new Date(session.startTime).toLocaleDateString()}` : 'No Session';

    // Update active session in list
    this.renderSessionList();

    // Load session data
    await this.refreshData();

    // Load operations for timeline
    if (sessionId) {
      const historyResponse = await this.fetchAPI(`/api/history/${sessionId}`);
      if (historyResponse.success) {
        this.currentData.timeline = historyResponse.data;
        this.renderTimeline();
      }
    }
  }

  async fetchAPI(path, options = {}) {
    const url = new URL(path, window.location.origin);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return data;
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'initial_state':
        this.currentData = {
          ...this.currentData,
          sessions: data.data.sessions,
          structure: data.data.structure,
          backups: data.data.backups
        };
        this.renderSessionList();
        this.renderStructure();
        break;

      case 'file_change':
        console.log('File changed:', data.data);
        // Could show notification or refresh structure
        break;

      case 'narrative_update':
        if (this.currentSessionId === data.data.sessionId) {
          this.refreshData();
        }
        break;
    }
  }

  renderSessionList() {
    const container = document.getElementById('session-list');
    const sessions = this.currentData.sessions;

    if (sessions.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary)">No sessions found</p>';
      return;
    }

    container.innerHTML = sessions.map(session => `
      <div class="session-item ${session.sessionId === this.currentSessionId ? 'active' : ''}"
           onclick="ui.selectSession('${session.sessionId}')">
        <div>
          <div>${session.projectName}</div>
          <div style="font-size: 0.8em; color: var(--text-secondary)">
            ${new Date(session.startTime).toLocaleDateString()} - ${session.status}
          </div>
        </div>
      </div>
    `).join('');
  }

  renderNarrative() {
    const container = document.getElementById('narrative-tab');
    const narrative = this.currentData.narrative;

    if (!narrative) {
      container.innerHTML = '<p style="color: var(--text-secondary)">No narrative loaded</p>';
      return;
    }

    const html = `
      <div class="narrative-section">
        <h3>📊 Overview</h3>
        <p>${narrative.sections?.overview || 'No overview available'}</p>
      </div>

      <div class="narrative-section">
        <h3>🚨 Issues Found</h3>
        ${narrative.sections?.issuesFound?.length > 0 ? (
          `<div class="issues-list">
            ${narrative.sections.issuesFound.map(issue => `
              <div class="issue-item issue-${issue.severity}">
                <div class="issue-header">
                  <span>${issue.id}</span>
                  <span class="issue-status">${issue.status}</span>
                </div>
                <div>${issue.description}</div>
              </div>
            `).join('')}
          </div>`
        ) : '<p style="color: var(--text-secondary)">No issues detected</p>'}
      </div>

      <div class="narrative-section">
        <h3>🔗 Cross-File Analysis</h3>
        ${narrative.sections?.crossFileAnalysis?.length > 0 ? (
          narrative.sections.crossFileAnalysis.map(analysis => `
            <p><strong>${analysis.description}</strong></p>
            <p style="color: var(--text-secondary)">
              Files: ${analysis.files?.join(', ') || 'None'}
            </p>
            <p>${analysis.resolution}</p>
          `).join('\n\n')
        ) : '<p style="color: var(--text-secondary)">No cross-file issues identified</p>'}
      </div>

      <div class="narrative-section">
        <h3>🛠️ Remediation Steps</h3>
        ${narrative.sections?.remediationSteps?.length > 0 ? (
          narrative.sections.remediationSteps.map(step => `
            <p>
              <strong>Step ${step.step}:</strong> ${step.action}
              <span style="color: var(--text-secondary)">(${step.status})</span>
            </p>
            ${step.result ? `<p style="color: var(--text-secondary)">${step.result}</p>` : ''}
          `).join('\n')
        ) : '<p style="color: var(--text-secondary)">No remediation steps recorded</p>'}
      </div>
    `;

    container.innerHTML = html;

    // Update status indicator
    const statusEl = document.getElementById('status-indicator');
    statusEl.className = `status-indicator status-${narrative.status || 'scanning'}`;
  }

  renderTimeline() {
    const container = document.getElementById('timeline-tab');
    const operations = this.currentData.timeline;

    if (operations.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary)">No operations recorded</p>';
      return;
    }

    const html = `
      <div class="timeline">
        ${operations.map(op => `
          <div class="timeline-item">
            <div class="timeline-time">${new Date(op.timestamp).toLocaleTimeString()}</div>
            <div>
              <strong>${op.operation}</strong>
              ${op.target ? `<div style="color: var(--text-secondary)">Target: ${op.target}</div>` : ''}
              ${op.result ? `<div style="color: ${op.result === 'success' ? 'var(--success)' : 'var(--error)'}">Result: ${op.result}</div>` : ''}
            </div>
            ${op.undoable ? `
              <button class="btn btn-secondary" style="margin-top: 10px" onclick="ui.undoOperation('${op.id}')">
                ↶ Undo
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  renderStructure() {
    const container = document.getElementById('project-structure');
    const structure = this.currentData.structure;

    const html = this.renderTree(structure, 0);
    container.innerHTML = `<div style="font-family: monospace; font-size: 0.9em;">${html}</div>`;
  }

  renderTree(node, level = 0) {
    if (typeof node === 'string') {
      return node;
    }

    let html = '';
    for (const [key, value] of Object.entries(node)) {
      const indent = '  '.repeat(level);
      const icon = typeof value === 'object' && value !== null ? '📁' : '📄';

      html += `${indent}${icon} ${key}\n`;

      if (typeof value === 'object' && value !== null) {
        html += this.renderTree(value, level + 1);
      }
    }

    return html;
  }

  updateMetrics() {
    const metrics = this.currentData.narrative?.metrics || {};

    document.getElementById('metric-files').textContent = metrics.filesScanned || 0;
    document.getElementById('metric-issues').textContent = metrics.issuesFound || 0;
    document.getElementById('metric-fixed').textContent = metrics.issuesFixed || 0;
    document.getElementById('metric-cost').textContent = `$${(metrics.cost || 0).toFixed(2)}`;
  }

  showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.textContent.toLowerCase().includes(tabName));
    });

    // Show/hide content
    document.getElementById('narrative-tab').style.display = tabName === 'narrative' ? 'block' : 'none';
    document.getElementById('timeline-tab').style.display = tabName === 'timeline' ? 'block' : 'none';
    document.getElementById('metrics-tab').style.display = tabName === 'metrics' ? 'block' : 'none';
  }

  async createBackup() {
    const reason = prompt('Enter reason for backup (optional):');

    try {
      const response = await this.fetchAPI('/api/backup', {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Manual backup from Web UI' })
      });

      if (response.success) {
        alert(`✓ Backup created: ${response.data.backupId}`);
        // Refresh backups list
        const backupsResponse = await this.fetchAPI('/api/backups');
        if (backupsResponse.success) {
          this.currentData.backups = backupsResponse.data;
        }
      } else {
        alert('Failed to create backup: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error creating backup: ' + error.message);
    }
  }

  showRestoreModal() {
    document.getElementById('restore-modal').classList.add('active');
    this.renderBackupList();
  }

  closeRestoreModal() {
    document.getElementById('restore-modal').classList.remove('active');
  }

  renderBackupList() {
    const container = document.getElementById('backup-list');
    const backups = this.currentData.backups;

    if (backups.length === 0) {
      container.innerHTML = '<p>No backups available</p>';
      document.getElementById('confirm-restore-btn').disabled = true;
      return;
    }

    let selectedBackup = null;

    container.innerHTML = backups.map(backup => `
      <div class="session-item" onclick="ui.selectBackup('${backup.id}')">
        <div>
          <div>${backup.date}</div>
          <div style="font-size: 0.8em; color: var(--text-secondary)">
            Size: ${backup.size}
          </div>
        </div>
      </div>
    `).join('');
  }

  selectBackup(backupId) {
    selectedBackup = backupId;
    document.querySelectorAll('#backup-list .session-item').forEach(item => {
      item.classList.toggle('active', item.textContent.includes(backupId));
    });
    document.getElementById('confirm-restore-btn').disabled = false;
  }

  async confirmRestore() {
    if (!selectedBackup) {
      alert('Please select a backup to restore');
      return;
    }

    if (!confirm(`Are you sure you want to restore backup ${selectedBackup}? This will overwrite current files.`)) {
      return;
    }

    try {
      const response = await this.fetchAPI('/api/restore', {
        method: 'POST',
        body: JSON.stringify({ backupId: selectedBackup })
      });

      if (response.success) {
        alert('✓ Backup restored successfully');
        this.closeRestoreModal();
        setTimeout(() => location.reload(), 2000);
      } else {
        alert('Failed to restore: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error restoring backup: ' + error.message);
    }
  }

  async undoOperation(operationId) {
    if (!confirm('Undo this operation?')) {
      return;
    }

    // This would trigger undo logic
    console.log('Undo operation:', operationId);
  }
}

// Initialize UI
const ui = new DelobotomizeUI();

// Global functions for button onclick handlers
window.ui = ui;
window.showTab = (tab) => ui.showTab(tab);
window.createBackup = () => ui.createBackup();
window.showRestoreModal = () => ui.showRestoreModal();
window.closeRestoreModal = () => ui.closeRestoreModal();
window.confirmRestore = () => ui.confirmRestore();
window.selectBackup = (id) => ui.selectBackup(id);
window.undoOperation = (id) => ui.undoOperation(id);