# Complete Setup Guide

This guide walks you through setting up the IoT Sensor Manager from scratch, assuming you're starting with a fresh system.

## System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Internet connection for MQTT broker access

## Step-by-Step Installation

### Step 1: Install Node.js

**Windows/macOS:**
1. Visit https://nodejs.org/
2. Download the LTS version
3. Run the installer and follow prompts
4. Verify installation:
   \`\`\`bash
   node --version
   npm --version
   \`\`\`

**Linux (Ubuntu/Debian):**
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### Step 2: Install Node-RED

\`\`\`bash
# Install Node-RED globally
npm install -g node-red

# Verify installation
node-red --version
\`\`\`

### Step 3: Configure Node-RED

1. **Start Node-RED for initial setup**
   \`\`\`bash
   node-red
   \`\`\`

2. **Stop Node-RED** (Ctrl+C)

3. **Edit settings file**
   \`\`\`bash
   # Linux/macOS
   nano ~/.node-red/settings.js
   
   # Windows
   notepad %USERPROFILE%\.node-red\settings.js
   \`\`\`

4. **Add these configurations**
   \`\`\`javascript
   module.exports = {
       // Web server settings
       uiPort: process.env.PORT || 1880,
       
       // Enable admin API
       httpAdminRoot: '/admin',
       
       // CORS settings for API access
       httpNodeCors: {
           origin: "*",
           methods: "GET,PUT,POST,DELETE"
       },
       
       // Security (for production, enable authentication)
       adminAuth: {
           type: "credentials",
           users: [{
               username: "admin",
               password: "$2b$08$UwxbFnM4hiGqvD0g4cABiOmPiJpvdelFVcdL7xNqeWznIrQyc6ILa", // password: "password"
               permissions: "*"
           }]
       },
       
       // Editor theme
       editorTheme: {
           projects: {
               enabled: true
           }
       }
   }
   \`\`\`

### Step 4: Install Required Node-RED Nodes

1. **Start Node-RED**
   \`\`\`bash
   node-red
   \`\`\`

2. **Open Node-RED in browser**: http://localhost:1880

3. **Install MQTT nodes**:
   - Click hamburger menu (☰) → Manage palette
   - Go to "Install" tab
   - Search for and install:
     - `node-red-contrib-mqtt-broker` (if not already included)
     - `node-red-dashboard` (optional, for dashboards)

### Step 5: Setup the Next.js Application

1. **Clone or create the project**
   \`\`\`bash
   # If you have the code
   git clone <repository-url>
   cd iot-sensor-manager
   
   # Or create new Next.js project and copy the code
   npx create-next-app@latest iot-sensor-manager --typescript --tailwind --eslint --app
   cd iot-sensor-manager
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Create environment file**
   \`\`\`bash
   # Create .env.local file
   touch .env.local
   \`\`\`

4. **Add environment variables**
   \`\`\`env
   # Node-RED Configuration
   NODE_RED_URL=http://localhost:1880
   
   # MQTT Configuration
   MQTT_BROKER_URL=broker.hivemq.com
   MQTT_PORT=1883
   
   # Development
   NEXT_PUBLIC_DEV_URL=http://localhost:3000
   \`\`\`

### Step 6: Test the Installation

1. **Start Node-RED** (in one terminal)
   \`\`\`bash
   node-red
   \`\`\`

2. **Start Next.js app** (in another terminal)
   \`\`\`bash
   cd iot-sensor-manager
   npm run dev
   \`\`\`

3. **Verify services**:
   - Node-RED: http://localhost:1880
   - Next.js App: http://localhost:3000

4. **Run connection test**:
   - Open http://localhost:3000
   - Go to "Testing" tab
   - Click "Test Connection"
   - Should show "Connection successful"

## Alternative MQTT Brokers

### Local Mosquitto Broker

**Install Mosquitto (Ubuntu/Debian):**
\`\`\`bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients

# Start service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
\`\`\`

**Install Mosquitto (macOS):**
\`\`\`bash
brew install mosquitto

# Start service
brew services start mosquitto
\`\`\`

**Install Mosquitto (Windows):**
1. Download from https://mosquitto.org/download/
2. Install and start the service
3. Default port: 1883

**Update configuration for local broker:**
\`\`\`env
MQTT_BROKER_URL=localhost
MQTT_PORT=1883
\`\`\`

### Cloud MQTT Brokers

**AWS IoT Core:**
\`\`\`env
MQTT_BROKER_URL=your-endpoint.iot.region.amazonaws.com
MQTT_PORT=8883
MQTT_USE_TLS=true
\`\`\`

**Azure IoT Hub:**
\`\`\`env
MQTT_BROKER_URL=your-hub.azure-devices.net
MQTT_PORT=8883
MQTT_USE_TLS=true
\`\`\`

## Development Workflow

### Daily Development

1. **Start services**
   \`\`\`bash
   # Terminal 1: Node-RED
   node-red
   
   # Terminal 2: Next.js
   cd iot-sensor-manager
   npm run dev
   \`\`\`

2. **Development URLs**
   - App: http://localhost:3000
   - Node-RED: http://localhost:1880
   - Node-RED Admin: http://localhost:1880/admin

### Testing Workflow

1. **Add a test sensor**
   - Use sensor ID: `test-sensor-01`
   - Keep default HiveMQ broker
   - Use sample temperature payload

2. **Verify Node-RED flow**
   - Check new flow tab appears
   - Verify MQTT input node configuration
   - Enable debug output

3. **Test data flow**
   - Use app's simulation feature
   - Monitor Node-RED debug panel
   - Verify JSON parsing works

### Production Deployment

**Environment Variables for Production:**
\`\`\`env
NODE_ENV=production
NODE_RED_URL=http://your-nodered-server:1880
MQTT_BROKER_URL=your-production-broker.com
MQTT_PORT=1883
MQTT_USERNAME=production-user
MQTT_PASSWORD=secure-password
\`\`\`

**Security Checklist:**
- [ ] Enable Node-RED authentication
- [ ] Use TLS for MQTT connections
- [ ] Implement API rate limiting
- [ ] Add input validation
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS for web interface
- [ ] Configure firewall rules

## Troubleshooting Common Issues

### Node-RED Won't Start

**Error: Port 1880 already in use**
\`\`\`bash
# Find process using port
lsof -i :1880  # macOS/Linux
netstat -ano | findstr :1880  # Windows

# Kill process or use different port
NODE_RED_PORT=1881 node-red
\`\`\`

**Error: Permission denied**
\`\`\`bash
# Linux: Fix permissions
sudo chown -R $USER:$USER ~/.node-red

# Or run with sudo (not recommended)
sudo node-red
\`\`\`

### MQTT Connection Issues

**Test MQTT connectivity:**
\`\`\`bash
# Install mosquitto clients
sudo apt-get install mosquitto-clients  # Linux
brew install mosquitto  # macOS

# Test publish
mosquitto_pub -h broker.hivemq.com -t "test/topic" -m "hello"

# Test subscribe
mosquitto_sub -h broker.hivemq.com -t "test/topic"
\`\`\`

**Common MQTT errors:**
- **Connection refused**: Check broker URL and port
- **Timeout**: Check firewall/network connectivity
- **Authentication failed**: Verify username/password

### Next.js Application Issues

**Port 3000 already in use:**
\`\`\`bash
# Use different port
npm run dev -- -p 3001
\`\`\`

**Module not found errors:**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

**API route errors:**
\`\`\`bash
# Check Node-RED is running
curl http://localhost:1880/settings

# Check CORS configuration in Node-RED settings.js
\`\`\`

## Getting Help

1. **Check logs**:
   - Node-RED: Terminal output or system logs
   - Next.js: Browser console and terminal
   - MQTT: Broker logs

2. **Common resources**:
   - Node-RED documentation: https://nodered.org/docs/
   - MQTT.org: https://mqtt.org/
   - Next.js docs: https://nextjs.org/docs

3. **Community support**:
   - Node-RED forum: https://discourse.nodered.org/
   - Stack Overflow: Tag questions with `node-red`, `mqtt`, `nextjs`

This completes the setup guide. You should now have a fully functional IoT sensor management system!
