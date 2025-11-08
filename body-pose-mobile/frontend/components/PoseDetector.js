
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import PoseDetectionAPI from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PoseDetector = ({ onPoseDetected, onProcessingStateChange }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const [serverStatus, setServerStatus] = useState('checking');

  const camera = useRef(null);

  useEffect(() => {
    checkPermissions();
    checkServerHealth();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const checkServerHealth = async () => {
    try {
      await PoseDetectionAPI.healthCheck();
      setServerStatus('connected');
    } catch (error) {
      setServerStatus('disconnected');
      console.warn('Server health check failed:', error.message);
    }
  };

  const takePicture = async () => {
    if (!cameraRef || isProcessing) return;

    setIsProcessing(true);
    onProcessingStateChange?.(true);

    try {
      const photo = await cameraRef.takePictureAsync({
        base64: true,
        quality: 0.8,
        exif: false,
      });

      const result = await PoseDetectionAPI.detectPose(photo.base64);
      
      if (result.success) {
        onPoseDetected?.(result);
      } else {
        Alert.alert('Detection Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Picture taking error:', error);
    } finally {
      setIsProcessing(false);
      onProcessingStateChange?.(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#F44336';
      case 'checking': return '#FF9800';
      default: return '#757575';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'connected': return 'Server Connected';
      case 'disconnected': return 'Server Offline';
      case 'checking': return 'Checking Server...';
      default: return 'Unknown Status';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.hintText}>
          Please enable camera permissions in your device settings
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={cameraType}
        ref={ref => {
          camera.current = ref;
          setCameraRef(ref);
        }}
        ratio="16:9"
      >
        <View style={styles.overlay}>
          {/* Status Indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: getServerStatusColor() }]}>
            <Text style={styles.statusText}>{getServerStatusText()}</Text>
          </View>

          {/* Camera Guidelines */}
          <View style={styles.guidelines}>
            <View style={styles.guidelineHorizontal} />
            <View style={styles.guidelineVertical} />
          </View>

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.processingText}>Analyzing Pose...</Text>
            </View>
          )}
        </View>
      </Camera>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={takePicture}
          disabled={isProcessing || serverStatus !== 'connected'}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>📸 Detect Pose</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={toggleCameraType}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>🔄 Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={checkServerHealth}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>🔍 Check Server</Text>
        </TouchableOpacity>
      </View>

      {/* Server Status Info */}
      {serverStatus !== 'connected' && (
        <View style={styles.serverWarning}>
          <Text style={styles.warningText}>
            ⚠️ Make sure Python backend is running on {PoseDetectionAPI.client.defaults.baseURL}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusIndicator: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  guidelines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelineHorizontal: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  guidelineVertical: {
    width: 2,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  serverWarning: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 10,
  },
  hintText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default PoseDetector;
