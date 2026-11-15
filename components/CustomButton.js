import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import globalStyles from '../styles/globalStyles';

const CustomButton = ({ 
  title, 
  onPress, 
  type = 'primary', // 'primary', 'secondary', 'outline'
  style = {},
  textStyle = {},
  disabled = false
}) => {
  const getButtonStyle = () => {
    switch (type) {
      case 'secondary':
        return globalStyles.secondaryButton;
      case 'outline':
        return globalStyles.outlineButton;
      default:
        return globalStyles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'secondary':
        return globalStyles.secondaryButtonText;
      case 'outline':
        return globalStyles.outlineButtonText;
      default:
        return globalStyles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        getButtonStyle(), 
        style,
        disabled && { opacity: 0.6 }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;