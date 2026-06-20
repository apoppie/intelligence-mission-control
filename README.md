# Intelligence Mission Control System

A NASA-inspired autonomous intelligence gathering system powered by Claude Code, featuring specialized agents, real-time monitoring, and 15-minute burst cycles.

## Features

🚀 **NASA-Style Mission Control Interface**
- Real-time mission telemetry and agent status monitoring
- CRT-style visual design with authentic terminal aesthetics
- Control levers for mission parameters and operational settings

🤖 **Specialized Intelligence Agents**
- **Market Intelligence**: Financial trends and economic indicators
- **Technology Surveillance**: Innovation tracking and patent monitoring
- **Policy Monitoring**: Regulatory changes and government communications
- **OSINT Analysis**: Open source intelligence and social sentiment
- **Synthesis Agent**: Cross-domain pattern recognition and meta-analysis

⚡ **Autonomous Operations**
- 15-minute intelligence bursts every 2 hours
- Emergency burst capability for urgent intelligence gathering
- Configurable burst intensity and alert thresholds

🔧 **Mission Control Features**
- Real-time WebSocket communication
- Mission data export capabilities
- System diagnostics and resource monitoring
- Focus area selection and parameter tuning

## Quick Start

### Prerequisites
- Python 3.8+
- Claude Code CLI installed and configured
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/apoppie/intelligence-mission-control.git
cd intelligence-mission-control
```

2. **Install dependencies:**
```bash
pip3 install -r requirements.txt
```

3. **Run the mission control system:**
```bash
python3 app.py
```

4. **Access Mission Control:**
Open your browser to `http://localhost:5000`

## Mission Control Operations

### Starting Operations
1. Configure mission parameters using the control levers
2. Select focus areas (Market Intel, Technology, Policy, OSINT)
3. Click "START OPERATIONS" to begin autonomous intelligence gathering
4. Monitor agent telemetry and intelligence stream in real-time

### Emergency Burst
- Use the "EMERGENCY BURST" button for immediate intelligence gathering
- Bypasses the 2-hour cycle for urgent situations
- All active agents execute simultaneous intelligence missions

### Parameter Controls
- **Burst Intensity** (1-10): Controls depth and duration of intelligence gathering
- **Alert Threshold** (0.1-1.0): Minimum confidence score for intelligence findings
- **Focus Areas**: Select which intelligence domains to monitor

## Architecture

### Mission Commander
Central orchestrator implementing NASA systems engineering principles:
- Manages 15-minute burst cycles every 2 hours
- Coordinates specialized intelligence agents
- Maintains mission telemetry and status tracking
- Implements the orchestrator-worker pattern

### Intelligence Agents
Specialized agents for different intelligence domains:
- Execute autonomous research using Claude Code
- Parse and structure intelligence findings
- Maintain confidence scoring and priority assessment
- Support cross-domain synthesis and pattern recognition

### Mission Control Interface
NASA-inspired web interface featuring:
- Real-time agent telemetry monitoring
- Mission status and progress tracking
- Parameter controls and operational settings
- Intelligence stream with live findings
- System diagnostics and resource usage

## Configuration

### Mission Parameters
Edit `modules/mission_commander.py` to modify:
- Default burst duration (15 minutes)
- Burst interval (2 hours)
- Agent confidence thresholds
- Maximum findings per burst

### Agent Specializations
Customize agent research focus in `modules/intelligence_agents.py`:
- Research prompts and guidelines
- Specialization areas and keywords
- Confidence scoring algorithms
- Finding classification systems

## Development

### Project Structure
```
intelligence-mission-control/
├── app.py                          # Flask backend with WebSocket support
├── modules/
│   ├── mission_commander.py        # Central orchestrator agent
│   └── intelligence_agents.py      # Specialized intelligence agents
├── templates/
│   └── mission_control.html        # Mission control interface
├── static/
│   ├── mission_control.css         # NASA-style visual design
│   └── mission_control.js          # Frontend control logic
├── requirements.txt                # Python dependencies
└── README.md                       # Project documentation
```

### Adding New Intelligence Agents
1. Create new agent class inheriting from `BaseIntelligenceAgent`
2. Implement `execute_intelligence_mission()` method
3. Define specialization guidelines in `_get_specialization_guidelines()`
4. Register agent in `IntelligenceAgentFactory`
5. Add agent card to mission control HTML interface

### Extending Mission Control
- Add new API endpoints in `app.py`
- Implement WebSocket events for real-time updates
- Extend mission parameters in `MissionParameters` dataclass
- Create new control elements in the HTML interface

## Claude Code Integration

This system leverages Claude Code for:
- Autonomous research execution via subprocess calls
- Structured intelligence finding generation
- Cross-domain pattern analysis and synthesis
- Real-time research coordination and orchestration

### Required Claude Code Setup
1. Install Claude Code CLI
2. Configure authentication
3. Ensure `claude` command is available in PATH
4. Test basic functionality: `claude --version`

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**🛰️ Mission Control Status: OPERATIONAL**

*Autonomous intelligence gathering powered by Claude Code*