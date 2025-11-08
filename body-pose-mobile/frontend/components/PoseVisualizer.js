
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const PoseVisualizer = ({ poseData }) => {
  if (!poseData || !poseData.success) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No pose data available</Text>
      </View>
    );
  }

  const { landmarks, distances, angles, pose_classification, image_with_landmarks, processing_time } = poseData;

  const visibleLandmarks = landmarks.filter(l => l.visibility > 0.5);
  const highConfidenceLandmarks = landmarks.filter(l => l.visibility > 0.8);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Body Pose Analysis</Text>
        <Text style={styles.subtitle}>
          Processed in {processing_time}s • {visibleLandmarks.length} landmarks detected
        </Text>
      </View>

      {/* Annotated Image */}
      {image_with_landmarks && (
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Annotated Image</Text>
          <Image
            source={{ uri: image_with_landmarks }}
            style={styles.annotatedImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Pose Classification */}
      {pose_classification && (
        <View style={styles.classificationSection}>
          <Text style={styles.sectionTitle}>Pose Classification</Text>
          <View style={[
            styles.classificationBadge,
            { backgroundColor: getPoseColor(pose_classification) }
          ]}>
            <Text style={styles.classificationText}>{pose_classification}</Text>
          </View>
        </View>
      )}

      {/* Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Detection Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{landmarks.length}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{visibleLandmarks.length}</Text>
            <Text style={styles.statLabel}>Visible</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{highConfidenceLandmarks.length}</Text>
            <Text style={styles.statLabel}>High Confidence</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((visibleLandmarks.length / landmarks.length) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Detection Rate</Text>
          </View>
        </View>
      </View>

      {/* Distances */}
      {distances.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Measurements</Text>
          {distances.map((distance, index) => (
            <View key={index} style={styles.distanceItem}>
              <View style={styles.distanceHeader}>
                <Text style={styles.distanceLabel}>{distance.label}</Text>
                <Text style={styles.distanceValue}>
                  {distance.distance.toFixed(2)} units
                </Text>
              </View>
              <Text style={styles.distancePoints}>
                {distance.point1_name} → {distance.point2_name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Joint Angles */}
      {angles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joint Angles</Text>
          {angles.map((angle, index) => (
            <View key={index} style={styles.angleItem}>
              <Text style={styles.angleLabel}>{angle.label}</Text>
              <View style={styles.angleValueContainer}>
                <Text style={styles.angleValue}>
                  {angle.angle.toFixed(1)}°
                </Text>
                <View style={styles.angleBar}>
                  <View 
                    style={[
                      styles.angleFill,
                      { width: `${Math.min(angle.angle, 180) / 180 * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Landmarks List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detected Landmarks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.landmarksList}>
            {landmarks.slice(0, 20).map((landmark, index) => (
              <View 
                key={index} 
                style={[
                  styles.landmarkItem,
                  { opacity: landmark.visibility > 0.5 ? 1 : 0.3 }
                ]}
              >
                <Text style={styles.landmarkIndex}>#{landmark.index}</Text>
                <Text style={styles.landmarkName}>{landmark.name}</Text>
                <Text style={styles.landmarkConfidence}>
                  {Math.round(landmark.visibility * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const getPoseColor = (pose) => {
  const colors = {
    'Hands Up': '#4CAF50',
    'Left Hand Up': '#2196F3',
    'Right Hand Up': '#2196F3',
    'Squat Position': '#FF9800',
    'Standing': '#9C27B0',
    'Unknown': '#757575'
  };
  return colors[pose] || '#757575';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  imageSection: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  annotatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  classificationSection: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
  },
  classificationBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  classificationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
  },
  distanceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  distancePoints: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  angleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  angleLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  angleValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  angleValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  angleBar: {
    width: 100,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  angleFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 3,
  },
  landmarksList: {
    flexDirection: 'row',
  },
  landmarkItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  landmarkIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },
  landmarkName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  landmarkConfidence: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
});

export default PoseVisualizer;
