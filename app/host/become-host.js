import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Image, Platform, StatusBar, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../src/components/PageHeader';
import { hostApplicationAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius, shadows } from '../../src/utils/theme';

const STEPS = [
  { title: 'Welcome', icon: 'home' },
  { title: 'Basic Info', icon: 'person' },
  { title: 'Service Type', icon: 'briefcase' },
  { title: 'Identity', icon: 'card' },
  { title: 'Address', icon: 'location' },
  { title: 'Selfie', icon: 'camera' },
  { title: 'Payment', icon: 'card' },
  { title: 'Review', icon: 'checkmark-circle' },
];

export default function BecomeHostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState({ terms: false, responsibility: false, verification: false });
  const [rejectionInfo, setRejectionInfo] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    alternateEmail: '',
    phone: user?.phone || '',
    alternatePhone: '',
    serviceType: 'personal',
    area: '',
    idType: 'pan',
    idNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankBranch: '',
    bankName: '',
    upiId: '',
  });

  // File data
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [addressProofImage, setAddressProofImage] = useState(null);
  const [businessProofImage, setBusinessProofImage] = useState(null);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStep = await AsyncStorage.getItem('hostFormStep');
        const savedData = await AsyncStorage.getItem('hostFormData');
        if (savedStep) setCurrentStep(Number(savedStep));
        if (savedData) setFormData(JSON.parse(savedData));
      } catch (e) {
      }
    };
    restoreState();
  }, []);

  // Check rejection info on mount
  useEffect(() => {
    const checkRejectionStatus = async () => {
      try {
        const response = await hostApplicationAPI.getRejectionInfo();
        if (response.data) {
          setRejectionInfo(response.data);
        }
      } catch (e) {
        // Not critical - continue normally
      }
    };
    checkRejectionStatus();
  }, []);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    
    if (result.canceled) return;
    if (result.assets?.[0]) {
      setter(result.assets[0]);
    }
  };

  const takePhoto = async (setter) => {
    try {
      await AsyncStorage.setItem('hostFormStep', String(currentStep));
      await AsyncStorage.setItem('hostFormData', JSON.stringify(formData));
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: false,
        exif: false,
        allowsEditing: false,
      });
      
      if (result.canceled) return;
      if (result.assets && result.assets[0]) {
        setter(result.assets[0]);
      }
    } catch (error) {
      await pickImage(setter);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Welcome - check guidelines and rejection status
        // Check if user was previously rejected and cooldown not over
        if (rejectionInfo && !rejectionInfo.canApply) {
          const hours = rejectionInfo.hoursRemaining || Math.ceil((rejectionInfo.minutesRemaining || 0) / 60);
          const timeText = rejectionInfo.timeRemaining || `${rejectionInfo.minutesRemaining} minutes`;
          Alert.alert(
            'Application Rejected',
            `Your previous application was rejected.\n\nReason: ${rejectionInfo.rejectionReason}\n\nYou can reapply after ${timeText}.`,
            [{ text: 'OK' }]
          );
          return false;
        }
        if (!guidelinesAccepted) {
          Alert.alert('Required', 'Please accept the guidelines to continue');
          return false;
        }
        return true;
      case 1: // Basic Info - also check rejection status
        if (rejectionInfo && !rejectionInfo.canApply) {
          const timeText = rejectionInfo.timeRemaining || `${rejectionInfo.minutesRemaining} minutes`;
          Alert.alert(
            'Application Rejected',
            `Your previous application was rejected.\n\nReason: ${rejectionInfo.rejectionReason}\n\nYou can reapply after ${timeText}.`,
            [{ text: 'OK' }]
          );
          return false;
        }
        if (!formData.fullName || !formData.email || !formData.phone) {
          Alert.alert('Required', 'Please fill all required fields');
          return false;
        }
        // Validate phone (10 digits)
        if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
          Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
          return false;
        }
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        // Validate alternate phone if provided (must be 10 digits)
        if (formData.alternatePhone && formData.alternatePhone.length > 0) {
          if (!/^\d{10}$/.test(formData.alternatePhone.replace(/\D/g, ''))) {
            Alert.alert('Invalid Phone', 'Alternate phone must be 10 digits');
            return false;
          }
        }
        // Validate alternate email if provided (must be valid format)
        if (formData.alternateEmail && formData.alternateEmail.length > 0) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternateEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid alternate email address');
            return false;
          }
        }
        return true;
      case 2: // Service Type
        if (!formData.area) {
          Alert.alert('Required', 'Please enter your area/locality');
          return false;
        }
        return true;
      case 3: // Identity
        if (!idImage) {
          Alert.alert('Required', 'Please upload ID proof');
          return false;
        }
        if (!formData.idNumber) {
          Alert.alert('Required', 'Please enter ID number');
          return false;
        }
        // Validate ID number format
        const idNum = formData.idNumber.toUpperCase();
        if (formData.idType === 'aadhaar') {
          if (!/^\d{12}$/.test(formData.idNumber)) {
            Alert.alert('Invalid Aadhaar', 'Aadhaar number must be exactly 12 digits');
            return false;
          }
        } else if (formData.idType === 'pan') {
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(idNum)) {
            Alert.alert('Invalid PAN', 'PAN number must be in format ABCDE1234F');
            return false;
          }
        } else if (formData.idType === 'passport') {
          if (!/^[A-Z]{1}\d{7,8}$/.test(idNum)) {
            Alert.alert('Invalid Passport', 'Passport must be in format A1234567');
            return false;
          }
        }
        return true;
      case 4: // Address
        if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
          Alert.alert('Required', 'Please fill all address fields');
          return false;
        }
        // Validate pincode (6 digits)
        if (!/^\d{6}$/.test(formData.pincode)) {
          Alert.alert('Invalid Pincode', 'Pincode must be exactly 6 digits');
          return false;
        }
        // Validate state (not empty, realistic check)
        if (formData.state.length < 2) {
          Alert.alert('Invalid State', 'Please enter a valid state name');
          return false;
        }
        if (formData.serviceType === 'personal' && !addressProofImage) {
          Alert.alert('Required', 'Address proof is required for personal property listings');
          return false;
        }
        if (formData.serviceType === 'business' && !businessProofImage) {
          Alert.alert('Required', 'Business proof is required for business property listings');
          return false;
        }
        return true;
      case 5: // Selfie
        if (!selfieImage) {
          Alert.alert('Required', 'Please take a selfie');
          return false;
        }
        return true;
      case 6: // Payment Details
        if (!formData.bankAccountNumber) {
          Alert.alert('Required', 'Please enter your bank account number');
          return false;
        }
        if (!/^\d{9,18}$/.test(formData.bankAccountNumber)) {
          Alert.alert('Invalid Account', 'Account number must be 9-18 digits');
          return false;
        }
        if (!formData.ifscCode) {
          Alert.alert('Required', 'Please enter IFSC code');
          return false;
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
          Alert.alert('Invalid IFSC', 'IFSC code must be 11 characters (e.g., SBIN0001234)');
          return false;
        }
        if (!formData.bankBranch) {
          Alert.alert('Required', 'Please enter bank branch name');
          return false;
        }
        if (!formData.bankName) {
          Alert.alert('Required', 'Please enter bank name');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const formatUri = (uri) => {
    if (!uri) return uri;
    return uri.startsWith('file://') ? uri : `file://${uri}`;
  };

  const handleSubmit = async () => {
    if (!termsAccepted.terms || !termsAccepted.responsibility || !termsAccepted.verification) {
      Alert.alert('Terms Required', 'Please accept all terms to submit your application.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const data = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      // Append files
      if (idImage) {
        data.append('idImage', {
          uri: formatUri(idImage.uri),
          type: idImage.mimeType ?? idImage.type ?? 'image/jpeg',
          name: 'id_proof.jpg',
        });
      }

      if (selfieImage) {
        data.append('selfie', {
          uri: formatUri(selfieImage.uri),
          type: selfieImage.mimeType ?? selfieImage.type ?? 'image/jpeg',
          name: 'selfie.jpg',
        });
      }

      if (addressProofImage) {
        data.append('addressProof', {
          uri: formatUri(addressProofImage.uri),
          type: addressProofImage.mimeType ?? addressProofImage.type ?? 'image/jpeg',
          name: 'address_proof.jpg',
        });
      }

      if (businessProofImage && formData.serviceType === 'business') {
        data.append('businessProof', {
          uri: formatUri(businessProofImage.uri),
          type: businessProofImage.mimeType ?? businessProofImage.type ?? 'image/jpeg',
          name: 'business_proof.jpg',
        });
      }

      const response = await hostApplicationAPI.submit(data);
      
      if (response.data.message) {
        Alert.alert('Success', 'Application submitted successfully!', [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome / Intro
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Before you start:</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary, marginBottom: spacing.lg }]}>Read and agree to continue</Text>
            
            <View style={[styles.guidelinesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.guidelineText, { color: colors.textPrimary }]}>Provide accurate details — we may verify them</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.guidelineText, { color: colors.textPrimary }]}>Only list spaces you own or manage</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.guidelineText, { color: colors.textPrimary }]}>Follow local laws and platform guidelines</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.guidelineText, { color: colors.textPrimary }]}>Pricing, availability & cancellations are your responsibility</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.guidelineText, { color: colors.textPrimary }]}>We may review or remove listings if needed</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.guidelineCheckbox}
              onPress={() => setGuidelinesAccepted(!guidelinesAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, guidelinesAccepted && styles.checkboxChecked, { borderColor: guidelinesAccepted ? colors.primary : colors.border }]}>
                {guidelinesAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>I have read and agree to the hosting guidelines</Text>
            </TouchableOpacity>
          </View>
        );

      case 1: // Basic Info
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Full Legal Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.fullName}
                onChangeText={(v) => updateForm('fullName', v)}
                placeholder="As on your ID proof"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.email}
                onChangeText={(v) => updateForm('email', v.toLowerCase().trim())}
                placeholder="Primary email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <Text style={[styles.inputHint, { color: '#EF4444' }]}>Enter a valid email address</Text>
              )}
              {formData.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <Text style={[styles.inputHint, { color: '#16A34A' }]}>✓ Valid email</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Alternate Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.alternateEmail}
                onChangeText={(v) => updateForm('alternateEmail', v.toLowerCase().trim())}
                placeholder="Optional"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {formData.alternateEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternateEmail) && (
                <Text style={[styles.inputHint, { color: '#EF4444' }]}>Enter a valid email address</Text>
              )}
              {formData.alternateEmail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternateEmail) && (
                <Text style={[styles.inputHint, { color: '#16A34A' }]}>✓ Valid email</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.phone}
                onChangeText={(v) => updateForm('phone', v.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {formData.phone.length > 0 && formData.phone.length < 10 && (
                <Text style={[styles.inputHint, { color: '#EF4444' }]}>{10 - formData.phone.length} more digits needed</Text>
              )}
              {formData.phone.length === 10 && (
                <Text style={[styles.inputHint, { color: '#16A34A' }]}>✓ Valid phone number</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Alternate Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.alternatePhone}
                onChangeText={(v) => updateForm('alternatePhone', v.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {formData.alternatePhone.length > 0 && formData.alternatePhone.length < 10 && (
                <Text style={[styles.inputHint, { color: '#EF4444' }]}>{10 - formData.alternatePhone.length} more digits needed</Text>
              )}
              {formData.alternatePhone.length === 10 && (
                <Text style={[styles.inputHint, { color: '#16A34A' }]}>✓ Valid phone number</Text>
              )}
            </View>
          </View>
        );

      case 2: // Service Type
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Service Type</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Is this a personal property or a business?</Text>
            
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }, formData.serviceType === 'personal' && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
              onPress={() => updateForm('serviceType', 'personal')}
            >
              <Ionicons 
                name={formData.serviceType === 'personal' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={formData.serviceType === 'personal' ? colors.primary : colors.textLight} 
              />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Personal Property</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Your own space (home, apartment, villa)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }, formData.serviceType === 'business' && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
              onPress={() => updateForm('serviceType', 'business')}
            >
              <Ionicons 
                name={formData.serviceType === 'business' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={formData.serviceType === 'business' ? colors.primary : colors.textLight} 
              />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Business</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Commercial space (office, shop, venue)</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Area / City *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.area}
                onChangeText={(v) => updateForm('area', v)}
                placeholder="Where is your space located?"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        );

      case 3: // Identity
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Identity Verification</Text>
            <Text style={styles.stepDesc}>Upload a clear photo of your government ID</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>ID Type *</Text>
              <View style={styles.idTypeContainer}>
                {['pan', 'aadhaar', 'passport'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.idTypeBtn, { borderColor: colors.border, backgroundColor: colors.surface }, formData.idType === type && { borderColor: colors.primary, backgroundColor: colors.primary }]}
                    onPress={() => updateForm('idType', type)}
                  >
                    <Text style={[styles.idTypeText, { color: colors.textPrimary }, formData.idType === type && { color: '#FFFFFF' }]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>ID Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.idNumber}
                onChangeText={(v) => {
                  let formatted = v.toUpperCase();
                  if (formData.idType === 'aadhaar') {
                    formatted = v.replace(/\D/g, '').slice(0, 12);
                  } else if (formData.idType === 'pan') {
                    formatted = v.replace(/[^A-Z0-9]/g, '').slice(0, 10);
                  }
                  updateForm('idNumber', formatted);
                }}
                placeholder={`Enter your ${formData.idType.toUpperCase()} number`}
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
                keyboardType={formData.idType === 'aadhaar' ? 'numeric' : 'default'}
                maxLength={formData.idType === 'aadhaar' ? 12 : formData.idType === 'pan' ? 10 : 20}
              />
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                {formData.idType === 'aadhaar' && 'Format: 12 digits (e.g., 123456789012)'}
                {formData.idType === 'pan' && 'Format: ABCDE1234F'}
                {formData.idType === 'passport' && 'Format: A1234567'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Upload ID Proof *</Text>
              <TouchableOpacity style={[styles.uploadBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => pickImage(setIdImage)}>
                {idImage ? (
                  <Image source={{ uri: idImage.uri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload" size={48} color={colors.textLight} />
                    <Text style={[styles.uploadText, { color: colors.textLight }]}>Tap to upload</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4: // Address
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Address Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Full Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.address}
                onChangeText={(v) => updateForm('address', v)}
                placeholder="House/Flat No., Street, Area"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  value={formData.city}
                  onChangeText={(v) => updateForm('city', v)}
                  placeholder="City"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>State *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  value={formData.state}
                  onChangeText={(v) => updateForm('state', v)}
                  placeholder="State"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Pincode *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.pincode}
                onChangeText={(v) => updateForm('pincode', v)}
                placeholder="6-digit pincode"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Address Proof {formData.serviceType === 'personal' ? '*' : '(Optional)'}
              </Text>
              <TouchableOpacity style={[styles.uploadBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => pickImage(setAddressProofImage)}>
                {addressProofImage ? (
                  <Image source={{ uri: addressProofImage.uri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="document-text" size={48} color={colors.textLight} />
                    <Text style={styles.uploadText}>Bill, Utility Bill, or Address Proof</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Business Proof {formData.serviceType === 'business' ? '*' : '(Optional)'}
              </Text>
              <TouchableOpacity style={[styles.uploadBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => pickImage(setBusinessProofImage)}>
                {businessProofImage ? (
                  <Image source={{ uri: businessProofImage.uri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="business" size={48} color={colors.textLight} />
                    <Text style={styles.uploadText}>GST, Shop Act, or Business Registration</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Selfie
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Self Verification</Text>
            <Text style={styles.stepDesc}>Upload a picture of yourself so guests know who the host is</Text>
            
            <TouchableOpacity style={[styles.selfieBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => pickImage(setSelfieImage)}>
              {selfieImage ? (
                <Image source={{ uri: selfieImage.uri }} style={styles.selfieImage} />
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <Ionicons name="image-outline" size={64} color={colors.textLight} />
                  <Text style={[styles.selfieText, { color: colors.textPrimary }]}>Tap to upload your photo</Text>
                  <Text style={[styles.selfieSubtext, { color: colors.textSecondary }]}>A clear photo helps build trust with guests</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );

      case 6: // Payment Details
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Payment Details</Text>
            <Text style={styles.stepDesc}>Enter your bank account details for receiving payments</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Bank Account Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.bankAccountNumber}
                onChangeText={(v) => updateForm('bankAccountNumber', v.replace(/\D/g, ''))}
                placeholder="Enter account number"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                maxLength={18}
              />
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>9-18 digits</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>IFSC Code *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.ifscCode}
                onChangeText={(v) => updateForm('ifscCode', v.toUpperCase())}
                placeholder="e.g., SBIN0001234"
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
                maxLength={11}
              />
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>11 characters (e.g., SBIN0001234)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Bank Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.bankName}
                onChangeText={(v) => updateForm('bankName', v)}
                placeholder="e.g., State Bank of India"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Branch Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.bankBranch}
                onChangeText={(v) => updateForm('bankBranch', v)}
                placeholder="e.g., MG Road Branch"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>UPI ID (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.upiId}
                onChangeText={(v) => updateForm('upiId', v.toLowerCase())}
                placeholder="e.g., yourname@upi"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
              />
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>For faster payments (optional)</Text>
            </View>
          </View>
        );

      case 7: // Review
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Review & Submit</Text>
            
            <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>Basic Info</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Name: {formData.fullName}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Email: {formData.email}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Phone: {formData.phone}</Text>
            </View>

            <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>Service</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>{formData.serviceType === 'business' ? 'Business' : 'Personal Property'}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Area: {formData.area}</Text>
            </View>

            <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>Identity</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>{formData.idType.toUpperCase()}: {formData.idNumber}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>ID Photo: {idImage ? '✓ Uploaded' : '✗ Missing'}</Text>
            </View>

            <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>Address</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>{formData.address}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>{formData.city}, {formData.state} - {formData.pincode}</Text>
            </View>

            <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>Selfie</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Selfie: {selfieImage ? '✓ Uploaded' : '✗ Missing'}</Text>
            </View>

            <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>Payment Details</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Bank: {formData.bankName}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>A/C: **** {formData.bankAccountNumber.slice(-4)}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>IFSC: {formData.ifscCode}</Text>
              <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>Branch: {formData.bankBranch}</Text>
              {formData.upiId ? <Text style={[styles.reviewItem, { color: colors.textPrimary }]}>UPI: {formData.upiId}</Text> : null}
            </View>

            {/* T&C Box 1: Terms & Guidelines */}
            <View style={[styles.termBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={styles.termRow}
                onPress={() => setTermsAccepted(prev => ({ ...prev, terms: !prev.terms }))}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted.terms && styles.checkboxChecked, { borderColor: termsAccepted.terms ? colors.primary : colors.border }]}>
                  {termsAccepted.terms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={[styles.termTitle, { color: colors.textPrimary }]}>Terms & Guidelines</Text>
              </TouchableOpacity>
              <Text style={[styles.termDesc, { color: colors.textSecondary }]}>
                I agree to the{' '}
                <Text style={{ color: colors.primary, textDecorationLine: 'underline' }} onPress={() => router.push('/terms')}>Terms & Conditions</Text>
                ,{' '}
                <Text style={{ color: colors.primary, textDecorationLine: 'underline' }} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
                , and{' '}
                <Text style={{ color: colors.primary, textDecorationLine: 'underline' }} onPress={() => router.push('/host-policy')}>Host Policy</Text>
              </Text>
            </View>

            {/* T&C Box 2: Listing Responsibility */}
            <View style={[styles.termBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={styles.termRow}
                onPress={() => setTermsAccepted(prev => ({ ...prev, responsibility: !prev.responsibility }))}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted.responsibility && styles.checkboxChecked, { borderColor: termsAccepted.responsibility ? colors.primary : colors.border }]}>
                  {termsAccepted.responsibility && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={[styles.termTitle, { color: colors.textPrimary }]}>Listing Responsibility</Text>
              </TouchableOpacity>
              <Text style={[styles.termDesc, { color: colors.textSecondary }]}>
                I understand I am solely responsible for accurate property descriptions, pricing, availability, local law compliance, and handling cancellations per policy
              </Text>
            </View>

            {/* T&C Box 3: Verification Consent */}
            <View style={[styles.termBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={styles.termRow}
                onPress={() => setTermsAccepted(prev => ({ ...prev, verification: !prev.verification }))}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted.verification && styles.checkboxChecked, { borderColor: termsAccepted.verification ? colors.primary : colors.border }]}>
                  {termsAccepted.verification && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={[styles.termTitle, { color: colors.textPrimary }]}>Verification Consent</Text>
              </TouchableOpacity>
              <Text style={[styles.termDesc, { color: colors.textSecondary }]}>
                I consent to PosomePa verifying my identity and property details; I acknowledge that false information may result in listing removal and account termination
              </Text>
            </View>

            <Text style={[styles.termNote, { color: colors.textLight }]}>
              By continuing, you agree to our policies.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Using PageHeader style */}
      <LinearGradient 
        colors={['#A78BFA', '#C4B5FD', '#EDE9FE', '#F8FAFC']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pageHeaderContainer}
      >
        <View style={styles.pageHeaderRow}>
          <TouchableOpacity onPress={prevStep} style={styles.pageHeaderBack}>
            <Ionicons name="arrow-back" size={22} color="#1E0A4A" />
          </TouchableOpacity>
          <View style={styles.pageHeaderTitleBlock}>
            <Text style={styles.pageHeaderSubtitle}>Step {currentStep + 1} of {STEPS.length}</Text>
            <Text style={styles.pageHeaderTitle}>Become a Host</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View 
              key={index} 
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive
              ]} 
            />
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          renderStep()
        )}
      </ScrollView>

      {/* Footer - Continue button for navigation */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {currentStep < STEPS.length - 1 ? (
          <TouchableOpacity 
            style={[styles.nextBtn, { opacity: currentStep === 0 && !guidelinesAccepted ? 0.5 : 1 }]}
            onPress={nextStep}
            disabled={currentStep === 0 ? !guidelinesAccepted : false}
          >
            <LinearGradient
              colors={currentStep === 0 && !guidelinesAccepted ? ['#94A3B8', '#64748B'] : ['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGradient}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit Application</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // PageHeader styles
  pageHeaderContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageHeaderBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  pageHeaderTitleBlock: {
    flex: 1,
  },
  pageHeaderSubtitle: {
    fontSize: 12, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(139, 92, 246, 0.8)',
    marginBottom: 2,
  },
  pageHeaderTitle: {
    fontSize: 24, fontWeight: '700',
    color: '#1E0A4A',
  },
  
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#7C3AED',
    width: 24,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  stepContent: {},
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  idTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  idTypeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  idTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  uploadText: {
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  selfieBox: {
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfiePlaceholder: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  selfieText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  selfieSubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  selfieImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  reviewSection: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  reviewItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  
  // New styles for intro screen
  guidelinesCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  guidelineCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
  },
  startButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // New styles for T&C boxes
  termBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  termTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  termDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 34,
  },
  termNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },

  termsContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
  footer: {
    padding: spacing.xl,
  },
  nextBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
