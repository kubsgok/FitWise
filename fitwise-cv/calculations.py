import time as time
import math

def calculate_angle(a, b, c):
    """
    Calculates the angle (in degrees) at point b formed by points a, b, and c.
    a, b, c are tuples of (x, y).
    """
    # Get vectors
    ab = (a[0] - b[0], a[1] - b[1])
    cb = (c[0] - b[0], c[1] - b[1])
    
    # Calculate dot product and magnitude
    dot_product = ab[0]*cb[0] + ab[1]*cb[1]
    magnitude_ab = math.sqrt(ab[0]**2 + ab[1]**2)
    magnitude_cb = math.sqrt(cb[0]**2 + cb[1]**2)
    
    # Avoid division errors
    if magnitude_ab == 0 or magnitude_cb == 0:
        return 0

    # Compute angle
    cosine_angle = dot_product / (magnitude_ab * magnitude_cb)
    angle = math.degrees(math.acos(max(min(cosine_angle, 1.0), -1.0)))
    
    return angle



    

def check_back_posture(landmarks, image_width, image_height, max_deviation = 15):
    # Use left-side joints (you can also check right if you prefer)
    left_shoulder = landmarks[11]
    left_hip = landmarks[23]
    left_knee = landmarks[25]

    # Convert normalized coordinates to pixel space
    a = (left_shoulder.x * image_width, left_shoulder.y * image_height)
    b = (left_hip.x * image_width, left_hip.y * image_height)
    c = (left_knee.x * image_width, left_knee.y * image_height)

    angle = calculate_angle(a, b, c)

    # Check if the back is bent more than 10 degrees from vertical
    deviation = abs(180 - angle)
    if deviation > max_deviation:
        print(f"⚠️ Straighten your back! (Deviation: {deviation:.2f}°)")

def check_arm_posture(landmarks, image_width, image_height, max_deviation = 90):
    # Use left-side joints (you can also check right if you prefer)
    left_shoulder = landmarks[11]
    left_elbow = landmarks[13]
    left_wrist = landmarks[15]

    # Convert normalized coordinates to pixel space
    a = (left_shoulder.x * image_width, left_shoulder.y * image_height)
    b = (left_elbow.x * image_width, left_elbow.y * image_height)
    c = (left_wrist.x * image_width, left_wrist.y * image_height)

    angle = calculate_angle(a, b, c)

    # Check if the arm is bent more than 10 degrees from straight
    deviation = abs(180 - angle)
    if deviation < max_deviation:
        print(f"⚠️ Keep going lower on your push ups: (Deviation: {deviation:.2f}°)")

rep_count = 0
pushup_stage = "up"

def num_reps(landmarks, image_width, image_height, down_threshold=90):
    """
    Counts push-up reps based on elbow angle.
    down_threshold: angle (in degrees) when you're at the bottom of a push-up
    up_threshold: angle (in degrees) when you return to top
    """ 
    global rep_count, pushup_stage
    # Use left-side joints (you can also check right if you prefer)
    left_shoulder = landmarks[11]
    left_elbow = landmarks[13]
    left_wrist = landmarks[15]

    a = (left_shoulder.x * image_width, left_shoulder.y * image_height)
    b = (left_elbow.x * image_width, left_elbow.y * image_height)
    c = (left_wrist.x * image_width, left_wrist.y * image_height)

    angle = calculate_angle(a, b, c)

    # Logic to detect push-up phase transitions
    if angle < down_threshold:
        pushup_stage = "down"

    # When you go back up and were previously down => count one rep
    elif angle >= down_threshold and pushup_stage == "down":
        rep_count += 1
        pushup_stage = "up"
        print(f"✅ Push-up count: {rep_count}")

    return rep_count
