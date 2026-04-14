import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../utils/theme';

const CategoryChip = ({ category, selected, onPress }) => {
  const categoryColor = category?.color || '#8B5CF6';
  const iconName = category?.icon || 'grid-outline';
  const bgColor = categoryColor + '20';
  const borderColor = categoryColor + '50';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        { 
          backgroundColor: selected ? categoryColor : bgColor,
          borderColor: selected ? categoryColor : borderColor,
        }
      ]}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={iconName} 
        size={14} 
        color={selected ? '#FFFFFF' : categoryColor} 
      />
      <Text 
        style={[
          styles.text, 
          { color: selected ? '#FFFFFF' : categoryColor }
        ]}
      >
        {category?.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default CategoryChip;
