import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, Modal, TextInput, StyleSheet, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import LocationService from '../../src/utils/LocationService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacesAPI, categoriesAPI, uploadAPI } from '../../src/api/client';
import { Image } from 'react-native';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import PageHeader from '../../src/components/PageHeader';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius, shadows } from '../../src/utils/theme';

const PREDEFINED_RULES = [
  'Alcohol Allowed',
  'Smoking Allowed',
  'Non-Veg Allowed',
  'Pets Allowed',
  'Parties Allowed',
  'Female Guests Only',
];

const RESTRICTIVE_RULES = [
  'Alcohol Not Allowed',
  'Pets Not Allowed',
  'Parties Not Allowed',
  'Non-Veg Not Allowed',
  'No Loud Music',
  'No Smoking',
  'Max 2 Guests',
  'No Outside Food',
  'Males Not Allowed',
];

const BASIC_AMENITIES = [
  { id: 'wifi', label: 'WiFi', category: 'Core Basics' },
  { id: 'ac', label: 'Air Conditioning (AC)', category: 'Core Basics' },
  { id: 'power_backup', label: 'Power Backup', category: 'Core Basics' },
  { id: 'washroom', label: 'Washroom', category: 'Core Basics' },
  { id: 'water', label: 'Drinking Water', category: 'Core Basics' },
  { id: 'seating', label: 'Seating (chairs/sofa)', category: 'Space Setup' },
  { id: 'tables', label: 'Tables / Work Desk', category: 'Space Setup' },
  { id: 'beds', label: 'Beds / Mattress', category: 'Space Setup' },
  { id: 'parking', label: 'Parking Available', category: 'Access & Convenience' },
  { id: '24hr_access', label: '24/7 Access', category: 'Access & Convenience' },
  { id: 'lift', label: 'Lift / Elevator', category: 'Access & Convenience' },
  { id: 'charging', label: 'Charging Points', category: 'Work / Tech' },
  { id: 'projector', label: 'Projector / Screen', category: 'Work / Tech' },
  { id: 'whiteboard', label: 'Whiteboard', category: 'Work / Tech' },
  { id: 'kitchen', label: 'Kitchen Access', category: 'Kitchen / Food' },
  { id: 'outside_food', label: 'Outside Food Allowed', category: 'Kitchen / Food' },
  { id: 'loud_music', label: 'Loud Music Allowed', category: 'Events / Social' },
  { id: 'smoking', label: 'Smoking Allowed', category: 'Events / Social' },
  { id: 'cctv', label: 'CCTV', category: 'Safety' },
  { id: 'security', label: 'Security Guard', category: 'Safety' },
  { id: 'valid_id', label: 'Valid ID Required', category: 'Safety' },
];

