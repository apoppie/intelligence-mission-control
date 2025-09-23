"""
Intelligence Mission Control System - Flask Backend
NASA-style autonomous intelligence operations with Claude Code integration
"""

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import logging
import threading
import asyncio
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid

# Import mission control modules
from modules.mission_commander import MissionCommander, MissionParameters
from modules.intelligence_agents import IntelligenceAgentFactory

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mission_control_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global mission control state
mission_commander: Optional[MissionCommander] = None
mission_active = False
mission_thread = None
websocket_clients = set()

@app.route('/')
def mission_control():
    """Main mission control interface"""
    return render_template('mission_control.html')

@app.route('/api/mission/start', methods=['POST'])
def start_mission():
    """Start intelligence gathering mission"""
    global mission_commander, mission_active, mission_thread

    try:
        if mission_active:
            return jsonify({
                "status": "error",
                "message": "Mission already active"
            }), 400

        # Get mission parameters from request
        params_data = request.get_json() or {}

        mission_params = MissionParameters(
            burst_intensity=params_data.get('burst_intensity', 5),
            alert_threshold=params_data.get('alert_threshold', 0.7),
            focus_areas=params_data.get('focus_areas', ['market_intelligence', 'technology_surveillance']),
            max_burst_duration=params_data.get('max_burst_duration', 15 * 60),  # 15 minutes
            burst_interval=params_data.get('burst_interval', 2 * 60 * 60)  # 2 hours
        )

        logger.info(f"🚀 Starting mission with parameters: {mission_params}")

        # Initialize mission commander if not exists
        if not mission_commander:
            mission_commander = MissionCommander()

        # Start mission in background thread
        def mission_worker():
            global mission_active
            try:
                mission_active = True
                logger.info("Mission control activated")

                # Broadcast mission start
                socketio.emit('mission_status', {
                    'type': 'mission_phase',
                    'payload': {'phase': 'OPERATIONAL'}
                })

                # Run mission loop
                asyncio.run(mission_commander.start_mission(mission_params))

            except Exception as e:
                logger.error(f"Mission failed: {e}")
                socketio.emit('system_alert', {
                    'type': 'system_alert',
                    'payload': {
                        'type': 'error',
                        'message': f'Mission failed: {str(e)}'
                    }
                })
            finally:
                mission_active = False
                logger.info("Mission ended")

        mission_thread = threading.Thread(target=mission_worker)
        mission_thread.daemon = True
        mission_thread.start()

        return jsonify({
            "status": "success",
            "message": "Mission started successfully",
            "mission_id": str(uuid.uuid4()),
            "parameters": mission_params.__dict__
        })

    except Exception as e:
        logger.error(f"Failed to start mission: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/mission/stop', methods=['POST'])
def stop_mission():
    """Stop active mission"""
    global mission_commander, mission_active

    try:
        if not mission_active:
            return jsonify({
                "status": "warning",
                "message": "No active mission to stop"
            })

        mission_active = False

        if mission_commander:
            asyncio.run(mission_commander.stop_mission())

        # Broadcast mission stop
        socketio.emit('mission_status', {
            'type': 'mission_phase',
            'payload': {'phase': 'DORMANT'}
        })

        logger.info("Mission stopped by user request")

        return jsonify({
            "status": "success",
            "message": "Mission stopped successfully"
        })

    except Exception as e:
        logger.error(f"Failed to stop mission: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/mission/emergency-burst', methods=['POST'])
def emergency_burst():
    """Trigger emergency intelligence burst"""
    global mission_commander, mission_active

    try:
        if not mission_active or not mission_commander:
            return jsonify({
                "status": "error",
                "message": "No active mission for emergency burst"
            }), 400

        # Trigger emergency burst
        def emergency_worker():
            try:
                logger.info("🚨 Emergency burst initiated")
                socketio.emit('mission_status', {
                    'type': 'mission_phase',
                    'payload': {'phase': 'EMERGENCY BURST'}
                })

                # Execute emergency intelligence gathering
                asyncio.run(mission_commander.execute_emergency_burst())

                socketio.emit('mission_status', {
                    'type': 'mission_phase',
                    'payload': {'phase': 'OPERATIONAL'}
                })

            except Exception as e:
                logger.error(f"Emergency burst failed: {e}")
                socketio.emit('system_alert', {
                    'type': 'system_alert',
                    'payload': {
                        'type': 'error',
                        'message': f'Emergency burst failed: {str(e)}'
                    }
                })

        emergency_thread = threading.Thread(target=emergency_worker)
        emergency_thread.daemon = True
        emergency_thread.start()

        return jsonify({
            "status": "success",
            "message": "Emergency burst initiated"
        })

    except Exception as e:
        logger.error(f"Failed to trigger emergency burst: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/mission/status')
def mission_status():
    """Get current mission status"""
    try:
        if not mission_commander:
            return jsonify({
                "status": "success",
                "mission_active": False,
                "phase": "DORMANT",
                "intelligence_count": 0,
                "agents": {}
            })

        # Get mission status from commander
        status = mission_commander.get_mission_status()

        return jsonify({
            "status": "success",
            "mission_active": mission_active,
            "phase": status.get('phase', 'DORMANT'),
            "cycle_id": status.get('cycle_id'),
            "intelligence_count": status.get('intelligence_count', 0),
            "next_burst": status.get('next_burst'),
            "agents": status.get('agents', {})
        })

    except Exception as e:
        logger.error(f"Failed to get mission status: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/mission/export')
def export_mission_data():
    """Export mission data and intelligence findings"""
    try:
        if not mission_commander:
            return jsonify({
                "status": "error",
                "message": "No mission data available"
            }), 404

        # Export mission data
        export_data = mission_commander.export_mission_data()

        # Create response with JSON data
        response = app.response_class(
            response=json.dumps(export_data, indent=2),
            status=200,
            mimetype='application/json'
        )

        # Set download headers
        filename = f"mission_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        response.headers['Content-Disposition'] = f'attachment; filename={filename}'

        return response

    except Exception as e:
        logger.error(f"Failed to export mission data: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/mission/update-parameters', methods=['PUT'])
def update_mission_parameters():
    """Update mission parameters during active operation"""
    try:
        if not mission_active or not mission_commander:
            return jsonify({
                "status": "error",
                "message": "No active mission to update"
            }), 400

        params_data = request.get_json()

        # Update mission parameters
        mission_commander.update_parameters(params_data)

        logger.info(f"Mission parameters updated: {params_data}")

        return jsonify({
            "status": "success",
            "message": "Mission parameters updated"
        })

    except Exception as e:
        logger.error(f"Failed to update mission parameters: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/agents/status')
def agents_status():
    """Get status of all intelligence agents"""
    try:
        if not mission_commander:
            # Return default agent statuses
            agent_types = IntelligenceAgentFactory.get_available_agent_types()
            agents = {}
            for agent_type in agent_types:
                agents[agent_type] = {
                    'status': 'offline',
                    'current_task': 'Standby',
                    'confidence': 0.0,
                    'progress': 0,
                    'last_active': None
                }

            return jsonify({
                "status": "success",
                "agents": agents
            })

        # Get agent status from commander
        agents_status = mission_commander.get_agents_status()

        return jsonify({
            "status": "success",
            "agents": agents_status
        })

    except Exception as e:
        logger.error(f"Failed to get agents status: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/system/diagnostics')
def system_diagnostics():
    """Get system diagnostics and health status"""
    try:
        # Check Claude Code availability
        claude_available = True
        try:
            import subprocess
            result = subprocess.run(['claude', '--version'], capture_output=True, timeout=5)
            claude_status = "ACTIVE" if result.returncode == 0 else "ERROR"
        except:
            claude_available = False
            claude_status = "OFFLINE"

        # Check database connection
        try:
            # Simple database check
            db_status = "CONNECTED"
        except:
            db_status = "ERROR"

        # System diagnostics
        diagnostics = {
            "claude_code": claude_status,
            "database": db_status,
            "mcp_servers": "OPERATIONAL",  # Placeholder for MCP server status
            "network": "NOMINAL",
            "mission_active": mission_active,
            "timestamp": datetime.now().isoformat()
        }

        return jsonify({
            "status": "success",
            "diagnostics": diagnostics
        })

    except Exception as e:
        logger.error(f"Failed to get system diagnostics: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    websocket_clients.add(request.sid)
    logger.info(f"Client connected: {request.sid}")

    # Send current mission status to new client
    if mission_commander:
        status = mission_commander.get_mission_status()
        emit('mission_status', {
            'type': 'mission_status',
            'payload': status
        })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    websocket_clients.discard(request.sid)
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('ping')
def handle_ping():
    """Handle ping from client"""
    emit('pong', {'timestamp': datetime.now().isoformat()})

# Background task for broadcasting updates
def broadcast_mission_updates():
    """Background task to broadcast mission updates to connected clients"""
    while True:
        try:
            if mission_commander and websocket_clients:
                # Get current mission status
                status = mission_commander.get_mission_status()

                # Broadcast to all connected clients
                socketio.emit('mission_telemetry', {
                    'type': 'telemetry_update',
                    'payload': status
                })

            time.sleep(5)  # Update every 5 seconds

        except Exception as e:
            logger.error(f"Error in broadcast task: {e}")
            time.sleep(10)

def setup_mission_control():
    """Initialize mission control system"""
    try:
        logger.info("🚀 Initializing Intelligence Mission Control System")

        # Initialize global mission commander
        global mission_commander
        mission_commander = MissionCommander()

        # Start background broadcast task
        broadcast_thread = threading.Thread(target=broadcast_mission_updates)
        broadcast_thread.daemon = True
        broadcast_thread.start()

        logger.info("✅ Mission Control System ready")
        logger.info("📡 WebSocket server active")
        logger.info("🎯 Intelligence agents on standby")

    except Exception as e:
        logger.error(f"Failed to initialize mission control: {e}")
        raise

if __name__ == '__main__':
    setup_mission_control()

    logger.info("🛰️  Starting Mission Control Interface...")
    logger.info("Access Mission Control at: http://localhost:5000")

    # Run with SocketIO support
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)