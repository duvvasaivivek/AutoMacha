import logging
import random
import string
from locust import HttpUser, between, task
from tasks.rides import RidesTaskSet
from tasks.websockets import WebSocketTaskSet

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

class AutoMachaUser(HttpUser):
    wait_time = between(1, 5)
    host = "http://127.0.0.1:8000"

    tasks = {
        RidesTaskSet: 5,
    }

    def on_start(self):
        logging.info("Starting new user and authenticating...")
        
        self.username = f"loadtest_{random_string()}"
        self.password = "Testpass123!"
        self.email = f"{self.username}@example.com"
        self.token = None
        
        # 1. Register
        response = self.client.post("/api/accounts/register/", json={
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "first_name": "Load",
            "last_name": "Tester",
            "phone_number": "1234567890",
            "gender": "O",
            "institute_email": f"{self.username}@institute.edu",
            "roll_number": f"ROLL{random_string(4).upper()}"
        }, name="/api/accounts/register/")
        
        if response.status_code not in (200, 201):
            logging.error(f"Register failed: {response.text}")

        # 2. Login
        login_response = self.client.post("/api/accounts/token/", json={
            "username": self.username,
            "password": self.password
        }, name="/api/accounts/token/")
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access")
            
            # Set the Authorization header for all subsequent requests by this user
            self.client.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
        else:
            logging.error(f"Login failed: {login_response.text}")

