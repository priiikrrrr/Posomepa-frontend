import * as Location from 'expo-location';

const LocationService = {
  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  },

  async checkPermission() {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  },

  async getCurrentLocation() {
    try {
      const permission = await this.checkPermission();
      
      if (permission !== 'granted') {
        const requested = await this.requestPermission();
        if (requested !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.log('Get location error:', error);
      throw error;
    }
  }
};

export default LocationService;
