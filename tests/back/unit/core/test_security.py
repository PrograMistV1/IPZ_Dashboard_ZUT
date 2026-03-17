"""Unit tests for security module (JWT token creation and validation)."""

import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt

from src.back.core.security import create_access_token, get_current_user
from src.back.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


class TestCreateAccessToken:
    """Tests for create_access_token function."""

    def test_create_access_token_returns_string(self):
        """Token should be a non-empty string."""
        token = create_access_token(user_id=1)
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_contains_valid_jwt_structure(self):
        """Token should have valid JWT structure (header.payload.signature)."""
        token = create_access_token(user_id=42)
        parts = token.split(".")
        assert len(parts) == 3

    def test_create_access_token_payload_contains_user_id(self):
        """Decoded token should contain the correct user_id."""
        user_id = 123
        token = create_access_token(user_id=user_id)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["user_id"] == user_id

    def test_create_access_token_has_expiration(self):
        """Token should have 'exp' claim set."""
        token = create_access_token(user_id=1)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_create_access_token_expiration_is_correct(self):
        """Token expiration should be in the future."""
        token = create_access_token(user_id=1)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload["exp"]

        # Expiration should be in the future (at least 59 minutes from now)
        now_timestamp = datetime.now().timestamp()
        min_expected_exp = now_timestamp + (ACCESS_TOKEN_EXPIRE_MINUTES - 1) * 60

        assert exp_timestamp > min_expected_exp, "Token should expire in the future"

    def test_create_access_token_different_users_produce_different_tokens(self):
        """Different user IDs should produce different tokens."""
        token1 = create_access_token(user_id=1)
        token2 = create_access_token(user_id=2)
        assert token1 != token2


class TestGetCurrentUser:
    """Tests for get_current_user function."""

    def test_get_current_user_returns_user_id_for_valid_token(self):
        """Should return user_id when token is valid."""
        token = create_access_token(user_id=77)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user_id = get_current_user(credentials)
        assert user_id == 77

    def test_get_current_user_raises_401_for_invalid_token(self):
        """Should raise HTTPException with 401 for invalid token."""
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid-token"
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials)
        assert exc_info.value.status_code == 401

    def test_get_current_user_raises_401_for_empty_token(self):
        """Should raise HTTPException with 401 for empty token."""
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="")
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials)
        assert exc_info.value.status_code == 401

    def test_get_current_user_raises_401_when_user_id_missing_in_payload(self):
        """Should raise 401 when token payload doesn't contain user_id."""
        # Create token without user_id
        payload = {"exp": datetime.now(timezone.utc) + timedelta(minutes=60)}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials)
        assert exc_info.value.status_code == 401

    def test_get_current_user_raises_401_for_expired_token(self):
        """Should raise 401 for expired token."""
        # Create expired token
        payload = {
            "user_id": 1,
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials)
        assert exc_info.value.status_code == 401
