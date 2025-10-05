from collections import deque
import time
import math

# --- Global tracking ---
angle_history = deque(maxlen=5)  # smooth angle over last 5 frames

rep_counters = {
    '13': 0,  # Push-ups
    '3': 0,   # Squats
}

stages = {
    '13': 'up',
    '3': 'up',
}

last_times = {
    '13': 0,
    '3': 0,
}

# 🔹 Track squat depth over time
last_depth_check = 0
last_squat_depth_angle = 999


# -------------------------------
# 🔹 Utility functions
# -------------------------------
def calculate_angle(a, b, c):
    """Calculates the angle (in degrees) at point b formed by points a, b, and c."""
    ab = (a[0] - b[0], a[1] - b[1])
    cb = (c[0] - b[0], c[1] - b[1])

    dot_product = ab[0] * cb[0] + ab[1] * cb[1]
    magnitude_ab = math.sqrt(ab[0] ** 2 + ab[1] ** 2)
    magnitude_cb = math.sqrt(cb[0] ** 2 + cb[1] ** 2)

    if magnitude_ab == 0 or magnitude_cb == 0:
        return 0

    cosine_angle = dot_product / (magnitude_ab * magnitude_cb)
    angle = math.degrees(math.acos(max(min(cosine_angle, 1.0), -1.0)))
    return angle


def smoothed_angle(angle):
    """Applies a simple moving average filter."""
    angle_history.append(angle)
    return sum(angle_history) / len(angle_history)


# -------------------------------
# 🔹 Feedback functions
# -------------------------------
def check_back_posture(landmarks, image_width, image_height, max_deviation=30):
    """Warn if back is bent too much."""
    left_shoulder = landmarks[11]
    left_hip = landmarks[23]
    left_knee = landmarks[27]

    a = (left_shoulder.x * image_width, left_shoulder.y * image_height)
    b = (left_hip.x * image_width, left_hip.y * image_height)
    c = (left_knee.x * image_width, left_knee.y * image_height)

    angle = calculate_angle(a, b, c)
    deviation = abs(180 - angle)

    if deviation > max_deviation:
        return f"⚠️ Straighten your back! (Deviation: {deviation:.1f}°)"
    return None


def check_depth(angle, down_threshold, workoutId, stage):
    """Warn if user doesn't reach full depth before going up."""
    global last_depth_check, last_squat_depth_angle

    # still going down → no warning yet
    if stage == "down":
        # Track the minimum angle seen while going down (squat depth)
        if workoutId == '3':
            last_squat_depth_angle = min(last_squat_depth_angle, angle)
        return None

    # Only apply periodic check for squats
    if workoutId == '3':
        now = time.time()
        # Every 5 seconds, check if squat depth has been sufficient
        if now - last_depth_check > 5:
            last_depth_check = now
            if last_squat_depth_angle > down_threshold + 15:
                last_squat_depth_angle = 999  # reset after warning
                return "Make sure to go deeper into your squat!"
            # Reset tracking even if fine
            last_squat_depth_angle = 999

    # Standard depth check for push-ups
    if workoutId == '13':
        if angle > down_threshold + 20 and stage == "up":
            return "💪 Try going lower on your push-ups!"

    return None


# -------------------------------
# 🔹 Rep counting logic
# -------------------------------
def count_reps(landmarks, image_width, image_height, workoutId,
               down_threshold, up_threshold, cooldown):
    """Generic function to count reps for both push-ups and squats."""
    global rep_counters, stages, last_times

    current_time = time.time()

    # Select correct joints
    if workoutId == '13':  # Push-ups → elbow
        a = (landmarks[11].x * image_width, landmarks[11].y * image_height)  # shoulder
        b = (landmarks[13].x * image_width, landmarks[13].y * image_height)  # elbow
        c = (landmarks[15].x * image_width, landmarks[15].y * image_height)  # wrist
    elif workoutId == '3':  # Squats → knee
        a = (landmarks[23].x * image_width, landmarks[23].y * image_height)  # hip
        b = (landmarks[25].x * image_width, landmarks[25].y * image_height)  # knee
        c = (landmarks[27].x * image_width, landmarks[27].y * image_height)  # ankle
    else:
        return rep_counters[workoutId], None

    raw_angle = calculate_angle(a, b, c)
    angle = smoothed_angle(raw_angle)
    stage = stages[workoutId]
    message = None

    # Going down
    if angle <= down_threshold and stage == "up":
        stages[workoutId] = "down"

    # Going up (count rep)
    elif angle >= up_threshold and stage == "down":
        if current_time - last_times[workoutId] > cooldown:
            rep_counters[workoutId] += 1
            last_times[workoutId] = current_time
            stages[workoutId] = "up"
            message = f"✅ Rep {rep_counters[workoutId]} complete!"

    # Depth feedback (5s periodic for squats, normal for push-ups)
    depth_warning = check_depth(angle, down_threshold, workoutId, stages[workoutId])
    if depth_warning:
        message = depth_warning

    # Back posture feedback
    back_feedback = check_back_posture(landmarks, image_width, image_height)
    if back_feedback:
        message = back_feedback

    return rep_counters[workoutId], message


# -------------------------------
# 🔹 Public interface
# -------------------------------
def getRepsFromWorkoutId(landmarks, image_width, image_height, workoutId):
    """Return total reps and feedback message for the given workout."""
    if workoutId == '13':  # Push-ups
        return count_reps(landmarks, image_width, image_height, workoutId,
                          down_threshold=90, up_threshold=160, cooldown=0.5)
    elif workoutId == '3':  # Squats
        return count_reps(landmarks, image_width, image_height, workoutId,
                          down_threshold=97, up_threshold=160, cooldown=0.5)
    else:
        return 0, None
