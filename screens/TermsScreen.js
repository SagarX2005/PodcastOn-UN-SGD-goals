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

const TermsSection = ({ icon, title, children }) => (
  <View style={{ marginBottom: spacing.lg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(255,105,180,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(255,105,180,0.3)',
        }}
      >
        <Feather name={icon} size={16} color="#FF69B4" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5' }}>
        {title}
      </Text>
    </View>
    {children}
  </View>
);

const TermsPoint = ({ number, text }) => (
  <View style={{ flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-start' }}>
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(138,43,226,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        marginTop: 2,
        borderWidth: 1,
        borderColor: 'rgba(138,43,226,0.5)',
      }}
    >
      <Text style={{ fontSize: 12, color: '#8A2BE2', fontWeight: '700' }}>{number}</Text>
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

const TermsScreen = () => {
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
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Terms of Service</Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 3,
            }}
            showsVerticalScrollIndicator={false}
          >
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="file-text" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Welcome to Resona
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 24, marginBottom: spacing.md }}>
                Resona is an AI-powered interfaith SDG podcast generator designed to promote peace, empathy, and interfaith learning.
                By using our platform, you agree to respect all communities and cultures.
              </Text>
              <Text style={{ fontSize: 15, color: '#BBB', lineHeight: 22 }}>
                This document explains how users may interact with Resona and the responsibilities associated with AI-generated content.
              </Text>
            </AppCard>

            {/* Acceptable Use */}
            <AppCard>
              <TermsSection icon="shield" title="Acceptable Use">
                <TermsPoint number="1" text="You must not use Resona to produce content that promotes hate speech, violence, discrimination, or disrespect towards any religion or culture." />
                <TermsPoint number="2" text="The app must be used in the spirit of interfaith harmony and education." />
                <TermsPoint number="3" text="You may not reverse-engineer, modify, or attempt to interfere with system functionality or security." />
              </TermsSection>
            </AppCard>

            {/* Content & Ownership */}
            <AppCard>
              <TermsSection icon="edit" title="AI Content Responsibility">
                <TermsPoint number="1" text="AI-generated content may occasionally contain inaccuracies. Users should review content before sharing externally." />
                <TermsPoint number="2" text="Users are responsible for any content they share outside the app." />
                <TermsPoint number="3" text="Generated audio and text belong to the creator, while Resona may use anonymized usage patterns to improve the system." />
              </TermsSection>
            </AppCard>

            {/* Free Access Policy */}
            <AppCard>
              <TermsSection icon="gift" title="Free Access Policy">
                <TermsPoint number="1" text="Resona is currently free to use for all users with no premium or paid subscription plans available." />
                <TermsPoint number="2" text="All users receive equal feature access including podcast generation, saving to My Library, and basic sharing options." />
                <TermsPoint number="3" text="If premium options are introduced in the future, users will be notified and asked for consent before any billing." />
              </TermsSection>
            </AppCard>

            {/* Privacy */}
            <AppCard>
              <TermsSection icon="lock" title="Privacy & Data">
                <TermsPoint number="1" text="We respect your privacy and do not sell personal data to third parties." />
                <TermsPoint number="2" text="You may request account or data deletion at any time through support." />
              </TermsSection>
            </AppCard>

            {/* Updates */}
            <AppCard>
              <TermsSection icon="refresh-ccw" title="Terms Updates">
                <TermsPoint number="1" text="These terms may be updated to improve safety, legal compliance, or feature expansion." />
                <TermsPoint number="2" text="Continuing to use the app after updates indicates agreement to the revised terms." />
              </TermsSection>
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
                  <Feather name="help-circle" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5' }}>Need Help?</Text>
                </View>
                <Text style={{ fontSize: 15, color: '#E0E0E0', marginBottom: spacing.md, lineHeight: 22 }}>
                  For questions or clarifications, feel free to reach out to us.
                </Text>

                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#8A2BE2', '#FF69B4']}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Contact Support</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </AppCard>

            <AppCard>
              <View style={{ alignItems: 'center' }}>
                <Feather name="calendar" size={18} color="#FF69B4" style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 14, color: '#BBB' }}>
                  Effective Date: January 2025 | Last Updated: January 2025
                </Text>
              </View>
            </AppCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default TermsScreen;
