#!/bin/bash

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ to be ready..."
until rabbitmqctl status > /dev/null 2>&1; do
    echo "RabbitMQ is not ready yet, waiting..."
    sleep 2
done

echo "RabbitMQ is ready, importing definitions..."

# Import definitions using management API
curl -u ${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS} \
     -H "Content-Type: application/json" \
     -X POST \
     -d @/etc/rabbitmq/definitions.json \
     http://localhost:15672/api/definitions

echo "Definitions imported successfully!" 