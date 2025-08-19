# MQTT Testing Script
# Tests MQTT connectivity and publishes sample sensor data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default configuration
BROKER_URL="broker.hivemq.com"
BROKER_PORT="1883"
SENSOR_ID="test-sensor-$(date +%s)"
TOPIC="sensors/$SENSOR_ID/data"

# Check if mosquitto clients are installed
check_mosquitto() {
    if ! command -v mosquitto_pub >/dev/null 2>&1; then
        print_error "mosquitto_pub not found"
        print_status "Install with:"
        print_status "  Ubuntu/Debian: sudo apt-get install mosquitto-clients"
        print_status "  macOS: brew install mosquitto"
        print_status "  Windows: Download from https://mosquitto.org/download/"
        exit 1
    fi
    
    if ! command -v mosquitto_sub >/dev/null 2>&1; then
        print_error "mosquitto_sub not found"
        exit 1
    fi
    
    print_success "Mosquitto clients found"
}

# Test MQTT connection
test_connection() {
    print_status "Testing MQTT connection to $BROKER_URL:$BROKER_PORT..."
    
    # Test with a simple publish
    if mosquitto_pub -h "$BROKER_URL" -p "$BROKER_PORT" -t "test/connection" -m "test" -q 0; then
        print_success "MQTT connection successful"
    else
        print_error "MQTT connection failed"
        exit 1
    fi
}

# Generate sample sensor data
generate_sensor_data() {
    local sensor_type="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    case "$sensor_type" in
        "temperature")
            local value=$(awk 'BEGIN{srand(); print 15 + rand() * 25}')  # 15-40°C
            echo "{\"value\": $value, \"unit\": \"°C\", \"type\": \"temperature\", \"sensorId\": \"$SENSOR_ID\", \"timestamp\": \"$timestamp\"}"
            ;;
        "humidity")
            local value=$(awk 'BEGIN{srand(); print 30 + rand() * 50}')  # 30-80%
            echo "{\"value\": $value, \"unit\": \"%\", \"type\": \"humidity\", \"sensorId\": \"$SENSOR_ID\", \"timestamp\": \"$timestamp\"}"
            ;;
        "pressure")
            local value=$(awk 'BEGIN{srand(); print 980 + rand() * 40}')  # 980-1020 hPa
            echo "{\"value\": $value, \"unit\": \"hPa\", \"type\": \"pressure\", \"sensorId\": \"$SENSOR_ID\", \"timestamp\": \"$timestamp\"}"
            ;;
        *)
            local value=$(awk 'BEGIN{srand(); print rand() * 100}')
            echo "{\"value\": $value, \"unit\": \"units\", \"type\": \"generic\", \"sensorId\": \"$SENSOR_ID\", \"timestamp\": \"$timestamp\"}"
            ;;
    esac
}

# Publish sensor data
publish_sensor_data() {
    local sensor_type="$1"
    local count="${2:-5}"
    local interval="${3:-2}"
    
    print_status "Publishing $count $sensor_type readings to topic: $TOPIC"
    print_status "Interval: ${interval}s"
    
    for i in $(seq 1 "$count"); do
        local data=$(generate_sensor_data "$sensor_type")
        print_status "Publishing message $i/$count: $data"
        
        if mosquitto_pub -h "$BROKER_URL" -p "$BROKER_PORT" -t "$TOPIC" -m "$data" -q 0; then
            print_success "Message $i published"
        else
            print_error "Failed to publish message $i"
        fi
        
        if [ "$i" -lt "$count" ]; then
            sleep "$interval"
        fi
    done
}

# Subscribe to sensor data
subscribe_sensor_data() {
    local timeout="${1:-30}"
    
    print_status "Subscribing to topic: $TOPIC"
    print_status "Timeout: ${timeout}s (Press Ctrl+C to stop)"
    
    timeout "$timeout" mosquitto_sub -h "$BROKER_URL" -p "$BROKER_PORT" -t "$TOPIC" -q 0 || true
}

