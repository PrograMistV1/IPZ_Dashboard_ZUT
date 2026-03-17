"""Unit tests for password hashing and verification."""

from src.back.core.password import hash_password, verify_password


class TestHashPassword:
    """Tests for hash_password function."""

    def test_hash_password_returns_non_plain_text(self):
        """Hashed password should not be the same as plain text."""
        plain = "SuperSecret123!"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_hash_password_returns_string(self):
        """Hashed password should be a string."""
        hashed = hash_password("test_password")
        assert isinstance(hashed, str)

    def test_hash_password_starts_with_bcrypt_prefix(self):
        """Hashed password should start with $2b$ or $2a$ (bcrypt prefix)."""
        hashed = hash_password("test_password")
        assert hashed.startswith("$2")

    def test_hash_password_produces_different_hashes_for_same_input(self):
        """Same password should produce different hashes due to random salt."""
        password = "SamePassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2

    def test_hash_password_handles_unicode_characters(self):
        """Password hashing should work with unicode characters."""
        password = "Hasło123!@#"
        hashed = hash_password(password)
        assert hashed is not None
        assert len(hashed) > 0

    def test_hash_password_handles_empty_string(self):
        """Empty string password should still produce a hash."""
        hashed = hash_password("")
        assert hashed is not None
        assert len(hashed) > 0

    def test_hash_password_handles_very_long_password(self):
        """Very long passwords should be hashable up to bcrypt limit (72 bytes)."""
        # bcrypt has a 72-byte limit, so we test with 72 characters
        long_password = "A" * 72
        hashed = hash_password(long_password)
        assert hashed is not None
        assert len(hashed) > 0
        # Verify it works
        assert verify_password(long_password, hashed) is True


class TestVerifyPassword:
    """Tests for verify_password function."""

    def test_verify_password_returns_true_for_correct_password(self):
        """Correct password should verify successfully."""
        plain = "SuperSecret123!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_returns_false_for_wrong_password(self):
        """Wrong password should fail verification."""
        hashed = hash_password("CorrectPassword")
        assert verify_password("WrongPassword", hashed) is False

    def test_verify_password_returns_false_for_empty_password(self):
        """Empty password should fail verification against hashed non-empty password."""
        hashed = hash_password("SomePassword123")
        assert verify_password("", hashed) is False

    def test_verify_password_returns_false_for_tampered_hash(self):
        """Tampered hash should fail verification."""
        hashed = hash_password("Password123")
        tampered_hash = hashed[:-5] + "XXXXX"
        assert verify_password("Password123", tampered_hash) is False

    def test_verify_password_handles_unicode_password(self):
        """Unicode passwords should verify correctly."""
        plain = "Hasło123!@#"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_case_sensitive(self):
        """Password verification should be case-sensitive."""
        plain = "Password123"
        hashed = hash_password(plain)
        assert verify_password("password123", hashed) is False
        assert verify_password("PASSWORD123", hashed) is False
