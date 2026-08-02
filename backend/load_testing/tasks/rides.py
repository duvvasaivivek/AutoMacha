from locust import TaskSet, task

class RidesTaskSet(TaskSet):

    @task(3)
    def view_dashboard(self):
        if not getattr(self.user, 'token', None):
            return
            
        # Simulate loading the dashboard
        self.client.get("/api/dashboard/stats/", name="/api/dashboard/stats/")
        self.client.get("/api/destinations/", name="/api/destinations/")

    @task(2)
    def view_travel_requests(self):
        if not getattr(self.user, 'token', None):
            return
            
        # Simulate viewing travel requests
        self.client.get("/api/travel-requests/?limit=10&offset=0", name="/api/travel-requests/")

    @task(1)
    def create_travel_request(self):
        if not getattr(self.user, 'token', None):
            return
            
        # We need a destination to create a request. Just post to a dummy or known one, or let it fail 400.
        # This will test the API endpoint overhead at least.
        payload = {
            "destination": 1, # assuming ID 1 exists
            "travel_time": "2030-01-01T12:00:00Z",
            "is_flexible": True,
            "status": "pending"
        }
        
        # Don't strictly validate the 201 response since destination 1 might not exist for all test runs
        with self.client.post("/api/travel-requests/", json=payload, name="/api/travel-requests/ [POST]", catch_response=True) as response:
            # We consider 201 (Created) or 400 (Validation Error - e.g. dest not found) as valid load test responses
            if response.status_code in (201, 400):
                response.success()

    @task(2)
    def view_notifications(self):
        if not getattr(self.user, 'token', None):
            return
            
        self.client.get("/api/notifications/", name="/api/notifications/")
        self.client.get("/api/notifications/unread-count/", name="/api/notifications/unread-count/")

    @task(1)
    def view_ride_history(self):
        if not getattr(self.user, 'token', None):
            return
            
        self.client.get("/api/ride-history/", name="/api/ride-history/")
