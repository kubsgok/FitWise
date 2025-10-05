import cv2
import time
import mediapipe as mp
import json
from multiprocessing import Process, Manager
from calculations import getRepsFromWorkoutId
from socket_server import start_server

# ---- Mediapipe setup ----
model_path = './pose_landmarker_full.task'

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
PoseLandmarkerResult = mp.tasks.vision.PoseLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode

pose_result = None


def print_result(result: PoseLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    """Callback from Mediapipe that stores the latest detection result."""
    global pose_result
    pose_result = result


# ------------------------- Pose Detection Process -------------------------
def run_pose_detection(shared_data):
    """Continuously performs pose detection and updates the shared data dict."""
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.LIVE_STREAM,
        result_callback=print_result
    )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Could not open camera.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    current_workout_id = "0"
    recorded_data = []  # 🟢 store the first 5 seconds of landmarks
    record_start = None

    with PoseLandmarker.create_from_options(options) as landmarker:
        start_time = time.time()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
            timestamp_ms = int((time.time() - start_time) * 1000)
            landmarker.detect_async(mp_image, timestamp_ms)

            # ✅ Read current workout ID from shared data
            current_workout_id = shared_data.get("workoutId", "0")

            if pose_result and pose_result.pose_landmarks:
                h, w, _ = frame.shape
                landmarks = []
                EXCLUDED_POINTS = [1, 2, 3, 4, 5, 6, 7, 8]

                for i, landmark in enumerate(pose_result.pose_landmarks[0]):
                    if i in EXCLUDED_POINTS:
                        continue
                    x, y = int(landmark.x * w), int(landmark.y * h)
                    cv2.circle(frame, (x, y), 4, (0, 255, 0), -1)
                    landmarks.append({
                        "id": i,
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": getattr(landmark, "visibility", None)
                    })

                reps, feedback = getRepsFromWorkoutId(pose_result.pose_landmarks[0], w, h, str(current_workout_id))
                print(feedback if feedback else "", end='\r')

                # ✅ Save snapshot to shared_data
                data_entry = {
                    "timestamp": timestamp_ms,
                    "workoutId": current_workout_id,
                    "landmarks": landmarks,
                    "reps": reps,
                    "message": feedback,
                }
                shared_data["json"] = json.dumps(data_entry)
                shared_data["reps"] = reps

                # # 🟢 Record first 5 seconds of data
                # if record_start is None:
                #     record_start = time.time()
                # elif time.time() - record_start <= 3:
                #     recorded_data.append(data_entry)x
                # elif len(recorded_data) > 0:
                #     # Save to file once 5 seconds pass
                #     with open("3.json", "w") as f:
                #         json.dump(recorded_data, f, indent=2)
                #     print("\n💾 Saved first 5 seconds of landmarks to 13.json")
                #     recorded_data.clear()  # prevent saving repeatedly

                cv2.putText(frame, f'Reps: {reps}', (10, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            cv2.imshow("FitWise Pose Tracking", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

# ------------------------- SocketIO Server Process -------------------------
def run_socket_server(shared_data):
    """Flask-SocketIO server that streams live pose data to clients."""
    from socket_server import socketio, start_server
    from flask_socketio import emit

    @socketio.on("landmark")
    def handle_landmark(workoutId):
        # ✅ Update workoutId globally in shared memory
        shared_data["workoutId"] = workoutId

        # ✅ Emit latest JSON snapshot
        if shared_data.get("json"):
            emit("landmark", shared_data["json"])
        else:
            emit("landmark", json.dumps({"error": "No pose data yet"}))

    print("🌐 SocketIO server is running...")
    start_server()


# ------------------------- Main Entry -------------------------
if __name__ == "__main__":
    manager = Manager()
    shared_data = manager.dict()
    shared_data["json"] = None
    shared_data["workoutId"] = "0"
    shared_data["reps"] = 0

    p1 = Process(target=run_pose_detection, args=(shared_data,))
    p2 = Process(target=run_socket_server, args=(shared_data,))

    p1.start()
    p2.start()

    p1.join()
    p2.join()
