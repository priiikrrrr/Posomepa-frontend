import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, ScrollView, Image, Dimensions } from "react-native";

const { width } = Dimensions.get('window');

const iconDataSets = {
  set1: [
    { name: 'Apartment', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', color: '#FF6B6B' },
    { name: 'Villa', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400', color: '#4ECDC4' },
    { name: 'Studio', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400', color: '#45B7D1' },
    { name: 'Penthouse', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400', color: '#96CEB4' },
    { name: 'Cottage', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400', color: '#FFEAA7' },
    { name: 'Office', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', color: '#DDA0DD' },
  ],
  set2: [
    { name: 'Beach House', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400', color: '#98D8C8' },
    { name: 'Mountain View', image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400', color: '#F7DC6F' },
    { name: 'City Loft', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', color: '#BB8FCE' },
    { name: 'Garden Suite', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400', color: '#82E0AA' },
    { name: 'Lake House', image: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=400', color: '#85C1E9' },
  ],
  set3: [
    { name: 'Modern Living', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400', color: '#F8B500' },
    { name: 'Classic Style', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', color: '#8E6B4D' },
    { name: 'Cozy Space', image: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400', color: '#E8A87C' },
    { name: 'Luxury Suite', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', color: '#C7B8EA' },
    { name: 'Budget Friendly', image: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400', color: '#7FB3D5' },
  ],
};

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 2.5;
const SCROLL_SPEED = 1.2;

const SmoothInfinite = ({
  scrollDirection = 'down',
  iconSet = 'set1',
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(true);
  const iconData = iconDataSets[iconSet];
  
  const extendedItems = [...iconData, ...iconData, ...iconData, ...iconData];
  const singleSetHeight = iconData.length * ITEM_HEIGHT;

  useEffect(() => {
    let offset = scrollDirection === 'up' ? singleSetHeight : 0;
    
    const animate = () => {
      if (!isScrolling) return;
      
      if (scrollDirection === 'down') {
        offset += SCROLL_SPEED;
        if (offset >= singleSetHeight) {
          offset = 0;
        }
      } else {
        offset -= SCROLL_SPEED;
        if (offset <= 0) {
          offset = singleSetHeight;
        }
      }
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: offset, animated: false });
      }
    };

    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [scrollDirection, singleSetHeight, isScrolling]);

  const containerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;

  return (
    <View style={styles.outerWrapper}>
      <View style={[styles.wrapper, { height: containerHeight }]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>✦ Property Types</Text>
        </View>
        
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onTouchStart={() => setIsScrolling(false)}
          onTouchEnd={() => setIsScrolling(true)}
        >
          {extendedItems.map((item, idx) => (
            <View 
              key={`${item.name}-${idx}`} 
              style={[styles.card, { borderLeftColor: item.color }]}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardArrow}>→</Text>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>↓ Auto-scrolling</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  container: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    height: ITEM_HEIGHT - 10,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: 100,
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  colorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    letterSpacing: 0.3,
  },
  cardArrow: {
    fontSize: 20,
    color: '#999',
    fontWeight: '600',
  },
});

export default SmoothInfinite;
