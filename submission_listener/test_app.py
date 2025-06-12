import pytest
import json
import responses
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone
import pika.exceptions
import requests
import os
import tempfile
from unittest.mock import mock_open

# Import the functions we want to test
from app import (
    update_artifact_status, 
    validate_message, 
    callback,
    start_rabbitmq_consumer,
    artifact_submitted_schema,
    API_GATEWAY_URL,  # Import this to use the actual URL
    load_schema
)

# Test fixtures
@pytest.fixture
def valid_message():
    return {
        "artifactId": "6a4e924f-fde0-4460-93c5-03bfb8ed7980",
        "submissionState": "SUCCESS",
        "submittedAt": "2023-12-07T15:30:00.000Z",
        "blockchainTxId": "0x1234567890abcdef1234567890abcdef12345678",
        "peerId": "12D3KooWBhxQ7uXeY9zF8qG5nM4rL3pT6vN8wS2cK9jH1fX7yR4e",
        "version": "v1"
    }

@pytest.fixture
def invalid_message():
    return {
        "artifactId": "6a4e924f-fde0-4460-93c5-03bfb8ed7980",
        "submissionState": "INVALID_STATE",  # Invalid state
        "submittedAt": "2023-12-07T15:30:00.000Z",
        "version": "v1"
    }

