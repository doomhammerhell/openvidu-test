#!/bin/bash

# Function to check and restart service if needed
check_and_restart() {
    local service_name=$1
    
    if ! docker ps --filter "name=$service_name" --format '{{.Names}}' | grep -q "^$service_name$"; then
        echo "$(date) - $service_name is down. Attempting to restart..."
        docker-compose up -d $service_name
        sleep 10
        
        if docker ps --filter "name=$service_name" --format '{{.Names}}' | grep -q "^$service_name$"; then
            echo "$(date) - $service_name successfully restarted"
        else
            echo "$(date) - Failed to restart $service_name. Manual intervention may be required"
            # Send notification here if needed
        fi
    else
        echo "$(date) - $service_name is running normally"
    fi
}

# Check all OpenVidu services
check_and_restart "openvidu-server"
check_and_restart "openvidu-coturn"
check_and_restart "openvidu-proxy"

# Check logs for errors
check_logs() {
    local service_name=$1
    local log_file="./logs/$service_name.log"
    
    if [ -f "$log_file" ]; then
        if grep -i "error\|exception\|fatal" "$log_file" > /dev/null; then
            echo "$(date) - Found errors in $service_name logs"
            # You can add additional error handling here
        fi
    fi
}

# Check logs for each service
check_logs "openvidu-server"
check_logs "coturn"
check_logs "nginx"
