# IoT Sensor Manager Setup Script
# This script automates the installation and configuration process

set -e  # Exit on any error

echo "🚀 IoT Sensor Manager Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js $NODE_VERSION found"
        else
            print_error "Node.js version 18+ required. Found: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm not found"
        exit 1
    fi
}

# Install Node-RED
install_node_red() {
    print_status "Installing Node-RED..."
    
    if command_exists node-red; then
        print_warning "Node-RED already installed"
        NODE_RED_VERSION=$(node-red --version)
        print_status "Current version: $NODE_RED_VERSION"
    else
        print_status "Installing Node-RED globally..."
        npm install -g node-red
        print_success "Node-RED installed successfully"
    fi
}

# Configure Node-RED
configure_node_red() {
    print_status "Configuring Node-RED..."
    
    # Create Node-RED directory if it doesn't exist
    NODE_RED_DIR="$HOME/.node-red"
    if [ ! -d "$NODE_RED_DIR" ]; then
        print_status "Creating Node-RED directory..."
        mkdir -p "$NODE_RED_DIR"
    fi
    
    # Create settings.js if it doesn't exist
    SETTINGS_FILE="$NODE_RED_DIR/settings.js"
    if [ ! -f "$SETTINGS_FILE" ]; then
        print_status "Creating Node-RED settings file..."
        cat > "$SETTINGS_FILE" << 'EOF'
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
    
    // Editor theme
    editorTheme: {
        projects: {
            enabled: true
        }
    },
    
    // Logging
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    }
}
EOF
        print_success "Node-RED settings configured"
    else
        print_warning "Node-RED settings file already exists"
    fi
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_error "package.json not found. Are you in the project directory?"
        exit 1
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    ENV_FILE=".env.local"
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << 'EOF'
# Node-RED Configuration
NODE_RED_URL=http://localhost:1880

# MQTT Configuration
MQTT_BROKER_URL=broker.hivemq.com
MQTT_PORT=1883

# Development
NEXT_PUBLIC_DEV_URL=http://localhost:3000
EOF
        print_success "Environment file created: $ENV_FILE"
    else
        print_warning "Environment file already exists: $ENV_FILE"
    fi
}

# Test installation
test_installation() {
    print_status "Testing installation..."
    
    # Start Node-RED in background
    print_status "Starting Node-RED..."
    node-red > /dev/null 2>&1 &
    NODE_RED_PID=$!
    
    # Wait for Node-RED to start
    sleep 5
    
    # Test Node-RED API
    if curl -s http://localhost:1880/settings > /dev/null; then
        print_success "Node-RED is running and accessible"
    else
        print_error "Node-RED is not responding"
        kill $NODE_RED_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop Node-RED
    kill $NODE_RED_PID 2>/dev/null || true
    sleep 2
    
    print_success "Installation test completed"
}

# Import sample flows
import_sample_flows() {
    print_status "Would you like to import sample Node-RED flows? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if [ -f "scripts/sample-flows.json" ]; then
            print_status "Sample flows available in scripts/sample-flows.json"
            print_status "To import:"
            print_status "1. Start Node-RED: node-red"
            print_status "2. Open http://localhost:1880"
            print_status "3. Menu → Import → select scripts/sample-flows.json"
            print_success "Sample flows ready for import"
        else
            print_warning "Sample flows file not found"
        fi
    fi
}

# Main setup function
main() {
    echo
    print_status "Starting IoT Sensor Manager setup..."
    echo
    
    check_requirements
    echo
    
    install_node_red
    echo
    
    configure_node_red
    echo
    
    install_dependencies
    echo
    
    create_env_file
    echo
    
    test_installation
    echo
    
    import_sample_flows
    echo
    
    print_success "Setup completed successfully!"
    echo
    print_status "Next steps:"
    print_status "1. Start Node-RED: node-red"
    print_status "2. Start the app: npm run dev"
    print_status "3. Open http://localhost:3000"
    echo
    print_status "For detailed instructions, see README.md"
}

# Run main function
main "$@"