# Interactive mode
interactive_mode() {
    echo
    print_status "MQTT Testing Interactive Mode"
    echo "=============================="
    
    while true; do
        echo
        echo "Options:"
        echo "1. Test connection"
        echo "2. Publish temperature data"
        echo "3. Publish humidity data"
        echo "4. Publish pressure data"
        echo "5. Subscribe to sensor data"
        echo "6. Custom publish"
        echo "7. Exit"
        echo
        
        read -p "Select option (1-7): " choice
        
        case "$choice" in
            1)
                test_connection
                ;;
            2)
                read -p "Number of messages (default: 5): " count
                count=${count:-5}
                read -p "Interval in seconds (default: 2): " interval
                interval=${interval:-2}
                publish_sensor_data "temperature" "$count" "$interval"
                ;;
            3)
                read -p "Number of messages (default: 5): " count
                count=${count:-5}
                read -p "Interval in seconds (default: 2): " interval
                interval=${interval:-2}
                publish_sensor_data "humidity" "$count" "$interval"
                ;;
            4)
                read -p "Number of messages (default: 5): " count
                count=${count:-5}
                read -p "Interval in seconds (default: 2): " interval
                interval=${interval:-2}
                publish_sensor_data "pressure" "$count" "$interval"
                ;;
            5)
                read -p "Timeout in seconds (default: 30): " timeout
                timeout=${timeout:-30}
                subscribe_sensor_data "$timeout"
                ;;
            6)
                read -p "Topic: " custom_topic
                read -p "Message: " custom_message
                mosquitto_pub -h "$BROKER_URL" -p "$BROKER_PORT" -t "$custom_topic" -m "$custom_message" -q 0
                print_success "Custom message published"
                ;;
            7)
                print_status "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Usage information
usage() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo
    echo "Commands:"
    echo "  test                Test MQTT connection"
    echo "  publish TYPE COUNT  Publish sensor data (TYPE: temperature|humidity|pressure)"
    echo "  subscribe           Subscribe to sensor data"
    echo "  interactive         Interactive mode (default)"
    echo
    echo "Options:"
    echo "  -h, --host HOST     MQTT broker host (default: $BROKER_URL)"
    echo "  -p, --port PORT     MQTT broker port (default: $BROKER_PORT)"
    echo "  -s, --sensor ID     Sensor ID (default: auto-generated)"
    echo "  -t, --topic TOPIC   MQTT topic (default: sensors/SENSOR_ID/data)"
    echo "  --help              Show this help"
    echo
    echo "Examples:"
    echo "  $0 test"
    echo "  $0 publish temperature 10"
    echo "  $0 -h localhost publish humidity 5"
    echo "  $0 subscribe"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            BROKER_URL="$2"
            shift 2
            ;;
        -p|--port)
            BROKER_PORT="$2"
            shift 2
            ;;
        -s|--sensor)
            SENSOR_ID="$2"
            TOPIC="sensors/$SENSOR_ID/data"
            shift 2
            ;;
        -t|--topic)
            TOPIC="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        test)
            COMMAND="test"
            shift
            ;;
        publish)
            COMMAND="publish"
            SENSOR_TYPE="$2"
            COUNT="$3"
            shift 3
            ;;
        subscribe)
            COMMAND="subscribe"
            shift
            ;;
        interactive)
            COMMAND="interactive"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "MQTT Testing Script"
    print_status "Broker: $BROKER_URL:$BROKER_PORT"
    print_status "Sensor ID: $SENSOR_ID"
    print_status "Topic: $TOPIC"
    echo
    
    check_mosquitto
    
    case "${COMMAND:-interactive}" in
        test)
            test_connection
            ;;
        publish)
            test_connection
            publish_sensor_data "${SENSOR_TYPE:-temperature}" "${COUNT:-5}" 2
            ;;
        subscribe)
            test_connection
            subscribe_sensor_data 30
            ;;
        interactive)
            test_connection
            interactive_mode
            ;;
    esac
}

# Run main function
main "$@"