@pytest.fixture
def missing_fields_message():
    return {
        "artifactId": "6a4e924f-fde0-4460-93c5-03bfb8ed7980",
        # Missing submissionState, submittedAt, version
    }

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables for all tests"""
    # Set environment variables needed for testing
    os.environ['API_KEY'] = 'test-api-key'
    os.environ['SERVICE_ROLE'] = 'test-service-role'
    os.environ['ENVIRONMENT'] = 'test'
    
    yield
    
    # Clean up environment variables after tests
    for key in ['API_KEY', 'SERVICE_ROLE', 'ENVIRONMENT']:
        os.environ.pop(key, None)

class TestValidateMessage:
    """Test the validate_message function"""
    
    def test_validate_message_success(self, valid_message):
        """Test validation with a valid message"""
        assert validate_message(valid_message) == True
    
    def test_validate_message_invalid_state(self, invalid_message):
        """Test validation with invalid submission state"""
        assert validate_message(invalid_message) == False
        
    def test_validate_message_missing_fields(self, missing_fields_message):
        """Test validation with missing required fields"""
        assert validate_message(missing_fields_message) == False
        
    def test_validate_message_empty_dict(self):
        """Test validation with empty message"""
        assert validate_message({}) == False

class TestUpdateArtifactStatus:
    """Test the update_artifact_status function"""
    
    @responses.activate
    def test_update_artifact_status_success(self, valid_message):
        """Test successful artifact status update"""
        artifact_id = valid_message["artifactId"]
        
        # Mock the API response with correct URL format
        responses.add(
            responses.PATCH,
            f"{API_GATEWAY_URL}/{artifact_id}/status",
            json={"status": "updated"},
            status=200
        )
        
        result = update_artifact_status(artifact_id, valid_message)
        assert result == True
        
        # Verify the request was made correctly
        assert len(responses.calls) == 1
        request = responses.calls[0].request
        assert "X-API-Key" in request.headers
        assert request.headers["X-API-Key"] == "test-api-key"
        assert "X-Service-Role" in request.headers
        assert request.headers["X-Service-Role"] == "submitter_listener"
    
    @responses.activate
    def test_update_artifact_status_http_error(self, valid_message):
        """Test HTTP error response"""
        artifact_id = valid_message["artifactId"]
        
        responses.add(
            responses.PATCH,
            f"{API_GATEWAY_URL}/{artifact_id}/status",
            json={"error": "Bad Request"},
            status=400
        )
        
        result = update_artifact_status(artifact_id, valid_message)
        assert result == False
    
    def test_update_artifact_status_timeout(self, valid_message):
        """Test timeout error"""
        artifact_id = valid_message["artifactId"]
        
        # Mock requests.patch to raise Timeout exception
        with patch('app.requests.patch') as mock_patch:
            mock_patch.side_effect = requests.exceptions.Timeout("Request timed out")
            
            result = update_artifact_status(artifact_id, valid_message)
            assert result == False
            
            # Verify patch was called
            mock_patch.assert_called_once()
    
    def test_update_artifact_status_missing_blockchain_tx(self, valid_message):
        """Test update without blockchain transaction ID"""
        # Remove blockchainTxId from message
        message_without_tx = valid_message.copy()
        del message_without_tx["blockchainTxId"]
        
        with responses.RequestsMock() as rsps:
            rsps.add(
                responses.PATCH,
                f"{API_GATEWAY_URL}/{valid_message['artifactId']}/status",
                json={"status": "updated"},
                status=200
            )
            
            result = update_artifact_status(valid_message["artifactId"], message_without_tx)
            assert result == True
            
            # Verify blockchainTxId is not in request body
            request_body = json.loads(rsps.calls[0].request.body)
            assert "blockchainTxId" not in request_body

class TestCallback:
    """Test the callback function"""
    
    def test_callback_success(self, valid_message):
        """Test successful message processing"""
        # Mock channel and method
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "test-tag"
        properties_mock = Mock()
        
        body = json.dumps(valid_message).encode()
        
        with patch('app.update_artifact_status', return_value=True) as mock_update:
            callback(channel_mock, method_mock, properties_mock, body)
            
            # Verify the message was processed
            mock_update.assert_called_once_with(
                valid_message["artifactId"], 
                valid_message
            )
            
            # Verify message was acknowledged
            channel_mock.basic_ack.assert_called_once_with(delivery_tag="test-tag")
    
    def test_callback_validation_failure(self, invalid_message):
        """Test message validation failure"""
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "test-tag"
        properties_mock = Mock()
        
        body = json.dumps(invalid_message).encode()
        
        with patch('app.update_artifact_status') as mock_update:
            callback(channel_mock, method_mock, properties_mock, body)
            
            # Verify update was not called
            mock_update.assert_not_called()
            
            # Verify message was rejected (not requeued)
            channel_mock.basic_nack.assert_called_once_with(
                delivery_tag="test-tag", 
                requeue=False
            )
    
    def test_callback_json_decode_error(self):
        """Test invalid JSON handling"""
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "test-tag"
        properties_mock = Mock()
        
        body = b"invalid-json"
        
        with patch('app.update_artifact_status') as mock_update:
            callback(channel_mock, method_mock, properties_mock, body)
            
            # Verify update was not called
            mock_update.assert_not_called()
            
            # Verify message was rejected
            channel_mock.basic_nack.assert_called_once_with(
                delivery_tag="test-tag", 
                requeue=False
            )
    
    def test_callback_update_failure(self, valid_message):
        """Test API update failure"""
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "test-tag"
        properties_mock = Mock()
        
        body = json.dumps(valid_message).encode()
        
        with patch('app.update_artifact_status', return_value=False) as mock_update:
            callback(channel_mock, method_mock, properties_mock, body)
            
            # Verify update was called
            mock_update.assert_called_once()
            
            # Verify message was rejected (not requeued)
            channel_mock.basic_nack.assert_called_once_with(
                delivery_tag="test-tag", 
                requeue=False
            )

class TestStartRabbitMQConsumer:
    """Test the start_rabbitmq_consumer function"""
    
    @patch('app.pika.BlockingConnection')
    @patch('app.pika.PlainCredentials')
    @patch('app.pika.ConnectionParameters')
    def test_start_rabbitmq_consumer_success(self, mock_params, mock_creds, mock_connection):
        """Test successful RabbitMQ connection and consumer start"""
        # Mock the connection and channel
        connection_mock = Mock()
        channel_mock = Mock()
        connection_mock.channel.return_value = channel_mock
        mock_connection.return_value = connection_mock
        
        # Mock successful connection
        mock_connection.side_effect = [connection_mock]
        
        with patch('app.callback') as mock_callback:
            # We need to mock the start_consuming to avoid infinite loop
            def stop_consuming():
                raise KeyboardInterrupt()
            
            channel_mock.start_consuming.side_effect = stop_consuming
            
            start_rabbitmq_consumer()
            
            # Verify connection setup
            mock_creds.assert_called_once()
            mock_params.assert_called_once()
            mock_connection.assert_called_once()
            
            # Verify channel setup
            connection_mock.channel.assert_called_once()
            channel_mock.queue_declare.assert_called_once_with(
                queue='artifact.submitted.queue', 
                durable=True
            )
            channel_mock.basic_qos.assert_called_once_with(prefetch_count=1)
            channel_mock.basic_consume.assert_called_once()
    
    @patch('app.pika.BlockingConnection')
    @patch('app.time.sleep')
    def test_start_rabbitmq_consumer_connection_retry(self, mock_sleep, mock_connection):
        """Test RabbitMQ connection retry logic"""
        # Mock connection failures then success
        connection_mock = Mock()
        mock_connection.side_effect = [
            pika.exceptions.AMQPConnectionError("Connection failed"),
            pika.exceptions.AMQPConnectionError("Connection failed"),
            connection_mock
        ]
        
        channel_mock = Mock()
        connection_mock.channel.return_value = channel_mock
        
        # Mock start_consuming to avoid infinite loop
        channel_mock.start_consuming.side_effect = KeyboardInterrupt()
        
        start_rabbitmq_consumer()
        
        # Verify retries
        assert mock_connection.call_count == 3
        assert mock_sleep.call_count == 2
    
    @patch('app.pika.BlockingConnection')
    @patch('app.time.sleep')
    def test_start_rabbitmq_consumer_max_retries_exceeded(self, mock_sleep, mock_connection):
        """Test behavior when max retries are exceeded"""
        # Mock connection always failing
        mock_connection.side_effect = pika.exceptions.AMQPConnectionError("Connection failed")
        
        start_rabbitmq_consumer()
        
        # Verify max retries reached
        assert mock_connection.call_count == 30
        assert mock_sleep.call_count == 30

# Integration-style tests
class TestIntegration:
    """Integration tests for multiple components"""
    
    @responses.activate
    def test_end_to_end_message_processing(self, valid_message):
        """Test complete message processing flow"""
        artifact_id = valid_message["artifactId"]
        
        # Mock successful API response with correct URL
        responses.add(
            responses.PATCH,
            f"{API_GATEWAY_URL}/{artifact_id}/status",
            json={"status": "updated"},
            status=200
        )
        
        # Mock RabbitMQ components
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "test-tag"
        properties_mock = Mock()
        
        body = json.dumps(valid_message).encode()
        
        # Process the message
        callback(channel_mock, method_mock, properties_mock, body)
        
        # Verify complete flow
        assert len(responses.calls) == 1
        channel_mock.basic_ack.assert_called_once_with(delivery_tag="test-tag")
        
        # Verify API call details
        request = responses.calls[0].request
        request_body = json.loads(request.body)
        assert request_body["submissionState"] == "SUCCESS"
        assert "X-API-Key" in request.headers
        assert "X-Service-Role" in request.headers

class TestSchemaLoading:
    """Test schema loading functionality"""
    
    @patch('app.IS_DOCKER', True)
    @patch('app.os.path.exists')
    @patch('app.open', mock_open(read_data='{"test": "docker_schema"}'))
    @patch('app.json.load')
    def test_load_schema_docker_path(self, mock_json_load, mock_exists):
        """Test schema loading from Docker path"""
        mock_exists.return_value = True
        mock_json_load.return_value = {"test": "docker_schema"}
        
        # Re-import the function to test
        import importlib
        import app
        importlib.reload(app)
        
        from app import load_schema
        result = load_schema()
        
        assert result == {"test": "docker_schema"}
    
    @patch('app.IS_DOCKER', False)
    @patch('app.os.path.exists')
    @patch('app.open', mock_open(read_data='{"test": "local_schema"}'))
    @patch('app.json.load')
    def test_load_schema_local_path(self, mock_json_load, mock_exists):
        """Test schema loading from local path"""
        mock_exists.return_value = True
        mock_json_load.return_value = {"test": "local_schema"}
        
        from app import load_schema
        result = load_schema()
        
        assert result == {"test": "local_schema"}
    
    @patch('app.os.path.exists', return_value=False)
    def test_load_schema_file_not_found(self, mock_exists):
        """Test schema loading when file doesn't exist"""
        from app import load_schema
        
        with pytest.raises(FileNotFoundError) as exc_info:
            load_schema()
        
        assert "Schema file not found" in str(exc_info.value)

