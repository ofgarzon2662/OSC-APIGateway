#!/bin/bash
set -e

# Start RabbitMQ in the background
echo "Starting RabbitMQ..."
rabbitmq-server &
RABBITMQ_PID=$!

# Run the definitions import in the background
/usr/local/bin/init-definitions.sh &

# Wait for RabbitMQ process
wait $RABBITMQ_PID 