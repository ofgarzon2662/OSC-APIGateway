FROM rabbitmq:3-management

# Install curl for the initialization script
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
COPY definitions.json /etc/rabbitmq/definitions.json
COPY init-definitions.sh /usr/local/bin/init-definitions.sh

# Make the script executable
RUN chmod +x /usr/local/bin/init-definitions.sh

# Create a custom entrypoint that starts RabbitMQ and then imports definitions
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["rabbitmq-server"] 