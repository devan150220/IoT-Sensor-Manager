# IoT Sensor Manager (MQTT + Node-RED + Next.js)

End-to-end sample to add sensors, auto-create Node-RED flows, and publish test data via MQTT.

## Quick Start

1. Install Node.js 18+ and npm.
2. Install Node-RED globally: `npm install -g node-red`
3. Install dependencies: `npm install`
4. Start Node-RED in a new terminal: `node-red`
   - Verify: open http://localhost:1880
5. Start Next.js app: `npm run dev` then open http://localhost:3000

Set env in `.env.local`:

```
NODE_RED_BASE_URL=http://localhost:1880
```

## Health Check

`GET /api/node-red/health` returns Node-RED status.

# IoT Sensor Manager

A complete end-to-end IoT sensor management system that connects sensors using MQTT, automates Node-RED workflows, and provides a modern web interface for monitoring and testing.

## Features

- **Web Interface**: Modern Next.js app with Shadcn UI components
- **MQTT Integration**: Connect to any MQTT broker (HiveMQ public broker included)
- **Node-RED Automation**: Automatically generate and deploy flows for new sensors
- **Real-time Testing**: Built-in MQTT testing suite with connection validation
- **Sensor Simulation**: Generate realistic sensor data for testing
- **Flow Management**: Create, deploy, and manage Node-RED flows via API

## Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │    Node-RED     │    │  MQTT Broker    │
│                 │    │                 │    │                 │
│ • Sensor Forms  │◄──►│ • Auto Flows    │◄──►│ • HiveMQ Public │
│ • Management UI │    │ • Data Process  │    │ • Custom Broker │
│ • MQTT Testing  │    │ • Debug Output  │    │ • Local Mosquitto│
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Node-RED installed globally
- MQTT broker access (HiveMQ public broker works out of the box)

### Installation

