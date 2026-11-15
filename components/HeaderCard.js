import React from 'react';
import { View, Text } from 'react-native';
import globalStyles from '../styles/globalStyles';

const HeaderCard = ({ title, subtitle, children }) => {
  return (
    <View style={globalStyles.headerCard}>
      <Text style={globalStyles.headerTitle}>{title}</Text>
      {subtitle && (
        <Text style={globalStyles.welcomeText}>{subtitle}</Text>
      )}
      {children}
    </View>
  );
};

export default HeaderCard;