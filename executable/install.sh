#!/bin/bash

# Check if the script is run as root
if [ "$(id -u)" -ne 0 ]; then
   echo "This script must be run as root" 
   exit 1
fi

# Determine the home directory of the user who invoked the script (not root's home)
if [ $SUDO_USER ]; then
   USER_NAME=$SUDO_USER
   USER_HOME=$(eval echo ~$SUDO_USER)
else
   USER_NAME=$(whoami)
   USER_HOME=$HOME
fi

# Check if the key file exists
KEY_FILE="$USER_HOME/.marketshark/key"
if [ -f "$KEY_FILE" ]; then
    USER_KEY=$(tr -d '\0' < "$KEY_FILE")
    echo "Using saved MarketShark key."
else
    # Prompt the user for their key
    read -p "Enter your MarketShark key: " USER_KEY

    # Save the key to the file
    mkdir -p "$USER_HOME/.marketshark"
    echo "$USER_KEY" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
fi

# Validate the key by checking the response from the server
KEY_VALIDATION=$(curl -s "https://service.marketshark.net/cli?key=$USER_KEY")

if [[ "$KEY_VALIDATION" == "Invalid key." ]]; then
    echo "The key you provided is invalid. Please try again."
    exit 1
fi

if systemctl is-active --quiet marketshark.service; then
    echo "Stopping marketshark service..."
    sudo systemctl stop marketshark.service
fi

# Create the necessary directory if it doesn't exist
mkdir -p /usr/local/bin
mkdir -p "$USER_HOME/.marketshark"

# Ensure the user has ownership of the .marketshark directory
chown -R $USER_NAME:$USER_NAME "$USER_HOME/.marketshark"

# Download the MarketShark CLI and copy it to a shorter name
curl -o /usr/local/bin/marketshark "https://service.marketshark.net/cli?key=$USER_KEY"
if [ $? -ne 0 ]; then
    echo "Failed to download the MarketShark CLI. Please check your network connection and try again."
    exit 1
fi

# Make the downloaded CLI executable
chmod +x /usr/local/bin/marketshark

# Copy and make the shortcut executable
cp /usr/local/bin/marketshark /usr/local/bin/ms
chmod +x /usr/local/bin/ms

rm -f "$USER_HOME/.marketshark/service"

# Download the service file
curl -o "$USER_HOME/.marketshark/service" "https://service.marketshark.net/service?key=$USER_KEY"
if [ $? -ne 0 ]; then
    echo "Failed to download the MarketShark service file. Please check your network connection and try again."
    exit 1
fi

# Make the service file executable
chmod +x "$USER_HOME/.marketshark/service"

# Create a systemd service file
SERVICE_FILE="/etc/systemd/system/marketshark.service"

echo "[Unit]
Description=MarketShark Service
After=network.target

[Service]
ExecStart=$USER_HOME/.marketshark/service
Restart=always
RestartSec=5
User=$USER_NAME
WorkingDirectory=$USER_HOME/.marketshark/
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target" > $SERVICE_FILE

# Set permissions and reload systemd
chmod 644 $SERVICE_FILE
systemctl daemon-reload

# Enable and start the service
systemctl enable marketshark.service
systemctl start marketshark.service

sleep 1

# Ensure the new paths and aliases are loaded
source "$USER_HOME/.bashrc"

# Run the MarketShark CLI commands
ms login $USER_KEY
if [ $? -ne 0 ]; then
    echo "Failed to login to MarketShark."
    exit 1
fi

ms update
if [ $? -ne 0 ]; then
    echo "Failed to update MarketShark."
    exit 1
fi

echo "MarketShark setup and service installation completed successfully!"