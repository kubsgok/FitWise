# controller.py
import subprocess
import os
import signal

process = None

def start_tracking():
    global process
    if process is None or process.poll() is not None:
        print("🚀 Starting FitWise tracking...")
        process = subprocess.Popen(["python", "fitwise.py"])  # 👈 use your actual filename
    else:
        print("⚠️ Tracking already running.")

def stop_tracking():
    global process
    if process and process.poll() is None:
        print("🛑 Stopping FitWise tracking...")
        os.kill(process.pid, signal.SIGTERM)
        process = None

