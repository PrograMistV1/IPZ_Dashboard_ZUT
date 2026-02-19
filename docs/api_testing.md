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
    '$2b$12$vhPnZn/J6do9cP4v.gdhPu8FzHxLj/ctsA61nQ6K7P04KTHyLbkme', 
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
    '$2b$12$bayT.ifv1tJco98V5lJtLOX9tyMD68nlU5oSemq/73RHWrzzZKhDu', 
    'USER',
    1
);

--------------

⚠️ Upewnij się, że hasła są prawidłowo zahashowane bcryptem.
W przeciwnym razie logowanie nie zadziała.

Możesz wygenerować hash bcrypt lokalnie przed wstawieniem do bazy. Przykłady (wymagany pakiet `bcrypt`):

PowerShell / Windows:

```powershell
python -c "import bcrypt; print(bcrypt.hashpw(b'admin1234', bcrypt.gensalt(12)).decode())"
```

Linux / macOS (bash):

```bash
python -c 'import bcrypt; print(bcrypt.hashpw(b"admin1234", bcrypt.gensalt(12)).decode())'
```

Wklej wygenerowany hash do zapytania SQL, np.:

```sql
INSERT INTO users (username, email, password, role, is_enabled)
VALUES ('admin','admin@example.com','<PASTE_GENERATED_BCRYPT_HASH>','ADMIN',1);
```


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