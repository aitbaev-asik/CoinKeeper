#!/usr/bin/env python
"""
Скрипт для проверки доступности API-эндпоинтов Django
"""

import requests
import sys
import json
import os

# Учетные данные для API
API_CREDENTIALS = {
    "username": "honeydew1@gmail.com",  # Укажите здесь логин
    "password": "password123",  # Укажите здесь пароль
}

def get_token(base_url):
    """Получает токен авторизации"""
    try:
        print(f"Попытка авторизации на {base_url}/api/auth/token/...")
        response = requests.post(
            f"{base_url}/api/auth/token/", 
            json=API_CREDENTIALS,
            timeout=5
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Авторизация успешна!")
            return token_data.get("access")
        else:
            print(f"❌ Ошибка авторизации: {response.status_code}")
            print(f"Ответ: {response.text[:200]}...")
            return None
    except Exception as e:
        print(f"❌ Ошибка при запросе токена: {e}")
        return None

def check_endpoint(url, description, token=None):
    """Проверяет доступность эндпоинта и возвращает данные или ошибку"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        print(f"Проверка {description} ({url})...")
        response = requests.get(url, headers=headers, timeout=5)
        print(f"Статус: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"Получено {len(data)} объектов")
                else:
                    print(f"Получен объект")
                return data
            except Exception as e:
                print(f"Ошибка при разборе JSON: {e}")
                print(f"Содержимое ответа: {response.text[:200]}...")
                return None
        else:
            print(f"Ошибка: статус {response.status_code}")
            print(f"Ответ: {response.text[:200]}...")
            return None
    except Exception as e:
        print(f"Ошибка при запросе: {e}")
        return None

def main():
    """Основная функция, проверяющая эндпоинты"""
    base_urls = [
        "http://localhost:8009",
    ]
    
    endpoints = [
        "/api/",
        "/api/accounts/",
        "/api/categories/",
        "/api/transactions/",
    ]
    
    working_base = None
    token = None
    
    # Проверяем базовые URL
    for base_url in base_urls:
        print(f"\n===== Проверка сервера {base_url} =====")
        try:
            response = requests.get(f"{base_url}/api/", timeout=3)
            status = response.status_code
            
            if status == 200:
                print(f"✅ Сервер {base_url} доступен!")
                working_base = base_url
                break
            elif status == 401:
                print(f"Сервер {base_url} требует авторизацию...")
                token = get_token(base_url)
                if token:
                    working_base = base_url
                    break
            else:
                print(f"❌ Сервер {base_url} отвечает, но вернул статус {status}")
        except Exception as e:
            print(f"❌ Сервер {base_url} недоступен: {e}")
    
    if not working_base:
        print("\n❌ Не удалось найти доступный сервер Django. Убедитесь, что он запущен.")
        sys.exit(1)
    
    # Проверяем эндпоинты на работающем сервере
    print(f"\n===== Проверка эндпоинтов на {working_base} =====")
    
    accounts_data = None
    for endpoint in endpoints:
        url = f"{working_base}{endpoint}"
        if endpoint == "/api/accounts/":
            accounts_data = check_endpoint(url, "списка счетов", token)
        else:
            check_endpoint(url, f"эндпоинта {endpoint}", token)
    
    if accounts_data:
        print("\n===== Данные счетов =====")
        print(json.dumps(accounts_data, indent=2, ensure_ascii=False))
        
        # Сохраняем данные в JSON-файл для дальнейшего использования
        with open("accounts_data.json", "w", encoding="utf-8") as f:
            json.dump(accounts_data, f, ensure_ascii=False, indent=2)
        print("\nДанные счетов сохранены в файл accounts_data.json")
    else:
        print("\n❌ Не удалось получить данные счетов")
        # Если есть локальный файл, предлагаем использовать его
        if os.path.exists("accounts_data.json"):
            print("Найден локальный файл accounts_data.json с данными счетов")
    
    print("\n===== Проверка завершена =====")

if __name__ == "__main__":
    main() 