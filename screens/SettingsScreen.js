import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../styles/globalStyles';

// 🔥 Reusable Card with Analytics-style design (matching ProfileScreen)
const AppCard = ({ children, style }) => (
  <LinearGradient
    colors={['#1A1A20', '#0A0A0F']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
      {
        borderRadius: 22,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(138,43,226,0.4)',
      },
      style,
    ]}
  >
    {children}
  </LinearGradient>
);

// Settings Toggle Component
const SettingsToggle = ({ icon, title, subtitle, value, onValueChange, color = "#FF69B4" }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  }}>
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `rgba(${color === '#FF69B4' ? '255,105,180' : '138,43,226'},0.2)`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: `rgba(${color === '#FF69B4' ? '255,105,180' : '138,43,226'},0.3)`,
      }}
    >
      <Feather name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#F5F5F5', marginBottom: 2 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 13, color: '#BBB' }}>
          {subtitle}
        </Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#333', true: '#8A2BE2' }}
      thumbColor={value ? '#FF69B4' : '#666'}
      ios_backgroundColor="#333"
    />
  </View>
);

// Audio Quality Selector Component
const AudioQualitySelector = ({ selectedQuality, onQualityChange }) => {
  const qualities = [
    { key: 'high', label: 'High', subtitle: 'Best quality, larger files', icon: 'star' },
    { key: 'medium', label: 'Medium', subtitle: 'Good quality, moderate files', icon: 'circle' },
    { key: 'low', label: 'Low', subtitle: 'Fast streaming, smaller files', icon: 'minus' }
  ];

  return (
    <View>
      {qualities.map((quality, index) => (
        <TouchableOpacity
          key={quality.key}
          onPress={() => onQualityChange(quality.key)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.md,
            borderBottomWidth: index < qualities.length - 1 ? 1 : 0,
            borderBottomColor: 'rgba(255,255,255,0.1)',
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: selectedQuality === quality.key 
                ? 'rgba(255,105,180,0.3)' 
                : 'rgba(255,105,180,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
              borderWidth: 1,
              borderColor: selectedQuality === quality.key 
                ? 'rgba(255,105,180,0.6)' 
                : 'rgba(255,105,180,0.2)',
            }}
          >
            <Feather
              name={quality.icon}
              size={18}
              color={selectedQuality === quality.key ? '#FF69B4' : '#BBB'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: selectedQuality === quality.key ? '#FF69B4' : '#F5F5F5', 
              marginBottom: 2 
            }}>
              {quality.label}
            </Text>
            <Text style={{ fontSize: 13, color: '#BBB' }}>
              {quality.subtitle}
            </Text>
          </View>
          {selectedQuality === quality.key && (
            <Feather name="check-circle" size={24} color="#FF69B4" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [audioQuality, setAudioQuality] = useState('medium');

  const handleSaveSettings = () => {
    Alert.alert(
      "Settings Saved", 
      "Your preferences have been updated successfully!",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          {/* Gradient Header with Back Button */}
          <LinearGradient
            colors={['#8A2BE2', '#FF69B4']}
            style={{
              paddingTop: 60,
              paddingBottom: 30,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              shadowColor: '#8A2BE2',
              shadowOpacity: 0.6,
              shadowRadius: 20,
              elevation: 6,
              borderBottomWidth: 1.5,
              borderColor: 'rgba(226, 223, 223, 0.75)',
            }}
          >
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingHorizontal: spacing.lg,
              position: 'relative'
            }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  position: 'absolute',
                  left: spacing.lg,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Settings</Text>
            </View>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Notifications */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="bell" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Notifications
                </Text>
              </View>
              
              <SettingsToggle
                icon="bell"
                title="Push Notifications"
                subtitle="Get notified about new podcasts and updates"
                value={notifications}
                onValueChange={setNotifications}
              />
            </AppCard>

            {/* Downloads */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="download" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Downloads
                </Text>
              </View>
              
              <SettingsToggle
                icon="download"
                title="Auto Download"
                subtitle="Automatically download generated podcasts"
                value={autoDownload}
                onValueChange={setAutoDownload}
                color="#8A2BE2"
              />
            </AppCard>

            {/* Audio Quality */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="music" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Audio Quality
                </Text>
              </View>
              
              <AudioQualitySelector 
                selectedQuality={audioQuality}
                onQualityChange={setAudioQuality}
              />
            </AppCard>

            {/* Save Button */}
            <AppCard>
              <TouchableOpacity
                onPress={handleSaveSettings}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  shadowColor: '#8A2BE2',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8A2BE2', '#FF69B4']}
                  style={{ 
                    padding: 16, 
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                >
                  <Feather name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save Settings</Text>
                </LinearGradient>
              </TouchableOpacity>
            </AppCard>

            {/* Info Card */}
            <AppCard>
              <LinearGradient
                colors={['rgba(138,43,226,0.2)', 'rgba(255,105,180,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: spacing.md,
                  borderRadius: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,105,180,0.3)',
                }}
              >
                <Feather name="info" size={24} color="#FF69B4" style={{ marginBottom: spacing.sm }} />
                <Text style={{ 
                  fontSize: 14, 
                  color: '#BBB', 
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  Settings are automatically synced across your devices
                </Text>
              </LinearGradient>
            </AppCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default SettingsScreen;