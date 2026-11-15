import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../styles/globalStyles';

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

const PolicyPoint = ({ icon, text }) => (
  <View style={{ flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-start' }}>
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,105,180,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        marginTop: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,105,180,0.3)',
      }}
    >
      <Feather name={icon} size={16} color="#FF69B4" />
    </View>
    <Text style={{
      flex: 1,
      fontSize: 15,
      color: '#E0E0E0',
      lineHeight: 22,
    }}>
      {text}
    </Text>
  </View>
);

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          <LinearGradient
            colors={['#8A2BE2', '#FF69B4']}
            style={{
              paddingTop: 60,
              paddingBottom: 30,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Privacy Policy</Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 3,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="shield" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Your Privacy Matters
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 24 }}>
                Resona is committed to protecting your personal information while providing a safe,
                respectful, and educational interfaith experience. This Privacy Policy describes
                what data we collect, how we use it, and the control you have over your information.
              </Text>
            </AppCard>

            {/* Data Collection */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="folder" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  What We Collect & Why
                </Text>
              </View>

              <PolicyPoint
                icon="user"
                text="Basic profile information (name, email, and display picture) to create and manage your account."
              />
              <PolicyPoint
                icon="star"
                text="Preferences such as selected SDGs and religious perspectives to generate personalized podcast content."
              />
              <PolicyPoint
                icon="music"
                text="Generated podcast files are stored securely in your personal library and not shared without your consent."
              />
              <PolicyPoint
                icon="bar-chart-2"
                text="Anonymous usage patterns (not content) may be used to improve app performance and AI quality."
              />
            </AppCard>

            {/* Security */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="lock" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>Data Security</Text>
              </View>

              <PolicyPoint icon="key" text="All data is stored using secure encrypted protocols via Supabase infrastructure." />
              <PolicyPoint icon="server" text="Access to databases is strictly protected with role-based security and authentication layers." />
              <PolicyPoint icon="eye-off" text="We do not use third-party advertising trackers or analytics platforms." />
            </AppCard>

            {/* Your Control */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="settings" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>Your Choice & Control</Text>
              </View>

              <PolicyPoint icon="trash-2" text="You may request account deletion at any time, which permanently removes your stored data." />
              <PolicyPoint icon="download" text="You may request a copy of your stored data before deletion." />
              <PolicyPoint icon="check-circle" text="Continuing to use Resona implies agreement with this Privacy Policy." />
            </AppCard>

            {/* Contact */}
            <AppCard>
              <LinearGradient
                colors={['rgba(138,43,226,0.2)', 'rgba(255,105,180,0.2)']}
                style={{
                  padding: spacing.lg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,105,180,0.3)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                  <Feather name="mail" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5' }}>
                    Questions About Privacy?
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: '#E0E0E0',
                  lineHeight: 22,
                  marginBottom: spacing.md,
                }}>
                  For concerns, requests, or clarifications regarding your data or privacy,
                  feel free to contact us anytime.
                </Text>
                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#8A2BE2', '#FF69B4']}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="message-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Contact Support</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </AppCard>

            {/* Footer */}
            <AppCard>
              <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Feather name="calendar" size={16} color="#BBB" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, color: '#BBB' }}>
                  Last Updated: January 2025
                </Text>
              </View>
            </AppCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;
