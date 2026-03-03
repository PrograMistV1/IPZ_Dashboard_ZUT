from src.back.core.password import hash_password, verify_password


def test_hash_password_returns_non_plain_text_and_verifies():
    plain = "SuperSecret123!"

    hashed = hash_password(plain)

    assert hashed != plain
    assert verify_password(plain, hashed) is True


def test_verify_password_returns_false_for_wrong_password():
    hashed = hash_password("CorrectPassword")

    assert verify_password("WrongPassword", hashed) is False