const CATEGORY_SUGGESTIONS = {
  'Studios': ['ring_light', 'backdrop', 'mirror'],
  'Podcast Rooms': ['microphone', 'headphones', 'soundproof'],
  'Content Creator': ['ring_light', 'backdrop', 'props'],
  'Influencer Spaces': ['ring_light', 'backdrop', 'mirror'],
  'Coworking': ['wifi', 'whiteboard', 'printer'],
  'Private Offices': ['wifi', 'printer', 'phone'],
  'Meeting Rooms': ['projector', 'whiteboard', 'phone'],
  'Interview Rooms': ['wifi', 'seating', 'recording'],
  'Classrooms': ['projector', 'whiteboard', 'seating'],
  'Workshop Rooms': ['whiteboard', 'tools', 'seating'],
  'Banquet Halls': ['parking', 'catering_area', 'sound_system'],
  'Wedding Venues': ['parking', 'decor', 'catering_area'],
  'Party Halls': ['music_system', 'dance_floor', 'lighting'],
  'Clubs & Lounges': ['music_system', 'bar', 'lighting'],
  'Karaoke': ['music_system', 'lighting', 'seating'],
  'Home Theatres': ['projector', 'surround_sound', 'seating'],
  'Gaming Rooms': ['gaming_chairs', 'screens', 'ac'],
  'VR Rooms': ['vr_headsets', 'sensors', 'ac'],
  'Gyms': ['equipment', 'ac', 'changing_room'],
  'Yoga Studios': ['yoga_mats', 'mirrors', 'sound_system'],
  'Sports Rooms': ['sports_equipment', 'ac', 'seating'],
  'Spa Rooms': ['towels', 'aromatherapy', 'music'],
  'Jacuzzi': ['towels', 'changing_room', 'music'],
  'Private Pools': ['towels', 'lounge_seating', 'music'],
  'Apartments': ['furniture', 'kitchen', 'parking'],
  'Villas': ['furniture', 'pool', 'garden'],
  'Rooftops': ['seating', 'lighting', 'music'],
  'Private Rooms': ['furniture', 'ac', 'parking'],
  'Farmhouses': ['garden', 'parking', 'bbq'],
  'Day-use Rooms': ['furniture', 'ac', 'bathroom'],
  'Resorts': ['pool', 'garden', 'parking'],
  'Beachfront': ['beach_access', 'lounge_seating', 'umbrella'],
  'Gardens': ['seating', 'lighting', 'decoration'],
  'Lawns': ['seating', 'lighting', 'tent_option'],
  'Open Grounds': ['parking', 'lighting', 'seating'],
  'Camping': ['tents', 'campfire', 'parking'],
  'Pop-up Shops': ['shelving', 'counter', 'signage'],
  'Showrooms': ['display_units', 'lighting', 'ac'],
  'Dating Spots': ['romantic_lighting', 'music', 'seating'],
  'Pet-friendly': ['pet_beds', 'outdoor_space', 'water_bowl'],
  'Ashrams': ['meditation_hall', 'garden', 'vegetarian_food'],
  'Garages': ['security', 'cctv', 'lighting'],
  'Shared Spaces': ['furniture', 'ac', 'parking'],
};

const SUGGESTION_LABELS = {
  ring_light: 'Ring Light',
  backdrop: 'Backdrop',
  mirror: 'Mirror',
  microphone: 'Microphone',
  headphones: 'Headphones',
  soundproof: 'Soundproof',
  props: 'Props',
  wifi: 'WiFi',
  whiteboard: 'Whiteboard',
  printer: 'Printer',
  projector: 'Projector',
  phone: 'Phone',
  seating: 'Seating',
  recording: 'Recording',
  tools: 'Tools',
  parking: 'Parking',
  catering_area: 'Catering Area',
  sound_system: 'Sound System',
  dance_floor: 'Dance Floor',
  lighting: 'Lighting',
  bar: 'Bar',
  surround_sound: 'Surround Sound',
  gaming_chairs: 'Gaming Chairs',
  screens: 'Screens',
  vr_headsets: 'VR Headsets',
  sensors: 'Sensors',
  equipment: 'Gym Equipment',
  changing_room: 'Changing Room',
  yoga_mats: 'Yoga Mats',
  sports_equipment: 'Sports Equipment',
  towels: 'Towels',
  aromatherapy: 'Aromatherapy',
  music: 'Music System',
  lounge_seating: 'Lounge Seating',
  furniture: 'Furniture',
  pool: 'Pool',
  garden: 'Garden',
  bbq: 'BBQ Area',
  beach_access: 'Beach Access',
  umbrella: 'Umbrella',
  decoration: 'Decoration',
  tent_option: 'Tent Option',
  tents: 'Tents',
  campfire: 'Campfire',
  shelving: 'Shelving',
  counter: 'Counter',
  signage: 'Signage',
  display_units: 'Display Units',
  romantic_lighting: 'Romantic Lighting',
  pet_beds: 'Pet Beds',
  outdoor_space: 'Outdoor Space',
  water_bowl: 'Water Bowl',
  meditation_hall: 'Meditation Hall',
  vegetarian_food: 'Vegetarian Food',
  ac: 'Air Conditioning',
};

