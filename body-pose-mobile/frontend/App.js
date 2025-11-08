
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import PoseDetector from './components/PoseDetector';
import PoseVisualizer from './components/PoseVisualizer';

export default function App() {
  const [currentPoseData, setCurrentPoseData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('camera');

  const handlePoseDetected = (poseData) => {
    setCurrentPoseData(poseData);
    setActiveTab('results');
  };

  const handleProcessingStateChange = (processing) => {
    setIsProcessing(processing);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Body Pose Analyzer</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Body Tracking</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
          onPress={() => setActiveTab('camera')}
          disabled={isProcessing}
        >
          <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>
            📷 Camera
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.activeTab]}
          onPress={() => setActiveTab('results')}
          disabled={!currentPoseData || isProcessing}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>
            📊 Results
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'camera' && (
          <PoseDetector
            onPoseDetected={handlePoseDetected}
            onProcessingStateChange={handleProcessingStateChange}
          />
        )}

        {activeTab === 'results' && currentPoseData && (
          <PoseVisualizer poseData={currentPoseData} />
        )}

        {activeTab === 'results' && !currentPoseData && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No analysis results yet</Text>
            <Text style={styles.noResultsSubtext}>
              Switch to Camera tab to capture and analyze your pose
            </Text>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={() => setActiveTab('camera')}
            >
              <Text style={styles.analyzeButtonText}>Start Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.globalProcessingOverlay}>
          <View style={styles.processingModal}>
            <Text style={styles.processingTitle}>Analyzing Your Pose</Text>
            <Text style={styles.processingSubtitle}>
              Please hold still while we process the image...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noResultsText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  globalProcessingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingModal: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 250,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
