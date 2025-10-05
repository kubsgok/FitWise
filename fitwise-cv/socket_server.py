from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Client connections
@socketio.on("connect")
def handle_connect():
    print("✅ Client connected")

@socketio.on("disconnect")
def handle_disconnect():
    print("❌ Client disconnected")

# # Example: handle test message from client
# @socketio.on("landmark")
# def handle_landmark(data):
#     print("📩 Received from client:", data)
#     emit("server_ack", {"msg": "Landmark data received"})

def send_landmark(landmark_data):
    """Send landmark JSON to all connected clients"""
    socketio.emit("landmark", landmark_data)

def start_server():
    print("🌐 Flask-SocketIO server running at http://localhost:6432")
    socketio.run(app, host="0.0.0.0", port=6432, allow_unsafe_werkzeug=True)