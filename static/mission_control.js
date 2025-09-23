/**
 * Mission Control Interface - JavaScript Controller
 * NASA-style mission control system for autonomous intelligence operations
 */

class MissionControlInterface {
    constructor() {
        this.missionActive = false;
        this.socket = null;
        this.missionClock = null;
        this.agents = {
            market_intelligence: { status: 'offline', task: 'Standby', confidence: 0.0, progress: 0 },
            technology_surveillance: { status: 'offline', task: 'Standby', confidence: 0.0, progress: 0 },
            policy_monitoring: { status: 'offline', task: 'Standby', confidence: 0.0, progress: 0 },
            osint_analysis: { status: 'offline', task: 'Standby', confidence: 0.0, progress: 0 },
            synthesis_agent: { status: 'offline', task: 'Standby', confidence: 0.0, progress: 0 }
        };
        this.missionStartTime = null;
        this.intelligenceCount = 0;
        this.currentPhase = 'DORMANT';
        this.nextBurstTime = null;

        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.initializeControls();
        this.startSystemClock();
        this.initializeWebSocket();
        this.performSystemCheck();
    }

    initializeEventListeners() {
        // Mission Control Buttons
        document.getElementById('startMission').addEventListener('click', () => this.startMission());
        document.getElementById('stopMission').addEventListener('click', () => this.stopMission());
        document.getElementById('emergencyBurst').addEventListener('click', () => this.triggerEmergencyBurst());

        // Stream Controls
        document.getElementById('clearStream').addEventListener('click', () => this.clearIntelligenceStream());
        document.getElementById('exportData').addEventListener('click', () => this.exportMissionData());

        // Parameter Controls
        document.getElementById('burstIntensity').addEventListener('input', (e) => this.updateBurstIntensity(e.target.value));
        document.getElementById('alertThreshold').addEventListener('input', (e) => this.updateAlertThreshold(e.target.value));

        // Focus Area Checkboxes
        ['marketFocus', 'techFocus', 'policyFocus', 'osintFocus'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateFocusAreas());
        });

        // Alert System
        document.getElementById('dismissAlert').addEventListener('click', () => this.dismissAlert());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    initializeControls() {
        // Initialize slider values
        this.updateBurstIntensity(document.getElementById('burstIntensity').value);
        this.updateAlertThreshold(document.getElementById('alertThreshold').value);
        this.updateFocusAreas();
    }

    startSystemClock() {
        this.missionClock = setInterval(() => {
            const now = new Date();
            const timeString = now.toTimeString().split(' ')[0];
            document.getElementById('missionClock').textContent = timeString;

            // Update next burst countdown if mission is active
            if (this.nextBurstTime && this.missionActive) {
                const timeDiff = this.nextBurstTime - now;
                if (timeDiff > 0) {
                    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                    document.getElementById('nextBurst').textContent =
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    document.getElementById('nextBurst').textContent = '00:00:00';
                }
            }
        }, 1000);
    }

    initializeWebSocket() {
        // Initialize WebSocket connection for real-time updates
        try {
            this.socket = new WebSocket('ws://localhost:5000/ws');

            this.socket.onopen = () => {
                console.log('🔌 Mission Control connected to backend');
                this.updateSystemStatus('online');
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.socket.onclose = () => {
                console.log('❌ Mission Control disconnected from backend');
                this.updateSystemStatus('offline');
                // Attempt reconnection after 5 seconds
                setTimeout(() => this.initializeWebSocket(), 5000);
            };

            this.socket.onerror = (error) => {
                console.error('🚨 WebSocket error:', error);
                this.updateSystemStatus('error');
            };
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.updateSystemStatus('offline');
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'mission_status':
                this.updateMissionStatus(data.payload);
                break;
            case 'agent_telemetry':
                this.updateAgentTelemetry(data.payload);
                break;
            case 'intelligence_finding':
                this.addIntelligenceFinding(data.payload);
                break;
            case 'mission_phase':
                this.updateMissionPhase(data.payload.phase);
                break;
            case 'system_alert':
                this.showAlert(data.payload);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    async startMission() {
        if (this.missionActive) return;

        console.log('🚀 Starting intelligence mission...');

        // Update UI
        this.missionActive = true;
        this.missionStartTime = new Date();
        this.updateMissionPhase('INITIALIZING');

        document.getElementById('startMission').disabled = true;
        document.getElementById('stopMission').disabled = false;

        // Get mission parameters
        const missionParams = this.getMissionParameters();

        try {
            // Send start command to backend
            const response = await fetch('/api/mission/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(missionParams)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Mission started successfully:', result);
                this.updateMissionPhase('OPERATIONAL');
                this.scheduleNextBurst();
                this.updateProgressDetails('Mission operations initiated');
            } else {
                throw new Error(`Failed to start mission: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Failed to start mission:', error);
            this.showAlert({
                type: 'error',
                message: `Mission start failed: ${error.message}`
            });
            this.stopMission();
        }
    }

    async stopMission() {
        if (!this.missionActive) return;

        console.log('🛑 Stopping intelligence mission...');

        try {
            // Send stop command to backend
            const response = await fetch('/api/mission/stop', {
                method: 'POST'
            });

            if (response.ok) {
                console.log('✅ Mission stopped successfully');
            }
        } catch (error) {
            console.error('❌ Failed to stop mission gracefully:', error);
        }

        // Update UI
        this.missionActive = false;
        this.missionStartTime = null;
        this.nextBurstTime = null;

        this.updateMissionPhase('DORMANT');
        document.getElementById('startMission').disabled = false;
        document.getElementById('stopMission').disabled = true;
        document.getElementById('nextBurst').textContent = '--:--:--';

        // Reset agent statuses
        Object.keys(this.agents).forEach(agentId => {
            this.agents[agentId] = { status: 'offline', task: 'Standby', confidence: 0.0, progress: 0 };
            this.updateAgentDisplay(agentId);
        });

        this.updateProgressDetails('Mission terminated');
    }

    async triggerEmergencyBurst() {
        if (!this.missionActive) {
            this.showAlert({
                type: 'warning',
                message: 'Cannot trigger emergency burst - mission not active'
            });
            return;
        }

        console.log('🚨 Triggering emergency intelligence burst...');

        try {
            const response = await fetch('/api/mission/emergency-burst', {
                method: 'POST'
            });

            if (response.ok) {
                console.log('✅ Emergency burst initiated');
                this.updateMissionPhase('EMERGENCY BURST');
                this.updateProgressDetails('Emergency intelligence gathering in progress');
            } else {
                throw new Error(`Failed to trigger emergency burst: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Failed to trigger emergency burst:', error);
            this.showAlert({
                type: 'error',
                message: `Emergency burst failed: ${error.message}`
            });
        }
    }

    getMissionParameters() {
        const focusAreas = [];
        if (document.getElementById('marketFocus').checked) focusAreas.push('market_intelligence');
        if (document.getElementById('techFocus').checked) focusAreas.push('technology_surveillance');
        if (document.getElementById('policyFocus').checked) focusAreas.push('policy_monitoring');
        if (document.getElementById('osintFocus').checked) focusAreas.push('osint_analysis');

        return {
            burst_intensity: parseInt(document.getElementById('burstIntensity').value),
            alert_threshold: parseFloat(document.getElementById('alertThreshold').value),
            focus_areas: focusAreas,
            max_burst_duration: 15 * 60, // 15 minutes in seconds
            burst_interval: 2 * 60 * 60   // 2 hours in seconds
        };
    }

    scheduleNextBurst() {
        // Schedule next burst in 2 hours
        this.nextBurstTime = new Date(Date.now() + (2 * 60 * 60 * 1000));
    }

    updateMissionPhase(phase) {
        this.currentPhase = phase;
        document.getElementById('currentPhase').textContent = phase;

        // Update progress bar based on phase
        const progressBar = document.getElementById('missionProgressBar');
        const progressText = document.getElementById('progressPercentage');

        switch (phase) {
            case 'DORMANT':
                progressBar.style.width = '0%';
                progressText.textContent = '0%';
                break;
            case 'INITIALIZING':
                progressBar.style.width = '15%';
                progressText.textContent = '15%';
                break;
            case 'OPERATIONAL':
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                break;
            case 'EMERGENCY BURST':
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                progressBar.style.backgroundColor = '#ff6b35'; // Emergency color
                break;
        }
    }

    updateMissionStatus(status) {
        if (status.cycle_id) {
            document.getElementById('cycleId').textContent = status.cycle_id;
        }
        if (status.intelligence_count !== undefined) {
            this.intelligenceCount = status.intelligence_count;
            document.getElementById('intelligenceCount').textContent = this.intelligenceCount;
        }
    }

    updateAgentTelemetry(telemetry) {
        const agentId = telemetry.agent_id;
        if (this.agents[agentId]) {
            this.agents[agentId] = {
                status: telemetry.status || 'offline',
                task: telemetry.current_task || 'Standby',
                confidence: telemetry.confidence || 0.0,
                progress: telemetry.progress || 0
            };
            this.updateAgentDisplay(agentId);
        }
    }

    updateAgentDisplay(agentId) {
        const agent = this.agents[agentId];
        const agentCard = document.querySelector(`[data-agent="${agentId}"]`);

        if (!agentCard || !agent) return;

        // Update status light
        const statusLight = agentCard.querySelector('.agent-status-light');
        statusLight.className = `agent-status-light ${agent.status}`;

        // Update metrics
        agentCard.querySelector('.agent-status-text').textContent = agent.status.toUpperCase();
        agentCard.querySelector('.agent-task').textContent = agent.task;
        agentCard.querySelector('.agent-confidence').textContent = agent.confidence.toFixed(2);
        agentCard.querySelector('.agent-progress').textContent = `${agent.progress}%`;
    }

    addIntelligenceFinding(finding) {
        const stream = document.getElementById('intelligenceStream');
        const placeholder = stream.querySelector('.stream-placeholder');

        // Remove placeholder if it exists
        if (placeholder) {
            placeholder.remove();
        }

        // Create finding element
        const findingElement = document.createElement('div');
        findingElement.className = 'intelligence-item';
        findingElement.innerHTML = `
            <div class="finding-header">
                <span class="finding-type">${finding.finding_type?.toUpperCase() || 'INTELLIGENCE'}</span>
                <span class="finding-agent">${finding.agent_id?.replace('_', ' ').toUpperCase()}</span>
                <span class="finding-time">${new Date(finding.timestamp).toLocaleTimeString()}</span>
                <span class="finding-confidence">CONF: ${(finding.confidence_score || 0).toFixed(2)}</span>
            </div>
            <div class="finding-content">${finding.content || 'No content available'}</div>
            ${finding.source_urls && finding.source_urls.length > 0 ?
                `<div class="finding-sources">
                    Sources: ${finding.source_urls.map(url => `<a href="${url}" target="_blank">[LINK]</a>`).join(' ')}
                </div>` : ''
            }
        `;

        // Add priority styling
        if (finding.priority && finding.priority >= 4) {
            findingElement.classList.add('high-priority');
        }

        // Insert at top of stream
        stream.insertBefore(findingElement, stream.firstChild);

        // Limit stream to 50 items
        while (stream.children.length > 50) {
            stream.removeChild(stream.lastChild);
        }

        // Update intelligence count
        this.intelligenceCount++;
        document.getElementById('intelligenceCount').textContent = this.intelligenceCount;

        // Show alert for high-priority findings
        if (finding.priority && finding.priority >= 4) {
            this.showAlert({
                type: 'priority',
                message: `High-priority intelligence: ${finding.content?.substring(0, 100)}...`
            });
        }
    }

    clearIntelligenceStream() {
        const stream = document.getElementById('intelligenceStream');
        stream.innerHTML = `
            <div class="stream-placeholder">
                <div class="placeholder-icon">📡</div>
                <div class="placeholder-text">Intelligence stream cleared</div>
                <div class="placeholder-subtext">Awaiting new intelligence data...</div>
            </div>
        `;
        this.intelligenceCount = 0;
        document.getElementById('intelligenceCount').textContent = '0';
    }

    async exportMissionData() {
        try {
            const response = await fetch('/api/mission/export');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `mission_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                console.log('✅ Mission data exported successfully');
            }
        } catch (error) {
            console.error('❌ Failed to export mission data:', error);
            this.showAlert({
                type: 'error',
                message: 'Failed to export mission data'
            });
        }
    }

    updateBurstIntensity(value) {
        document.getElementById('intensityValue').textContent = value;
    }

    updateAlertThreshold(value) {
        document.getElementById('thresholdValue').textContent = value;
    }

    updateFocusAreas() {
        // This could trigger real-time parameter updates to the backend
        if (this.missionActive) {
            const params = this.getMissionParameters();
            // Send updated parameters to backend
            this.sendParameterUpdate(params);
        }
    }

    async sendParameterUpdate(params) {
        try {
            await fetch('/api/mission/update-parameters', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
        } catch (error) {
            console.error('Failed to update mission parameters:', error);
        }
    }

    showAlert(alert) {
        const alertSystem = document.getElementById('alertSystem');
        const alertContent = document.getElementById('alertContent');

        alertContent.textContent = alert.message;
        alertSystem.classList.remove('hidden');

        // Auto-dismiss after 10 seconds for non-critical alerts
        if (alert.type !== 'priority') {
            setTimeout(() => this.dismissAlert(), 10000);
        }
    }

    dismissAlert() {
        document.getElementById('alertSystem').classList.add('hidden');
    }

    updateSystemStatus(status) {
        const systemStatus = document.getElementById('systemStatus');
        const statusText = document.querySelector('.status-text');

        systemStatus.className = `status-light ${status}`;

        switch (status) {
            case 'online':
                statusText.textContent = 'CLAUDE CODE ACTIVE';
                break;
            case 'offline':
                statusText.textContent = 'CONNECTION LOST';
                break;
            case 'error':
                statusText.textContent = 'SYSTEM ERROR';
                break;
        }
    }

    updateProgressDetails(details) {
        document.getElementById('progressDetails').textContent = details;
    }

    performSystemCheck() {
        // Simulate system diagnostics
        setTimeout(() => {
            document.getElementById('mcpStatus').textContent = 'OPERATIONAL';
            document.getElementById('dbStatus').textContent = 'CONNECTED';
            document.getElementById('claudeStatus').textContent = 'ACTIVE';
            document.getElementById('networkStatus').textContent = 'NOMINAL';
        }, 1000);

        // Simulate resource usage updates
        setInterval(() => {
            const cpuUsage = Math.floor(Math.random() * 30) + 20;
            const apiUsage = Math.floor(Math.random() * 20) + 5;
            const memoryUsage = Math.floor(Math.random() * 25) + 35;

            document.getElementById('cpuUsage').style.width = `${cpuUsage}%`;
            document.getElementById('cpuUsage').nextElementSibling.textContent = `${cpuUsage}%`;

            document.getElementById('apiUsage').style.width = `${apiUsage}%`;
            document.getElementById('apiUsage').nextElementSibling.textContent = `${apiUsage}%`;

            document.getElementById('memoryUsage').style.width = `${memoryUsage}%`;
            document.getElementById('memoryUsage').nextElementSibling.textContent = `${memoryUsage}%`;
        }, 5000);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Start Mission
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && !this.missionActive) {
            e.preventDefault();
            this.startMission();
        }

        // Ctrl/Cmd + X: Stop Mission
        if ((e.ctrlKey || e.metaKey) && e.key === 'x' && this.missionActive) {
            e.preventDefault();
            this.stopMission();
        }

        // Ctrl/Cmd + E: Emergency Burst
        if ((e.ctrlKey || e.metaKey) && e.key === 'e' && this.missionActive) {
            e.preventDefault();
            this.triggerEmergencyBurst();
        }

        // Escape: Dismiss Alert
        if (e.key === 'Escape') {
            this.dismissAlert();
        }
    }
}

// Initialize Mission Control when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Mission Control Interface...');
    window.missionControl = new MissionControlInterface();
    console.log('✅ Mission Control Interface ready');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.missionControl) {
        console.log('🌙 Mission Control interface hidden');
    } else if (window.missionControl) {
        console.log('☀️ Mission Control interface visible');
        // Refresh status when page becomes visible
        window.missionControl.performSystemCheck();
    }
});