import requests
import json
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
OPENAPI_URL = f"{BASE_URL}/openapi.json"
RESULTS_FILE = "api_test_results.json"

ADMIN_CREDENTIALS = {"username": "admin", "password": "admin1234"}
USER_CREDENTIALS = {"username": "Test", "password": "12345678"}

timestamp = int(time.time())

# ------------------ OpenAPI ------------------


def fetch_openapi():
    r = requests.get(OPENAPI_URL, timeout=5)
    r.raise_for_status()
    return r.json()


def extract_endpoints(openapi_json):
    endpoints = []
    for path, methods in openapi_json.get("paths", {}).items():
        for method, info in methods.items():
            endpoints.append(
                {
                    "path": path,
                    "method": method.upper(),
                    "security": info.get("security", []),
                }
            )
    return endpoints


# ------------------ Helpers ------------------


def substitute_path_params(path):
    return (
        path.replace("{dashboard_id}", "1")
        .replace("{widget_id}", "1")
        .replace("{config_id}", "1")
        .replace("{id}", "1")
    )


def build_query_params(path):
    if "weather" in path or "geocode" in path:
        return {"lat": "50", "lon": "30"}
    return None


def build_payload(path, method, role="user"):
    if method not in ["POST", "PUT", "PATCH"]:
        return None

    # Registration (auto user)
    if "/auth/register" in path:
        return {
            "username": f"auto_user_{timestamp}",
            "email": f"auto_{timestamp}@test.com",
            "password": "StrongPass123!",
        }

    # Login payload
    if "/auth/login" in path:
        if role == "admin":
            return ADMIN_CREDENTIALS
        return USER_CREDENTIALS

    # Rates endpoint
    if path == "/rates":
        return {"currency": "USD", "date_from": "2026-02-01", "date_to": "2026-02-15"}

    # Dashboards
    if "/api/dashboards" in path and method == "POST":
        return {"name": f"Dashboard_{timestamp}", "slotsCount": 4}
    if "/api/dashboards/" in path and method == "PATCH":
        return {"name": f"UpdatedDashboard_{timestamp}"}

    # Widgets
    if "/api/dashboards/" in path and "/widgets" in path and method == "POST":
        return {
            "type": "chart",
            "configuration": {"title": "Revenue", "chartType": "line"},
            "position": 1,
            "enabled": True,
        }
    if "/api/widgets/" in path and method == "PATCH":
        return {"enabled": True}
    if "/api/dashboards/" in path and "/widgets/reorder" in path and method == "PATCH":
        return {"order": [1]}  # упрощённо

    # Economy configs
    if "/api/economy/configs" in path:
        return {"name": f"Econ_{timestamp}", "configuration": {"currency": "USD"}}

    # Weather configs
    if "/api/weather/configs" in path:
        return {"name": f"Weather_{timestamp}", "configuration": {"lat": 50, "lon": 30}}

    # News
    if "/api/news" in path:
        return {"category": "general"}

    # Users
    if "/users/" in path and method == "POST":
        return {
            "username": f"user_auto_{timestamp}",
            "email": f"user_auto_{timestamp}@example.com",
            "password": "SecurePass123!",
            "role": "USER",
            "isEnabled": True,
        }
    if "/users/" in path and method == "PUT":
        return {"role": "USER", "isEnabled": True}

    return None


# ------------------ Expected status ------------------


def expected_status(method, secure, role):
    """Return expected HTTP status code(s)"""
    if not secure:
        return [200, 201]

    if role == "public":
        return [401]

    if role == "user":
        if method in ["POST", "PATCH", "PUT"]:
            return [200, 201, 422, 403]
        if method in ["GET"]:
            return [200, 403, 401]
        if method in ["DELETE"]:
            return [200, 204, 403]
        return [200, 403]

    if role == "admin":
        if method in ["POST", "PATCH", "PUT"]:
            return [200, 201, 422, 403]
        if method in ["GET"]:
            return [200, 403, 401]
        if method in ["DELETE"]:
            return [200, 204, 403]
        return [200, 403]

    return [200]


# ------------------ Auth ------------------


def login(credentials):
    r = requests.post(f"{BASE_URL}/auth/login", json=credentials, timeout=5)
    r.raise_for_status()
    return r.json()["access_token"]


# ------------------ Endpoint testing ------------------


def call_endpoints(endpoints, token=None, role="public"):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    passed = 0
    failed = 0
    results = []

    print(f"\n=== TEST: {role.upper()} ===")

    for ep in endpoints:
        path = substitute_path_params(ep["path"])
        url = BASE_URL + path
        params = build_query_params(path)
        payload = build_payload(ep["path"], ep["method"], role)

        secure = bool(ep["security"])
        expected = expected_status(ep["method"], secure, role)

        try:
            response = requests.request(
                ep["method"],
                url,
                headers=headers,
                params=params,
                json=payload,
                timeout=5,
            )

            status = response.status_code
            ok = status in expected

            symbol = "✅" if ok else "❌"
            print(
                f"{symbol} {role.upper():6} | {ep['method']:6} {path:40} -> {status} (oczekiwano {expected})"
            )

            if ok:
                passed += 1
            else:
                failed += 1

            results.append(
                {
                    "role": role,
                    "method": ep["method"],
                    "path": path,
                    "status": status,
                    "expected": expected,
                    "pass": ok,
                }
            )

        except Exception as e:
            failed += 1
            print(f"❌ {role.upper()} | {ep['method']} {path} -> ERROR: {e}")

    return results, passed, failed


# ------------------ MAIN ------------------


def main():
    openapi = fetch_openapi()
    endpoints = extract_endpoints(openapi)

    all_results = []
    total_passed = 0
    total_failed = 0

    # Public
    results, p, f = call_endpoints(endpoints, role="public")
    all_results.extend(results)
    total_passed += p
    total_failed += f

    # Admin
    try:
        admin_token = login(ADMIN_CREDENTIALS)
        results, p, f = call_endpoints(endpoints, admin_token, "admin")
        all_results.extend(results)
        total_passed += p
        total_failed += f
    except Exception as e:
        print("Błąd logowania admina:", e)

    # User
    try:
        user_token = login(USER_CREDENTIALS)
        results, p, f = call_endpoints(endpoints, user_token, "user")
        all_results.extend(results)
        total_passed += p
        total_failed += f
    except Exception as e:
        print("Błąd logowania użytkownika:", e)

    # Summary
    print("\n==============================")
    print("TEST SUMMARY")
    print(f"Passed: {total_passed}")
    print(f"Failed: {total_failed}")
    total = total_passed + total_failed
    if total > 0:
        rate = round((total_passed / total) * 100, 2)
        print(f"Success rate: {rate}%")
    print("==============================\n")

    # Save results
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated_at": datetime.now().isoformat(),
                "passed": total_passed,
                "failed": total_failed,
                "results": all_results,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    print(f"Wyniki zapisane do {RESULTS_FILE}")


if __name__ == "__main__":
    main()
