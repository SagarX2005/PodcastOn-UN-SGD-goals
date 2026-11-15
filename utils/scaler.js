import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base screen you designed for
const guidelineBaseWidth = 1080;
const guidelineBaseHeight = 2436;

export const scale = size => (width / guidelineBaseWidth) * size;
export const verticalScale = size => (height / guidelineBaseHeight) * size;
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
