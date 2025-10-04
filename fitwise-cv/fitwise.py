import cv2
import time
import mediapipe as mp
import json
from multiprocessing import Process, Queue

from socket_server import send_landmark, start_server

model_path = './pose_landmarker_full.task'

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
PoseLandmarkerResult = mp.tasks.vision.PoseLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode

pose_result = None

def print_result(result: PoseLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    global pose_result
    pose_result = result

def run_pose_detection(queue: Queue):
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

                data = {
                    "timestamp": timestamp_ms,
                    "landmarks": landmarks
                }
                queue.put(json.dumps(data))
                
                #do reps
                from calculations import check_back_posture, check_arm_posture, num_reps
                #check_back_posture(pose_result.pose_landmarks[0], w, h)
                #check_arm_posture(pose_result.pose_landmarks[0], w, h)
                rep_count = num_reps(pose_result.pose_landmarks[0], w, h)
                cv2.putText(frame, f'Reps: {rep_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)



            cv2.imshow("FitWise Pose Tracking", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

def run_socket_server(queue: Queue):
    from socket_server import socketio, send_landmark, start_server
    from flask_socketio import emit

    @socketio.on("landmark")
    def handle_landmark(data):
        print("📩 Received from client:", data)
        emit("landmark", queue.get())

    # Start Flask-SocketIO server (blocking call)
    start_server()  


    # while True:
    #     try:
    #         data = queue.get()
    #         send_landmark(data)
    #     except Exception as e:
    #         print("⚠️ Socket error:", e)


if __name__ == "__main__":
    q = Queue()

    p1 = Process(target=run_pose_detection, args=(q,))
    p2 = Process(target=run_socket_server, args=(q,))

    p1.start()
    p2.start()

    p1.join()
    p2.join()
