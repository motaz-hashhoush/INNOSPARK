from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    user_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "student",
        "language_pref": "en"
    }
    
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["role"] == "student"
    assert "id" in data
    assert "password" not in data

def test_register_existing_user(client: TestClient):
    # Register first
    user_data = {
        "email": "test2@example.com",
        "password": "testpassword123",
        "full_name": "Test User 2"
    }
    client.post("/api/auth/register", json=user_data)
    
    # Register again
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

def test_login_user(client: TestClient):
    # Register user
    user_data = {
        "email": "login@example.com",
        "password": "loginpassword123",
        "full_name": "Login User"
    }
    client.post("/api/auth/register", json=user_data)
    
    # Attempt login
    login_data = {
        "email": "login@example.com",
        "password": "loginpassword123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client: TestClient):
    user_data = {
        "email": "badauth@example.com",
        "password": "loginpassword123",
        "full_name": "Bad Auth User"
    }
    client.post("/api/auth/register", json=user_data)
    
    login_data = {
        "email": "badauth@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 401

def test_get_me(client: TestClient):
    # Register and login user
    user_data = {
        "email": "me@example.com",
        "password": "password123",
        "full_name": "Me User"
    }
    client.post("/api/auth/register", json=user_data)
    login_response = client.post("/api/auth/login", json={
        "email": "me@example.com",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    
    # Get profile
    response = client.get(
        "/api/auth/me", 
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me User"
