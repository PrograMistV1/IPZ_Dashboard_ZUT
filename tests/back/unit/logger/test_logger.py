"""Unit tests for BackendLogger."""

import os
import logging
from unittest.mock import patch

import pytest

from src.back.logger.logger import BackendLogger


class TestBackendLoggerSingleton:
    """Tests for BackendLogger singleton pattern."""

    def test_backend_logger_is_singleton(self):
        """BackendLogger should be a singleton (same instance)."""
        logger1 = BackendLogger()
        logger2 = BackendLogger()
        assert logger1 is logger2

    def test_backend_logger_creates_logger_instance(self):
        """BackendLogger should create a logger instance."""
        logger = BackendLogger()
        assert logger.logger is not None
        assert isinstance(logger.logger, logging.Logger)


class TestBackendLoggerMethods:
    """Tests for BackendLogger logging methods."""

    @pytest.fixture
    def logger(self):
        """Create a logger instance for testing."""
        return BackendLogger()

    @patch.object(logging.Logger, "debug")
    def test_debug_logs_message_with_module_prefix(self, mock_debug, logger):
        """Debug method should log message with module prefix."""
        logger.debug("test_module", "Test debug message")
        mock_debug.assert_called_once_with("[test_module] Test debug message")

    @patch.object(logging.Logger, "info")
    def test_info_logs_message_with_module_prefix(self, mock_info, logger):
        """Info method should log message with module prefix."""
        logger.info("test_module", "Test info message")
        mock_info.assert_called_once_with("[test_module] Test info message")

    @patch.object(logging.Logger, "error")
    def test_error_logs_message_with_module_prefix(self, mock_error, logger):
        """Error method should log message with module prefix."""
        logger.error("test_module", "Test error message")
        mock_error.assert_called_once_with("[test_module] Test error message")

    @patch.object(logging.Logger, "error")
    def test_error_handles_exception_gracefully(self, mock_error, logger):
        """Error method should handle exceptions gracefully."""
        mock_error.side_effect = Exception("Logging failed")
        # Should not raise, just print to stdout
        logger.error("test_module", "Test error message")

    @patch.object(logging.Logger, "debug")
    def test_debug_handles_exception_gracefully(self, mock_debug, logger):
        """Debug method should handle exceptions gracefully."""
        mock_debug.side_effect = Exception("Logging failed")
        # Should not raise, just print to stdout
        logger.debug("test_module", "Test debug message")

    @patch.object(logging.Logger, "info")
    def test_info_handles_exception_gracefully(self, mock_info, logger):
        """Info method should handle exceptions gracefully."""
        mock_info.side_effect = Exception("Logging failed")
        # Should not raise, just print to stdout
        logger.info("test_module", "Test info message")


class TestBackendLoggerConfiguration:
    """Tests for BackendLogger configuration."""

    def test_logger_has_file_handler(self):
        """Logger should have a file handler configured."""
        logger = BackendLogger()
        handlers = logger.logger.handlers
        assert len(handlers) > 0
        assert any(isinstance(h, logging.FileHandler) for h in handlers)

    def test_logger_level_is_set(self):
        """Logger should have a level set."""
        logger = BackendLogger()
        assert logger.logger.level is not None

    def test_log_file_directory_exists(self):
        """Log file directory should exist or be creatable."""
        logger = BackendLogger()
        # Get the handler's file path
        for handler in logger.logger.handlers:
            if isinstance(handler, logging.FileHandler):
                log_dir = os.path.dirname(handler.baseFilename)
                assert os.path.exists(log_dir) or log_dir == "logs"
