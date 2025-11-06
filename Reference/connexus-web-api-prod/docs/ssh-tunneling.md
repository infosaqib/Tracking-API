# SSH Tunneling Guide

This document explains how to set up and use SSH tunneling for secure database access in the Connexus environment.

## Overview

SSH tunneling is used to establish a secure connection to our PostgreSQL database through a bastion host. This method ensures database access is both secure and encrypted.

## Prerequisites

- SSH key pair (PEM file)
- Access to the bastion host
- Local PostgreSQL client

## Configuration

The SSH tunnel is configured with the following parameters:

```bash
REMOTE_HOST="<bastion-host-ip>"    # Bastion host IP
REMOTE_USER="<ssh-user>"           # SSH user
LOCAL_PORT="<local-port>"          # Local forwarding port
REMOTE_PORT="<remote-port>"        # Remote PostgreSQL port
DB_HOST="<database-hostname>"      # Database hostname
```

## Usage

We provide a shell script for managing the SSH tunnel. The script supports the following commands:

### Start the Tunnel

```bash
./ssh-tunneling.sh start
```

This command:

- Checks if a tunnel is already running
- Verifies the existence of the PEM file
- Establishes the SSH tunnel
- Maps local port to the remote database
- Provides connection status

### Stop the Tunnel

```bash
./ssh-tunneling.sh stop
```

This command:

- Identifies and terminates any running SSH tunnel processes
- Confirms when the tunnel is stopped

### Check Tunnel Status

```bash
./ssh-tunneling.sh status
```

This command:

- Shows if a tunnel is currently active
- Displays the PID if running
- Shows connection details

## Connection Details

When the tunnel is active, you can connect to the database using:

- Host: `localhost`
- Port: `<local-port>`

## Troubleshooting

1. **Tunnel Already Running**

   - Error: "Tunnel is already running"
   - Solution: Stop the existing tunnel first using the stop command

2. **Missing PEM File**

   - Error: "PEM file not found"
   - Solution: Ensure the PEM file exists at the specified location

3. **Connection Failed**
   - Error: "Failed to establish SSH tunnel"
   - Solution:
     - Verify bastion host is accessible
     - Check if the specified ports are available
     - Ensure PEM file has correct permissions

## Security Notes

- Keep your PEM file secure and never commit it to version control
- Always stop the tunnel when not in use
- Regularly rotate SSH keys according to security policies
- Monitor tunnel usage and implement proper access controls
