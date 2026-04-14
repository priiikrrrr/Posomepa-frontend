import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, shadows } from '../utils/theme';
import { FadeIn } from './Animations';

const GradientCard = ({ 
  children, 
  onPress, 
  gradient = 'primary', 
  style, 
  disabled = false,
  animated = true,
  delay = 0,
  height,
  borderWidth = 0,
  borderColor = colors.primary
}) => {
  const gradientColors = gradients[gradient] || gradients.primary;
  
  const CardWrapper = animated ? FadeIn : View;
  const cardProps = animated ? { delay, duration: 400 } : {};
  
  const content = (
    <View style={[
      styles.card, 
      { height },
      borderWidth > 0 && { borderWidth, borderColor, borderRadius: borderRadius.xl },
      style
    ]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.shine} />
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <CardWrapper {...cardProps}>
        <TouchableOpacity 
          onPress={onPress} 
          activeOpacity={0.8}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper {...cardProps}>
      {content}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: borderRadius.xl,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
});

export default GradientCard;