export default function ManageSpaces() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [coordinatesStatus, setCoordinatesStatus] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    address: '',
    pincode: '',
    manualLat: '',
    manualLng: '',
    selectedCategory: null,
    amenities: [],
    customAmenities: '',
    images: [],
    rules: [],
    customRule: '',
    notes: '',
  });

  const initialFormData = {
    title: '',
    description: '',
    price: '',
    city: '',
    address: '',
    pincode: '',
    manualLat: '',
    manualLng: '',
    selectedCategory: null,
    amenities: [],
    customAmenities: '',
    images: [],
    rules: [],
    customRule: '',
    notes: '',
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      price: '',
    });
  };

  const openEditModal = (space) => {
    setEditingSpace(space);
    const categoryName = typeof space.category === 'object' ? space.category?.name : space.category;
    const categoryList = categoriesData?.categories || categoriesData || [];
    const categoryObj = categoryList.find(c => c.name === categoryName);
    setFormData({
      title: space.title || '',
      description: space.description || '',
      price: String(space.price || '199'),
      city: space.location?.city || '',
      address: space.location?.address || '',
      pincode: space.location?.pincode || '',
      manualLat: space.location?.coordinates?.lat ? String(space.location.coordinates.lat) : '',
      manualLng: space.location?.coordinates?.lng ? String(space.location.coordinates.lng) : '',
      selectedCategory: categoryObj || null,
      amenities: space.amenities || [],
      customAmenities: '',
      images: space.images || [],
      rules: (space.rules || []).map(r => {
        if (r === 'Alcohol') return 'Alcohol Allowed';
        if (r === 'Smoking') return 'Smoking Allowed';
        if (r === 'Non-Veg') return 'Non-Veg Allowed';
        return r;
      }),
      customRule: '',
      notes: space.notes || '',
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets) {
      const newImages = [...formData.images, ...result.assets];
      setFormData({ ...formData, images: newImages });
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const toggleRule = (rule) => {
    const currentRules = formData.rules || [];
    if (currentRules.includes(rule)) {
      setFormData({ ...formData, rules: currentRules.filter(r => r !== rule) });
    } else {
      setFormData({ ...formData, rules: [...currentRules, rule] });
    }
  };

  const toggleAmenity = (amenityId) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(amenityId)) {
      setFormData({ ...formData, amenities: currentAmenities.filter(a => a !== amenityId) });
    } else {
      setFormData({ ...formData, amenities: [...currentAmenities, amenityId] });
    }
  };

  const applyCategorySuggestions = () => {
    if (formData.selectedCategory) {
      const suggestions = CATEGORY_SUGGESTIONS[formData.selectedCategory.name] || [];
      const currentAmenities = formData.amenities || [];
      const newSuggestions = suggestions.filter(s => !currentAmenities.includes(s));
      if (newSuggestions.length > 0) {
        setFormData({ ...formData, amenities: [...currentAmenities, ...newSuggestions] });
        Alert.alert('Suggestions Applied', `Added: ${newSuggestions.map(s => SUGGESTION_LABELS[s] || s).join(', ')}`);
      }
    }
  };

  const getCategorySuggestions = () => {
    if (formData.selectedCategory) {
      return CATEGORY_SUGGESTIONS[formData.selectedCategory.name] || [];
    }
    return [];
  };

  const selectCategory = (category) => {
    setFormData({ ...formData, selectedCategory: category });
    setCategoryModalVisible(false);
  };

  const useCurrentLocation = async () => {
    setGettingLocation(true);
    setCoordinatesStatus('Getting GPS location...');
    
    try {
      const location = await LocationService.getCurrentLocation();
      
      if (location && location.latitude && location.longitude) {
        setFormData(prev => ({
          ...prev,
          manualLat: String(location.latitude),
          manualLng: String(location.longitude),
        }));
        setCoordinatesStatus(`GPS Location set: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again or enter coordinates manually.');
      setCoordinatesStatus('GPS failed, try again');
    } finally {
      setGettingLocation(false);
    }
  };

  const getCoordinatesFromAddress = async (address, city) => {
    const cleanAddress = address
      .replace(/gal[iea]+\s*number\s*\d+/gi, '')
      .replace(/near\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const searchAttempts = [
      `${cleanAddress}, ${city}, Maharashtra, India`,
      `${cleanAddress}, ${city}, India`,
      `${cleanAddress}, ${city}`,
      `${city}, India`,
      city,
    ];
    
    // Try Nominatim (free, no API key needed)
    for (let i = 0; i < searchAttempts.length; i++) {
      const searchAddress = searchAttempts[i];
      if (!searchAddress) continue;
      
      try {
        // Rate limit: wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        const encodedAddress = encodeURIComponent(searchAddress);
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in&addressdetails=1`,
          { 
            headers: { 
              'User-Agent': 'PosomePa/1.0 (contact@posomepa.com)' 
            } 
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].lat && data[0].lon) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          
          // Validate India bounds
          if (coords.lat >= 6 && coords.lat <= 37 && coords.lng >= 68 && coords.lng <= 98) {
            console.log('Geocoded to:', coords);
            return coords;
          }
        }
      } catch (error) {
        console.log('Nominatim error:', error);
      }
    }
    
    // Default to Mumbai if nothing works
    console.log('Could not geocode, using default Mumbai coordinates');
    return { lat: 19.0760, lng: 72.8777 };
  };

  const uploadImagesToServer = async (images) => {
    try {
      console.log('Uploading', images.length, 'images...');
      const response = await uploadAPI.uploadImages(images);
      console.log('Upload success:', response.data);
      return response.data.images;
    } catch (error) {
      console.log('Upload error:', error);
      console.log('Upload error response:', error.response?.data);
      throw new Error('Failed to upload images: ' + (error.response?.data?.message || error.message));
    }
  };

  const { data: spacesData, isLoading } = useQuery({
    queryKey: ['mySpaces'],
    queryFn: () => spacesAPI.getMy({ limit: 100 }).then(res => res.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: spacesAPI.create,
    onSuccess: (data) => {
      console.log('Space created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['mySpaces'] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Space created successfully');
    },
    onError: (error) => {
      console.log('Create mutation error:', error);
      console.log('Error response:', error.response?.data);
      const errorData = error.response?.data;
      if (errorData?.requiresHostVerification) {
        Alert.alert(
          'Verification Required',
          'You must be a verified host to list properties. Would you like to apply now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Apply Now', onPress: () => router.push('/host/become-host') }
          ]
        );
      } else {
        Alert.alert('Error', errorData?.message || 'Failed to create space');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await spacesAPI.update(id, data);
      return { ...response, spaceId: id };
    },
    onSuccess: (result) => {
      console.log('Space updated successfully:', result);
      queryClient.invalidateQueries({ queryKey: ['mySpaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['featured'] });
      queryClient.invalidateQueries({ queryKey: ['space', result.spaceId] });
      setModalVisible(false);
      setEditingSpace(null);
      resetForm();
      Alert.alert('Success', 'Space updated successfully');
    },
    onError: (error) => {
      console.log('Update mutation error:', error);
      console.log('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update space');
    },
  });

  const handleDelete = async (id) => {
    try {
      await spacesAPI.delete(id);
      queryClient.invalidateQueries({ queryKey: ['mySpaces'] });
      Alert.alert('Success', 'Space deleted successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete space');
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please login to view this page</Text>
        <Button title="Go to Login" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!formData.selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!formData.price) {
      Alert.alert('Error', 'Please enter a price');
      return;
    }

    const priceNum = Number(formData.price);
    if (priceNum < 199) {
      Alert.alert('Error', 'Minimum price is ₹199');
      return;
    }

    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting property creation...');
      
      let imageUrls = [];
      const newImages = formData.images.filter(img => img.uri);
      const existingImages = formData.images.filter(img => !img.uri && typeof img === 'string');
      console.log('New images:', newImages.length, 'Existing images:', existingImages.length);
      
      if (newImages.length > 0) {
        const uploadedImages = await uploadImagesToServer(newImages);
        // Extract just the URL from each uploaded image object
        imageUrls = uploadedImages.map(img => img.url);
        imageUrls = [...imageUrls, ...existingImages];
      } else {
        imageUrls = existingImages.length > 0 ? existingImages : ['https://placehold.co/400x300/8B5CF6/ffffff?text=No+Image'];
      }
      console.log('Image URLs:', imageUrls);

      const address = formData.address || formData.city;
      
      let coordinates;
      if (formData.manualLat && formData.manualLng) {
        coordinates = {
          lat: parseFloat(formData.manualLat),
          lng: parseFloat(formData.manualLng),
        };
        setCoordinatesStatus('Using manual coordinates');
      } else if (editingSpace) {
        const oldAddress = (editingSpace.location?.address || editingSpace.location?.city || '').toLowerCase().trim();
        const newAddress = address.toLowerCase().trim();
        const existingCoords = editingSpace.location?.coordinates;
        
        if (oldAddress !== newAddress || !existingCoords || (existingCoords.lat === 0 && existingCoords.lng === 0)) {
          setGeocoding(true);
          setCoordinatesStatus('Getting location...');
          coordinates = await getCoordinatesFromAddress(address, formData.city);
        } else {
          coordinates = existingCoords;
          setCoordinatesStatus('Using existing coordinates');
        }
      } else {
        setGeocoding(true);
        setCoordinatesStatus('Getting location...');
        coordinates = await getCoordinatesFromAddress(address, formData.city);
        setCoordinatesStatus(`Location set: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
      }
      setGeocoding(false);
      console.log('Coordinates:', coordinates);

      const customAmenitiesList = formData.customAmenities
        .split(',')
        .map(a => a.trim().toLowerCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const payload = {
        title: formData.title,
        description: formData.description,
        price: priceNum,
        priceType: 'hourly',
        amenities: [...formData.amenities, ...customAmenitiesList],
        images: imageUrls,
        location: {
          city: formData.city,
          address: address,
          state: '',
          pincode: formData.pincode || '',
          coordinates: coordinates,
        },
        category: formData.selectedCategory._id,
        rules: [...new Set(formData.customRule 
          ? [...formData.rules, formData.customRule]
          : formData.rules)],
        notes: formData.notes || '',
      };
      console.log('Payload prepared, submitting...');

      if (editingSpace) {
        updateMutation.mutate({ id: editingSpace._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.log('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to save property');
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const spaces = spacesData?.spaces || [];

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title="My Listed Spaces"
        subtitle="Manage Properties"
        showBack={true}
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity onPress={openAddModal} style={styles.addHeaderButton}>
            <Ionicons name="add" size={24} color="#1E0A4A" />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading spaces...</Text>
        </View>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.spaceCard}>
              <Image
                source={{ uri: item.images?.[0] || 'https://placehold.co/100x100/8B5CF6/ffffff?text=N' }}
                style={styles.spaceImage}
              />
              <View style={styles.spaceInfo}>
                <Text style={styles.spaceTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.spaceCity}>{item.location?.city}</Text>
                <View style={styles.priceTag}>
                  <Text style={styles.spacePrice}>₹{item.price}</Text>
                  <Text style={styles.priceType}>/hour</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
                  <Ionicons name="pencil" size={18} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Delete Property?', 'This property will be removed.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item._id) }
                  ]);
                }} style={styles.deleteButton}>
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={56} color={colors.textLight} />
              <Text style={styles.emptyText}>No spaces listed yet</Text>
              <Button title="+ Add Your First Space" onPress={openAddModal} style={styles.addFirstButton} />
            </View>
          }
        />
      )}

      {/* Category Selection Modal */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categoriesData?.categories || categoriesData || []}
              keyExtractor={(item) => item._id}
              numColumns={2}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    formData.selectedCategory?._id === item._id && styles.categoryItemSelected
                  ]}
                  onPress={() => selectCategory(item)}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={styles.categoryItemText} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSpace ? 'Edit Space' : 'Add New Space'}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Input
                label="Title *"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Modern Downtown Loft"
              />

              <Input
                label="Description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe your space..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity 
                style={styles.categorySelector}
                onPress={() => setCategoryModalVisible(true)}
              >
                {formData.selectedCategory ? (
                  <View style={styles.selectedCategoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: formData.selectedCategory.color }]} />
                    <Text style={styles.selectedCategoryText}>{formData.selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.categoryPlaceholder}>Select a category</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {formData.selectedCategory && (
                <>
                  <Text style={styles.suggestionHeader}>
                    <Ionicons name="bulb-outline" size={16} color={colors.primary} /> Smart Suggestions
                  </Text>
                  <View style={styles.suggestionRow}>
                    {getCategorySuggestions().slice(0, 4).map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={[
                          styles.suggestionChip,
                          formData.amenities.includes(suggestion) && styles.suggestionChipActive
                        ]}
                        onPress={() => toggleAmenity(suggestion)}
                      >
                        <Text style={[
                          styles.suggestionText,
                          formData.amenities.includes(suggestion) && styles.suggestionTextActive
                        ]}>
                          {SUGGESTION_LABELS[suggestion] || suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.priceSection}>
                <Text style={styles.label}>Price (₹) *</Text>
                <View style={styles.priceInputRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={formData.price}
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                      if (num >= 199) {
                        setFormData({ ...formData, price: String(num) });
                      } else if (num > 0) {
                        setFormData({ ...formData, price: String(num) });
                      } else {
                        setFormData({ ...formData, price: text });
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textLight}
                  />
                  <Text style={styles.priceSuffix}>/hour</Text>
                </View>
                <Text style={styles.minPriceText}>Minimum: ₹199</Text>
              </View>

              <Input
                label="City *"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="e.g., Mumbai"
              />

              <Input
                label="Address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Full address (optional)"
              />

              <Input
                label="Pincode"
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                placeholder="Enter 6-digit pincode"
                keyboardType="numeric"
                maxLength={6}
              />

              <Input
                label="Space Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Any special instructions, rules, or notes about your space"
                multiline
                numberOfLines={3}
              />

              <View style={styles.coordinatesStatus}>
                <Ionicons 
                  name={coordinatesStatus.includes('GPS') ? "navigate" : coordinatesStatus.includes('set:') ? "checkmark-circle" : coordinatesStatus.includes('manual') ? "create-outline" : coordinatesStatus.includes('existing') ? "hourglass-outline" : "location-outline"} 
                  size={18} 
                  color={coordinatesStatus.includes('GPS') ? '#2563EB' : coordinatesStatus.includes('set:') ? '#16A34A' : '#6B7280'} 
                />
                <Text style={[styles.coordinatesStatusText, { flex: 1 }, coordinatesStatus.includes('GPS') && styles.coordinatesStatusGps]}>
                  {coordinatesStatus || 'Location will be auto-detected from address'}
                </Text>
                <TouchableOpacity 
                  style={styles.gpsButton}
                  onPress={useCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="locate" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Amenities</Text>
              {['Core Basics', 'Space Setup', 'Access & Convenience', 'Work / Tech', 'Kitchen / Food', 'Events / Social', 'Safety'].map((cat) => {
                const catAmenities = BASIC_AMENITIES.filter(a => a.category === cat);
                return (
                  <View key={cat} style={styles.amenityCategory}>
                    <Text style={styles.amenityCategoryLabel}>{cat}</Text>
                    <View style={styles.amenityRow}>
                      {catAmenities.map((amenity) => {
                        const isSelected = (formData.amenities || []).includes(amenity.id);
                        return (
                          <TouchableOpacity
                            key={amenity.id}
                            style={[styles.amenityChip, isSelected && styles.amenityChipSelected]}
                            onPress={() => toggleAmenity(amenity.id)}
                          >
                            <Ionicons 
                              name={isSelected ? 'checkbox' : 'square-outline'} 
                              size={16} 
                              color={isSelected ? colors.white : colors.textSecondary} 
                            />
                            <Text style={[styles.amenityText, isSelected && styles.amenityTextSelected]} numberOfLines={1}>
                              {amenity.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <Input
                label="Additional Amenities (comma separated)"
                value={formData.customAmenities}
                onChangeText={(text) => setFormData({ ...formData, customAmenities: text })}
                placeholder="e.g., coffee machine, books, games"
              />

              <Text style={styles.label}>Property Rules - Allowed</Text>
              <View style={styles.rulesContainer}>
                {PREDEFINED_RULES.map((rule) => {
                  const isSelected = (formData.rules || []).includes(rule);
                  return (
                    <TouchableOpacity
                      key={rule}
                      style={[styles.ruleChip, isSelected && styles.ruleChipSelected]}
                      onPress={() => toggleRule(rule)}
                    >
                      <Ionicons 
                        name={isSelected ? 'checkbox' : 'square-outline'} 
                        size={18} 
                        color={isSelected ? colors.white : colors.textSecondary} 
                      />
                      <Text style={[styles.ruleChipText, isSelected && styles.ruleChipTextSelected]}>
                        {rule}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: '#DC2626' }]}>Property Rules - Not Allowed / Restrictions</Text>
              <View style={styles.rulesContainer}>
                {RESTRICTIVE_RULES.map((rule) => {
                  const isSelected = (formData.rules || []).includes(rule);
                  return (
                    <TouchableOpacity
                      key={rule}
                      style={[styles.ruleChip, isSelected && styles.restrictiveRuleSelected]}
                      onPress={() => toggleRule(rule)}
                    >
                      <Ionicons 
                        name={isSelected ? 'checkbox' : 'square-outline'} 
                        size={18} 
                        color={isSelected ? colors.white : '#DC2626'} 
                      />
                      <Text style={[styles.ruleChipText, isSelected && styles.ruleChipTextSelected]}>
                        {rule}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Input
                label="Other Rules (optional)"
                value={formData.customRule}
                onChangeText={(text) => setFormData({ ...formData, customRule: text })}
                placeholder="Enter any other rules..."
              />

              <Text style={styles.label}>Images</Text>
              <View style={styles.imageGrid}>
                {formData.images.map((img, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: img.uri || img }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.images.length < 10 && (
                  <View style={styles.addImageButtons}>
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                      <Ionicons name="images-outline" size={24} color={colors.primary} />
                      <Text style={styles.addImageText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {uploading && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.uploadingText}>Uploading images...</Text>
                </View>
              )}

              <Button
                title={editingSpace ? 'Save Changes' : 'Create Space'}
                onPress={handleSubmit}
                loading={uploading || createMutation.isPending || updateMutation.isPending}
                style={styles.submitButton}
              />

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    padding: 16,
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  spaceCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  spaceImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  spaceInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  spaceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  spaceCity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spacePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  priceType: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actionButtons: {
    justifyContent: 'center',
    gap: spacing.xs,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  addFirstButton: {
    paddingHorizontal: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.xs,
  },
  selectedCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selectedCategoryText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryPlaceholder: {
    fontSize: 14,
    color: colors.textLight,
  },
  suggestionHeader: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionChipActive: {
    backgroundColor: colors.primary,
  },
  suggestionText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  suggestionTextActive: {
    color: colors.white,
  },
  amenityCategory: {
    marginBottom: 4,
  },
  amenityCategoryLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    gap: 4,
    maxWidth: '48%',
  },
  amenityChipSelected: {
    backgroundColor: colors.primary,
  },
  amenityText: {
    fontSize: 10,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  amenityTextSelected: {
    color: colors.white,
  },
  categoryList: {
    padding: spacing.sm,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    margin: 4,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray50,
    maxWidth: '47%',
    minHeight: 90,
  },
  categoryItemSelected: {
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryItemText: {
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  priceSection: {
    marginVertical: spacing.xs,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  priceSuffix: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  minPriceText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  coordinatesStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  coordinatesStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  coordinatesStatusSuccess: {
    color: '#16A34A',
    fontWeight: '600',
  },
  coordinatesStatusGps: {
    color: '#2563EB',
    fontWeight: '600',
  },
  gpsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  ruleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: 4,
  },
  ruleChipSelected: {
    backgroundColor: colors.primary,
  },
  restrictiveRuleSelected: {
    backgroundColor: '#DC2626',
  },
  ruleChipText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  ruleChipTextSelected: {
    color: colors.white,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flex: 1,
  },
  addImageButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
  },
  addImageText: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: 12,
    color: colors.primary,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
