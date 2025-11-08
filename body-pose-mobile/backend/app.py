from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import base64
import io
from PIL import Image
import logging
from datetime import datetime
import time

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:19006", "exp://192.168.*.*:19000"])

class AdvancedBodyPoseDetector:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Инициализация моделей
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # Высокая точность
            smooth_landmarks=True,
            enable_segmentation=False,
            smooth_segmentation=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Настройки для рисования
        self.landmark_drawing_spec = self.mp_drawing.DrawingSpec(
            color=(0, 255, 0), thickness=2, circle_radius=2
        )
        self.connection_drawing_spec = self.mp_drawing.DrawingSpec(
            color=(255, 0, 0), thickness=2
        )
        
        logger.info("Body Pose Detector initialized")

    def process_image(self, image_data):
        try:
            start_time = time.time()
            
            # Декодируем base64 изображение
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            
            # Конвертируем BGR to RGB
            image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
            
            # Обрабатываем позу
            results = self.pose.process(image_rgb)
            
            processing_time = time.time() - start_time
            
            response_data = {
                'success': True,
                'processing_time': round(processing_time, 3),
                'timestamp': datetime.now().isoformat(),
                'landmarks': [],
                'connections': [],
                'distances': [],
                'angles': [],
                'pose_classification': None,
                'image_with_landmarks': None
            }
            
            if results.pose_landmarks:
                landmarks_data = self.extract_landmarks_data(results.pose_landmarks.landmark)
                response_data['landmarks'] = landmarks_data
                response_data['connections'] = self.get_pose_connections()
                response_data['distances'] = self.calculate_body_distances(results.pose_landmarks.landmark)
                response_data['angles'] = self.calculate_joint_angles(results.pose_landmarks.landmark)
                response_data['pose_classification'] = self.classify_pose(results.pose_landmarks.landmark)
                
                # Генерируем изображение с landmarks
                annotated_image = self.draw_landmarks_on_image(image_np, results)
                response_data['image_with_landmarks'] = self.image_to_base64(annotated_image)
            
            logger.info(f"Pose processed in {processing_time:.3f}s - {len(response_data['landmarks'])} landmarks found")
            return response_data
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def extract_landmarks_data(self, landmarks):
        landmarks_data = []
        for idx, landmark in enumerate(landmarks):
            landmarks_data.append({
                'index': idx,
                'x': float(landmark.x),
                'y': float(landmark.y),
                'z': float(landmark.z),
                'visibility': float(landmark.visibility),
                'name': self.get_landmark_name(idx)
            })
        return landmarks_data

    def get_landmark_name(self, index):
        """Возвращает название для каждой ключевой точки"""
        names = {
            0: "Nose", 1: "Left Eye Inner", 2: "Left Eye", 3: "Left Eye Outer",
            4: "Right Eye Inner", 5: "Right Eye", 6: "Right Eye Outer",
            7: "Left Ear", 8: "Right Ear", 9: "Mouth Left", 10: "Mouth Right",
            11: "Left Shoulder", 12: "Right Shoulder", 13: "Left Elbow",
            14: "Right Elbow", 15: "Left Wrist", 16: "Right Wrist",
            17: "Left Pinky", 18: "Right Pinky", 19: "Left Index",
            20: "Right Index", 21: "Left Thumb", 22: "Right Thumb",
            23: "Left Hip", 24: "Right Hip", 25: "Left Knee", 26: "Right Knee",
            27: "Left Ankle", 28: "Right Ankle", 29: "Left Heel",
            30: "Right Heel", 31: "Left Foot Index", 32: "Right Foot Index"
        }
        return names.get(index, f"Point_{index}")

    def get_pose_connections(self):
        """Возвращает соединения между точками позы"""
        return list(self.mp_pose.POSE_CONNECTIONS)

    def calculate_body_distances(self, landmarks):
        """Вычисляет расстояния между ключевыми точками тела"""
        distances = []
        
        # Важные пары точек для измерения
        key_pairs = [
            (11, 12, "Shoulder Width"),      # Плечи
            (23, 24, "Hip Width"),           # Бедра
            (11, 23, "Left Side Body"),      # Левая сторона тела
            (12, 24, "Right Side Body"),     # Правая сторона тела
            (15, 16, "Hands Distance"),      # Расстояние между руками
            (11, 15, "Left Arm"),           # Левая рука
            (12, 16, "Right Arm"),          # Правая рука
            (23, 25, "Left Thigh"),         # Левое бедро
            (24, 26, "Right Thigh"),        # Правое бедро
            (25, 27, "Left Shin"),          # Левая голень
            (26, 28, "Right Shin")          # Правая голень
        ]
        
        for idx1, idx2, label in key_pairs:
            if (idx1 < len(landmarks) and idx2 < len(landmarks) and
                landmarks[idx1].visibility > 0.5 and landmarks[idx2].visibility > 0.5):
                
                p1 = landmarks[idx1]
                p2 = landmarks[idx2]
                
                # Вычисляем Euclidean distance
                distance = np.sqrt(
                    (p1.x - p2.x)**2 + 
                    (p1.y - p2.y)**2 + 
                    (p1.z - p2.z)**2
                )
                
                distances.append({
                    'label': label,
                    'distance': float(distance * 100),  # В условных единицах
                    'point1': idx1,
                    'point2': idx2,
                    'point1_name': self.get_landmark_name(idx1),
                    'point2_name': self.get_landmark_name(idx2)
                })
        
        return distances

    def calculate_joint_angles(self, landmarks):
        """Вычисляет углы в суставах"""
        angles = []
        
        # Углы для вычисления
        angle_configs = [
            (11, 13, 15, "Left Elbow Angle"),    # Левый локоть
            (12, 14, 16, "Right Elbow Angle"),   # Правый локоть
            (13, 11, 23, "Left Shoulder Angle"), # Левое плечо
            (14, 12, 24, "Right Shoulder Angle"), # Правое плечо
            (23, 25, 27, "Left Knee Angle"),     # Левое колено
            (24, 26, 28, "Right Knee Angle")     # Правое колено
        ]
        
        for idx1, idx2, idx3, label in angle_configs:
            if all(idx < len(landmarks) for idx in [idx1, idx2, idx3]):
                p1, p2, p3 = landmarks[idx1], landmarks[idx2], landmarks[idx3]
                
                if all(p.visibility > 0.5 for p in [p1, p2, p3]):
                    angle = self.calculate_angle_3d(p1, p2, p3)
                    angles.append({
                        'label': label,
                        'angle': float(angle),
                        'joint_point': idx2,
                        'joint_name': self.get_landmark_name(idx2)
                    })
        
        return angles

    def calculate_angle_3d(self, a, b, c):
        """Вычисляет угол между тремя точками в 3D пространстве"""
        # Векторы BA и BC
        ba = np.array([a.x - b.x, a.y - b.y, a.z - b.z])
        bc = np.array([c.x - b.x, c.y - b.y, c.z - b.z])
        
        # Косинус угла
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        cosine_angle = np.clip(cosine_angle, -1, 1)
        
        # Угол в градусах
        angle = np.degrees(np.arccos(cosine_angle))
        return angle

    def classify_pose(self, landmarks):
        """Классифицирует позу на основе положения тела"""
        if len(landmarks) < 25:
            return "Unknown"
        
        # Проверяем поднятые руки
        left_hand_up = (landmarks[15].y < landmarks[11].y and 
                       landmarks[15].visibility > 0.5)
        right_hand_up = (landmarks[16].y < landmarks[12].y and 
                        landmarks[16].visibility > 0.5)
        
        # Проверяем положение ног
        left_leg_bent = (landmarks[25].y < landmarks[23].y and 
                        landmarks[25].visibility > 0.5)
        right_leg_bent = (landmarks[26].y < landmarks[24].y and 
                         landmarks[26].visibility > 0.5)
        
        # Классификация поз
        if left_hand_up and right_hand_up:
            return "Hands Up"
        elif left_hand_up:
            return "Left Hand Up"
        elif right_hand_up:
            return "Right Hand Up"
        elif left_leg_bent and right_leg_bent:
            return "Squat Position"
        else:
            return "Standing"

    def draw_landmarks_on_image(self, image, results):
        """Рисует landmarks на изображении и возвращает base64"""
        annotated_image = image.copy()
        
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                annotated_image,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                self.landmark_drawing_spec,
                self.connection_drawing_spec
            )
        
        return annotated_image

    def image_to_base64(self, image):
        """Конвертирует изображение в base64"""
        try:
            _, buffer = cv2.imencode('.jpg', image)
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/jpeg;base64,{image_base64}"
        except Exception as e:
            logger.error(f"Error converting image to base64: {str(e)}")
            return None

# Инициализация детектора
detector = AdvancedBodyPoseDetector()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Body Pose Detection API',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/detect-pose', methods=['POST'])
def detect_pose():
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        image_data = data['image']
        result = detector.process_image(image_data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    return jsonify({
        'model': 'MediaPipe Pose',
        'landmark_count': 33,
        'max_image_size': '1920x1080',
        'supported_formats': ['JPEG', 'PNG', 'BMP']
    })

if __name__ == '__main__':
    logger.info("Starting Body Pose Detection API...")
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
