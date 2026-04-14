import React from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, borderRadius, spacing, shadows } from '../utils/theme';

const MapView = ({ coordinates, address }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={48} color={colors.primary} />
        <Text style={styles.placeholderText}>Map view available in mobile app</Text>
        {address && <Text style={styles.address}>{address}</Text>}
      </View>
    );
  }

  const lat = coordinates?.lat || 0;
  const lng = coordinates?.lng || 0;
  
  const hasValidCoords = lat !== 0 && lng !== 0;
  
  if (!hasValidCoords) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={48} color={colors.textLight} />
        <Text style={styles.placeholderText}>Location details will be available after booking confirmation</Text>
        {address && <Text style={styles.address}>{address}</Text>}
      </View>
    );
  }
  
  const mapAddress = encodeURIComponent(address || 'Mumbai, India');
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; }
        html, body { height: 100%; width: 100%; }
        #map { height: 100%; width: 100%; }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
        var marker = L.marker([${lat}, ${lng}]).addTo(map);
        marker.bindPopup('${address || 'Property Location'}').openPopup();
      </script>
    </body>
    </html>
  `;
  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        source={{ html: mapHtml }}
        scrollEnabled={false}
        zoomEnabled={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
      />
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
        </View>
        <Button
          title="Get Directions"
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)}
          icon={<Ionicons name="navigate" size={16} color={colors.white} />}
          size="small"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  placeholder: {
    height: 200,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  address: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  addressCard: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.lg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
});

export default MapView;
