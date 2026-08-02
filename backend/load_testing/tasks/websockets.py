import time
import json
import websocket
from locust import TaskSet, task, events

class WebSocketClient:
    def __init__(self, host, token):
        self.host = host.replace("http://", "ws://").replace("https://", "wss://")
        self.token = token
        self.ws = None

    def connect(self, endpoint):
        url = f"{self.host}{endpoint}?token={self.token}"
        start_time = time.time()
        try:
            self.ws = websocket.create_connection(url, timeout=5)
            # Log successful connection
            events.request.fire(
                request_type="WebSocket",
                name=endpoint,
                response_time=int((time.time() - start_time) * 1000),
                response_length=0,
                exception=None,
                context={},
            )
            return True
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name=endpoint,
                response_time=int((time.time() - start_time) * 1000),
                response_length=0,
                exception=e,
                context={},
            )
            return False

    def send(self, endpoint, data):
        if not self.ws:
            return
            
        start_time = time.time()
        try:
            self.ws.send(json.dumps(data))
            # Just sending doesn't give us round trip latency unless we wait for a specific response.
            # For simplicity, we just log the send action.
            events.request.fire(
                request_type="WebSocket_Send",
                name=endpoint,
                response_time=int((time.time() - start_time) * 1000),
                response_length=len(json.dumps(data)),
                exception=None,
                context={},
            )
        except Exception as e:
            events.request.fire(
                request_type="WebSocket_Send",
                name=endpoint,
                response_time=int((time.time() - start_time) * 1000),
                response_length=0,
                exception=e,
                context={},
            )

    def close(self):
        if self.ws:
            self.ws.close()
            self.ws = None


class WebSocketTaskSet(TaskSet):
    def on_start(self):
        # We need the user to have logged in to get a token
        if getattr(self.user, 'token', None):
            self.ws_client = WebSocketClient(self.user.host, self.user.token)
            self.ws_client.connect("/ws/notifications/")
        else:
            self.ws_client = None

    def on_stop(self):
        if self.ws_client:
            self.ws_client.close()

    @task(1)
    def send_ping(self):
        if self.ws_client and self.ws_client.ws:
            self.ws_client.send("/ws/notifications/", {"type": "ping"})
