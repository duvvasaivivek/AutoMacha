import random
import string
from locust import TaskSet, task

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

class AuthTaskSet(TaskSet):
    def on_start(self):
        """
        Register a new user and log them in to get the access token.
        """
        self.username = f"loadtest_{random_string()}"
        self.password = "Testpass123!"
        self.email = f"{self.username}@example.com"
        
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
            # If registration fails, fallback to a known user (if seeded)
            # or just try to login with this one just in case
            print(f"Register failed: {response.text}")

        # 2. Login
        login_response = self.client.post("/api/accounts/token/", json={
            "username": self.username,
            "password": self.password
        }, name="/api/accounts/token/")
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.user.token = data.get("access")
            self.user.refresh_token = data.get("refresh")
            
            # Set the Authorization header for all subsequent requests by this user
            self.client.headers.update({
                "Authorization": f"Bearer {self.user.token}"
            })
        else:
            print(f"Login failed: {login_response.text}")
            self.user.token = None

    @task
    def get_profile(self):
        if hasattr(self.user, 'token') and self.user.token:
            self.client.get("/api/accounts/profile/", name="/api/accounts/profile/")
