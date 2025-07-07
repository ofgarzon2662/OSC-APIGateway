# Environment Variables

This document lists all the environment variables required for the OSC API Gateway.

## Database Configuration
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=organization
DB_USER=postgres
DB_PASSWORD=postgres
```

## JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h
```

## Admin Users Configuration
```
ADMIN1_USERNAME=admin1
ADMIN1_EMAIL=admin1@example.com
ADMIN1_PASSWORD=admin123
ADMIN1_ROLES=admin

ADMIN2_USERNAME=admin2
ADMIN2_EMAIL=admin2@example.com
ADMIN2_PASSWORD=admin456
ADMIN2_ROLES=admin
```

## Submission Listener Configuration
```
SUBMISSION_LISTENER_API_KEY=your-submission-listener-api-key
SUBMISSION_LISTENER_SERVICE_ROLE=submitter_listener
SUBMISSION_LISTENER_USERNAME=submission_listener
```

## RabbitMQ Configuration
```
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

## Notes

- The RabbitMQ configuration is used to connect to the message broker for publishing `artifact.created` events
- When running with Docker Compose, the `RABBITMQ_HOST` should be set to the RabbitMQ container name
- The API Gateway will automatically connect to RabbitMQ on startup and publish events when artifacts are created
- If RabbitMQ is not available, artifact creation will still succeed, but the event will not be published (error will be logged) 