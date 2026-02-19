Testowanie API – IPZ_Dashboard_ZUT

Ten moduł pozwala na automatyczne testowanie wszystkich publicznych, administacyjnych i użytkownikowskich endpointów API projektu IPZ_Dashboard_ZUT.


🔹 Przygotowanie bazy danych

Utwórz bazę danych MySQL (np. ipz_db) i skonfiguruj połączenie w projekcie.
Zastosuj wszystkie migracje / utwórz tabele:

    python -m src.back.main

To utworzy wszystkie wymagane tabele i sprawdzi połączenie z bazą danych.
Utwórz użytkowników testowych:

-----Admin----

DELETE FROM users WHERE username = 'admin';
INSERT INTO users (username, email, password, role, is_enabled)
VALUES (
    'admin',
    'admin@example.com',
    '$2b$12$lQzTdOkVx4Ck0BADynNWuuYDywXOl8C4iGnt/R8/cXk...', -- bcrypt hash dla "admin1234"
    'ADMIN',
    1
);

--------------

-----User-----

DELETE FROM users WHERE username = 'Test';
INSERT INTO users (username, email, password, role, is_enabled)
VALUES (
    'Test',
    'Test@test.com',
    '$2b$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- bcrypt hash dla "12345678"
    'USER',
    1
);

--------------

⚠️ Upewnij się, że hasła są prawidłowo zahashowane bcryptem.
W przeciwnym razie logowanie nie zadziała.


🔹 Konfiguracja skryptu testowego

W pliku docs/api_testing.py upewnij się, że dane logowania odpowiadają danym w bazie:

ADMIN_CREDENTIALS = {"username": "admin", "password": "admin1234"}
USER_CREDENTIALS  = {"username": "Test", "password": "12345678"}

Skrypt używa unikalnych username/email do automatycznych rejestracji, aby nie kolidować z istniejącymi wpisami.
Wszystkie testy sprawdzają oczekiwany status odpowiedzi (200, 201, 401, 403, 422 itp.) dla każdej roli.


🔹 Uruchomienie testów

Aktywuj środowisko wirtualne:

    .venv\Scripts\activate      # Windows
    source .venv/bin/activate   # Linux / macOS

Zainstaluj zależności (jeśli jeszcze nie są zainstalowane):

    pip install -r requirements.txt

Uruchom serwer FastAPI (testy muszą mieć aktywny backend):

    python -m src.back.main

W innym terminalu uruchom testy:

    python docs/api_testing.py

Wyniki zostaną zapisane w api_test_results.json, a w konsoli pojawi się podsumowanie z ilością testów zaliczonych i niezaliczonych.


🔹 Sprawdzenie działania

Po przygotowaniu bazy danych i poprawnym ustawieniu haseł, wskaźnik sukcesu testów powinien wynosić ~100%.

Testy weryfikują wszystkie publiczne, administacyjne i użytkownikowskie endpointy, w tym:

/auth
/api/dashboards
/api/widgets
/users
/logs i inne