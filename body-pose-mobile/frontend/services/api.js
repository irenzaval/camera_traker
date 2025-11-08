
import axios from 'axios';

// Конфигурация API
const API_CONFIG = {
  // Для разработки - укажите IP вашего компьютера в сети
  BASE_URL: 'http://192.168.0.134/api', // ЗАМЕНИТЕ НА ВАШ IP!
  TIMEOUT: 30000,
};

class PoseDetectionAPI {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Интерцептор для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw new Error(this.getErrorMessage(error));
      }
    );
  }

  getErrorMessage(error) {
    if (error.code === 'ECONNREFUSED') {
      return 'Cannot connect to server. Please check if the Python backend is running.';
    } else if (error.response) {
      return error.response.data.error || 'Server error occurred';
    } else if (error.request) {
      return 'No response from server. Check your network connection.';
    } else {
      return 'An unexpected error occurred';
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async detectPose(imageBase64) {
    try {
      const response = await this.client.post('/detect-pose', {
        image: imageBase64,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Pose detection failed: ${error.message}`);
    }
  }

  async getStatistics() {
    try {
      const response = await this.client.get('/statistics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

export default new PoseDetectionAPI();
