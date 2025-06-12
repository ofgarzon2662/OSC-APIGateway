FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create directory for the schema
RUN mkdir -p /app/schema

# Copy the schema file (now from local contracts folder)
COPY contracts/artifact.submitted.v1.schema.json /app/schema/

# Copy application code
COPY app.py .

CMD ["python", "app.py"] 