class TestHealthCheckHandler:
    """Test the health check HTTP handler methods"""
    
    def test_health_check_endpoint_method(self):
        """Test the do_GET method for /health endpoint"""
        from app import HealthCheckHandler
        import io
        
        # Create handler instance by mocking the parent class
        with patch.object(HealthCheckHandler, '__init__', lambda x, y, z, w: None):
            handler = HealthCheckHandler.__new__(HealthCheckHandler)
            handler.path = '/health'
            handler.wfile = io.BytesIO()
            
            # Mock the response methods
            handler.send_response = Mock()
            handler.send_header = Mock()
            handler.end_headers = Mock()
            
            # Call the method
            handler.do_GET()
            
            # Verify response
            handler.send_response.assert_called_once_with(200)
            handler.send_header.assert_called()
            handler.end_headers.assert_called_once()
            
            # Verify JSON response contains expected fields
            response_data = handler.wfile.getvalue()
            json_response = json.loads(response_data.decode())
            
            assert json_response["status"] == "healthy"
            assert json_response["service"] == "submission-listener"
            assert "timestamp" in json_response
    
    def test_health_check_not_found_method(self):
        """Test the do_GET method for non-existent endpoint"""
        from app import HealthCheckHandler
        import io
        
        with patch.object(HealthCheckHandler, '__init__', lambda x, y, z, w: None):
            handler = HealthCheckHandler.__new__(HealthCheckHandler)
            handler.path = '/invalid'
            handler.wfile = io.BytesIO()
            
            # Mock the response methods
            handler.send_response = Mock()
            handler.send_header = Mock()
            handler.end_headers = Mock()
            
            # Call the method
            handler.do_GET()
            
            # Verify 404 response
            handler.send_response.assert_called_once_with(404)
            
            # Verify response body
            response_data = handler.wfile.getvalue()
            assert response_data == b'Not Found'
    
    def test_log_message_method(self):
        """Test that log_message method returns None"""
        from app import HealthCheckHandler
        
        with patch.object(HealthCheckHandler, '__init__', lambda x, y, z, w: None):
            handler = HealthCheckHandler.__new__(HealthCheckHandler)
            
            # This should return None
            result = handler.log_message("test format", "test args")
            assert result is None

