import React from 'react';
import { View } from 'react-native';
import globalStyles from '../styles/globalStyles';

const ContentCard = ({ children, elevated = false, style = {} }) => {
  const cardStyle = elevated ? globalStyles.elevatedCard : globalStyles.contentCard;
  
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

export default ContentCard;