1. **Clone and Install Dependencies**
   \`\`\`bash
   git clone <your-repo-url>
   cd iot-sensor-manager
   npm install
   \`\`\`

2. **Install Node-RED Globally**
   \`\`\`bash
   npm install -g node-red
   \`\`\`

3. **Start Node-RED**
   \`\`\`bash
   node-red
   \`\`\`
   Node-RED will be available at http://localhost:1880

4. **Start the Next.js App**
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be available at http://localhost:3000

5. **Test the Setup**
   - Open http://localhost:3000
   - Go to the "Testing" tab
   - Run a connection test to verify MQTT connectivity

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

\`\`\`env
# Node-RED Configuration
NODE_RED_URL=http://localhost:1880

# MQTT Configuration (Optional - defaults to HiveMQ public)
MQTT_BROKER_URL=broker.hivemq.com
MQTT_PORT=1883

# Development
NEXT_PUBLIC_DEV_URL=http://localhost:3000
\`\`\`

### Node-RED Configuration

1. **Install Required Nodes**
   
   In Node-RED, go to Menu → Manage Palette → Install and add:
   \`\`\`
   node-red-contrib-mqtt-broker
   \`\`\`

2. **Enable Admin API**
   
   Edit your Node-RED settings file (`~/.node-red/settings.js`):
   \`\`\`javascript
   module.exports = {
       // Enable the admin API
       httpAdminRoot: '/admin',
       
       // Allow CORS for API access
       httpNodeCors: {
           origin: "*",
           methods: "GET,PUT,POST,DELETE"
       },
       
       // Enable projects (optional)
       editorTheme: {
           projects: {
               enabled: true
           }
       }
   }
   \`\`\`

3. **Restart Node-RED**
   \`\`\`bash
   node-red-stop
   node-red
   \`\`\`

## Usage Guide

### Adding Your First Sensor

1. **Navigate to "Add Sensor" Tab**
   - Enter a unique Sensor ID (e.g., `temp-sensor-01`)
   - Use the default HiveMQ broker: `broker.hivemq.com`
   - Topic will auto-generate as: `sensors/temp-sensor-01/data`

2. **Configure Sample Payload**
   \`\`\`json
   {
     "value": 25.5,
     "timestamp": "2025-08-19T12:00:00Z",
     "unit": "°C",
     "sensorId": "temp-sensor-01"
   }
   \`\`\`

3. **Test Connection**
   - Click "Test Connection" to verify MQTT broker connectivity
   - Click "Create Sensor Flow" to generate the Node-RED flow

4. **Verify in Node-RED**
   - Open http://localhost:1880
   - You should see a new flow tab for your sensor
   - The flow includes: MQTT In → JSON Parser → Debug

### Testing MQTT Communication

1. **Connection Test**
   - Go to "Testing" tab → "Connection"
   - Test connectivity to your MQTT broker

2. **Message Publishing**
   - Go to "Testing" tab → "Publish"
   - Send test messages to verify the complete pipeline

3. **Sensor Simulation**
   - Go to "Testing" tab → "Simulate"
   - Generate realistic sensor data automatically
   - Monitor messages in Node-RED debug panel

### Monitoring Sensors

1. **Sensor Dashboard**
   - View all configured sensors in the "Sensors" tab
   - Monitor connection status and last seen timestamps
   - Manage sensor lifecycle (connect/disconnect/delete)

2. **Node-RED Debug**
   - Open Node-RED at http://localhost:1880
   - Click the debug tab to see incoming sensor data
   - Each sensor has its own debug node for isolated monitoring

## Sample Node-RED Flow

Here's a manual Node-RED flow you can import for testing:

\`\`\`json
[
  {
    "id": "sample-flow",
    "type": "tab",
    "label": "Sample Sensor Flow",
    "disabled": false,
    "info": "Manual test flow for MQTT sensor data"
  },
  {
    "id": "mqtt-in-node",
    "type": "mqtt in",
    "z": "sample-flow",
    "name": "Sensor Input",
    "topic": "sensors/+/data",
    "qos": "0",
    "datatype": "auto-detect",
    "broker": "hivemq-broker",
    "x": 120,
    "y": 100,
    "wires": [["json-parser"]]
  },
  {
    "id": "json-parser",
    "type": "json",
    "z": "sample-flow",
    "name": "Parse JSON",
    "property": "payload",
    "action": "obj",
    "pretty": false,
    "x": 300,
    "y": 100,
    "wires": [["debug-output"]]
  },
  {
    "id": "debug-output",
    "type": "debug",
    "z": "sample-flow",
    "name": "Sensor Data",
    "active": true,
    "tosidebar": true,
    "console": false,
    "complete": "payload",
    "x": 480,
    "y": 100,
    "wires": []
  },
  {
    "id": "hivemq-broker",
    "type": "mqtt-broker",
    "name": "HiveMQ Public",
    "broker": "broker.hivemq.com",
    "port": "1883",
    "clientid": "nodered-test",
    "autoConnect": true,
    "usetls": false,
    "protocolVersion": "4"
  }
]
\`\`\`

To import:
1. Copy the JSON above
2. In Node-RED: Menu → Import → Paste JSON → Import
3. Deploy the flow
4. Test with the app's simulation feature

## API Reference

### Node-RED Flow Management

**Create Flow**
\`\`\`http
POST /api/node-red/flows
Content-Type: application/json

{
  "sensorId": "temp-sensor-01",
  "brokerUrl": "broker.hivemq.com",
  "topic": "sensors/temp-sensor-01/data",
  "samplePayload": "{\"value\": 25.5}"
}
\`\`\`

**Delete Flow**
\`\`\`http
DELETE /api/node-red/flows/{flowId}
\`\`\`

### MQTT Testing

**Test Connection**
\`\`\`http
POST /api/mqtt/test
Content-Type: application/json

{
  "brokerUrl": "broker.hivemq.com",
  "topic": "test/connection",
  "payload": "{\"test\": true}"
}
\`\`\`

**Publish Message**
\`\`\`http
POST /api/mqtt/publish
Content-Type: application/json

{
  "brokerUrl": "broker.hivemq.com",
  "topic": "sensors/test/data",
  "payload": "{\"value\": 25.5}",
  "qos": 0
}
\`\`\`

## Troubleshooting

### Common Issues

**1. Node-RED Connection Failed**
- Ensure Node-RED is running on port 1880
- Check if admin API is enabled in settings.js
- Verify CORS settings allow localhost:3000

**2. MQTT Connection Issues**
- Test with HiveMQ public broker first: `broker.hivemq.com`
- Check firewall settings for port 1883
- Verify broker URL format (no protocol prefix)

**3. Flows Not Appearing**
- Check Node-RED logs for deployment errors
- Ensure unique sensor IDs (no duplicates)
- Refresh Node-RED browser tab

**4. No Debug Output**
- Verify debug nodes are enabled (green dot)
- Check MQTT topic matches exactly
- Ensure JSON payload is valid

### Debug Commands

**Check Node-RED Status**
\`\`\`bash
curl http://localhost:1880/settings
\`\`\`

**Test MQTT Publish (using mosquitto)**
\`\`\`bash
# Install mosquitto clients
sudo apt-get install mosquitto-clients

# Publish test message
mosquitto_pub -h broker.hivemq.com -t "sensors/test/data" -m '{"value": 25.5, "timestamp": "2025-08-19T12:00:00Z"}'
\`\`\`

**View Node-RED Logs**
\`\`\`bash
# If running as service
journalctl -u node-red -f

# If running manually
# Logs appear in terminal where node-red was started
\`\`\`

## Advanced Configuration

### Custom MQTT Broker

To use your own MQTT broker:

1. **Update Environment Variables**
   \`\`\`env
   MQTT_BROKER_URL=your-broker.com
   MQTT_PORT=1883
   MQTT_USERNAME=your-username
   MQTT_PASSWORD=your-password
   \`\`\`

2. **Configure Authentication in Node-RED**
   - Edit broker configuration nodes
   - Add username/password in Security tab
   - Enable TLS if required

### Database Integration

To persist sensor data:

1. **Add Database Nodes to Flows**
   - Install `node-red-contrib-influxdb` or similar
   - Add database output nodes after JSON parser
   - Configure connection settings

2. **Example InfluxDB Integration**
   \`\`\`javascript
   // Add to Node-RED flow after JSON parser
   {
     "type": "influxdb out",
     "measurement": "sensor_data",
     "fields": "value,unit",
     "tags": "sensorId"
   }
   \`\`\`

### Production Deployment

**Security Considerations**
- Enable authentication in Node-RED
- Use TLS for MQTT connections
- Implement API rate limiting
- Add input validation and sanitization

**Scaling**
- Use MQTT broker clustering
- Implement horizontal scaling for Next.js
- Add Redis for session management
- Use load balancers for high availability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Node-RED documentation: https://nodered.org/docs/
- MQTT protocol reference: https://mqtt.org/
- Open an issue in this repository