class TestHealthServer:
    """Test health server functionality"""
    
    def test_start_health_server_function_exists(self):
        """Test that start_health_server function exists and is callable"""
        from app import start_health_server
        
        # Verify function exists and is callable
        assert callable(start_health_server)
        
        # Verify it's properly imported from the module
        import app
        assert hasattr(app, 'start_health_server')
    
    @patch('app.http.server.HTTPServer')
    def test_start_health_server_components(self, mock_http_server):
        """Test health server creates HTTPServer correctly"""
        from app import start_health_server
        
        # Mock server instance
        server_mock = Mock()
        mock_http_server.return_value = server_mock
        
        # Mock serve_forever to prevent blocking
        server_mock.serve_forever.side_effect = KeyboardInterrupt()
        
        try:
            start_health_server()
        except KeyboardInterrupt:
            pass  # Expected behavior
        
        # Verify server was created with correct parameters
        mock_http_server.assert_called_once()
        call_args = mock_http_server.call_args[0]
        assert call_args[0] == ('0.0.0.0', 8000)  # Address and port
        
        # Verify serve_forever was called
        server_mock.serve_forever.assert_called_once()

class TestAdditionalCoverage:
    """Additional tests to increase coverage"""
    
    @responses.activate
    @patch('app.API_GATEWAY_URL', 'http://localhost:3000/api/v1/artifacts')
    def test_update_artifact_status_missing_peer_id(self, valid_message):
        """Test update without peerId"""
        message_without_peer = valid_message.copy()
        del message_without_peer["peerId"]
        artifact_id = message_without_peer["artifactId"]
        
        # Mock the API response
        responses.add(
            responses.PATCH,
            f"http://localhost:3000/api/v1/artifacts/{artifact_id}/status",
            json={"status": "updated"},
            status=200
        )
        
        result = update_artifact_status(artifact_id, message_without_peer)
        assert result == True
        
        # Verify peerId is not in request body
        request_body = json.loads(responses.calls[0].request.body)
        assert "peerId" not in request_body
    
    @patch('app.logger')
    def test_logging_calls(self, mock_logger):
        """Test that logging is called appropriately"""
        # Test validation logging
        from app import validate_message
        
        # Valid message should log debug
        valid_msg = {
            "artifactId": "test-id",
            "submissionState": "SUCCESS",
            "submittedAt": "2023-12-07T15:30:00.000Z",
            "version": "v1"
        }
        
        validate_message(valid_msg)
        # Logger debug should be called for successful validation
        
        # Invalid message should log error
        invalid_msg = {"invalid": "message"}
        validate_message(invalid_msg)
        
        # Verify logger was called
        assert mock_logger.debug.called or mock_logger.error.called
    
    def test_callback_unexpected_exception(self):
        """Test callback handling unexpected exceptions"""
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "test-tag"
        properties_mock = Mock()
        
        # Valid JSON but will cause exception in processing
        valid_json = '{"artifactId": "test", "submissionState": "SUCCESS", "submittedAt": "2023-12-07T15:30:00.000Z", "version": "v1"}'
        body = valid_json.encode()
        
        # Mock update_artifact_status to raise unexpected exception
        with patch('app.update_artifact_status') as mock_update, \
             patch('app.validate_message', return_value=True):
            
            mock_update.side_effect = RuntimeError("Unexpected error")
            
            callback(channel_mock, method_mock, properties_mock, body)
            
            # Should reject message due to unexpected error
            channel_mock.basic_nack.assert_called_once_with(
                delivery_tag="test-tag", 
                requeue=False
            )
    
    @responses.activate
    @patch('app.API_GATEWAY_URL', 'http://localhost:3000/api/v1/artifacts')
    def test_pending_submission_flow(self, valid_message):
        """Test complete flow with PENDING submission state"""
        pending_message = valid_message.copy()
        pending_message["submissionState"] = "PENDING"
        # Remove blockchainTxId and peerId for PENDING state
        if "blockchainTxId" in pending_message:
            del pending_message["blockchainTxId"]
        if "peerId" in pending_message:
            del pending_message["peerId"]
        
        artifact_id = pending_message["artifactId"]
        
        # Mock successful API response
        responses.add(
            responses.PATCH,
            f"http://localhost:3000/api/v1/artifacts/{artifact_id}/status",
            json={"status": "updated"},
            status=200
        )
        
        # Mock RabbitMQ components
        channel_mock = Mock()
        method_mock = Mock()
        method_mock.delivery_tag = "pending-tag"
        properties_mock = Mock()
        
        body = json.dumps(pending_message).encode()
        
        # Process the message
        callback(channel_mock, method_mock, properties_mock, body)
        
        # Verify complete flow
        assert len(responses.calls) == 1
        channel_mock.basic_ack.assert_called_once_with(delivery_tag="pending-tag")
        
        # Verify API call details
        request = responses.calls[0].request
        request_body = json.loads(request.body)
        assert request_body["submissionState"] == "PENDING"

if __name__ == "__main__":
    pytest.main([__file__]) 