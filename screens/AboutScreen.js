import React from 'react';
import {
  View,
  Text,
  ScrollView,
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

const FeatureItem = ({ icon, title, description }) => (
  <View style={{ flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-start' }}>
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,105,180,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,105,180,0.3)',
      }}
    >
      <Feather name={icon} size={20} color="#FF69B4" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#F5F5F5', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: '#BBB', lineHeight: 20 }}>
        {description}
      </Text>
    </View>
  </View>
);

const AboutScreen = () => {
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
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>About Resona</Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* WHAT IS RESONA */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="globe" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  What is Resona?
                </Text>
              </View>

              <Text style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 24, marginBottom: spacing.md }}>
                <Text style={{ fontWeight: '600', color: '#FF69B4' }}>Resona</Text> is an AI-powered{' '}
                <Text style={{ fontWeight: '600', color: '#8A2BE2' }}>interfaith educational podcast generator</Text>{' '}
                designed to connect the{' '}
                <Text style={{ fontWeight: '600', color: '#FF69B4' }}>17 United Nations Sustainable Development Goals (SDGs)</Text>{' '}
                with meaningful perspectives from different religions and spiritual traditions.
              </Text>

              <Text style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 24 }}>
                By transforming SDGs into audio storytelling through faith-centered reflections,
                Resona encourages empathy, unity, and collaborative understanding among diverse communities.
              </Text>
            </AppCard>

            {/* WHY */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="heart" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Why Resona?
                </Text>
              </View>

              <FeatureItem
                icon="users"
                title="Interfaith Harmony"
                description="Encouraging shared wisdom across cultures and belief systems to build bridges and reduce division."
              />
              <FeatureItem
                icon="lightbulb"
                title="AI-Generated Podcasts"
                description="Instant script + voice generation powered by OpenAI and gTTS, making learning engaging and accessible."
              />
              <FeatureItem
                icon="flag"
                title="SDG Awareness"
                description="Transforming global sustainability topics into relatable human-centered narratives."
              />
              <FeatureItem
                icon="music"
                title="Free for Everyone"
                description="All features are available to every user without subscriptions or locked content."
              />
            </AppCard>

            {/* SDGs */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="book-open" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Understanding the SDGs
                </Text>
              </View>

              <Text style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 24 }}>
                The SDGs are a universal call to protect the planet, eliminate inequality, and build peaceful communities.
                <Text style={{ color: '#8A2BE2', fontWeight: '600' }}> Resona presents them through faith-based teachings and ethical reflections</Text>{' '}
                shared across religions such as Islam, Christianity, Hinduism, Buddhism, and more.
              </Text>
            </AppCard>

            {/* MISSION */}
            <AppCard>
              <LinearGradient
                colors={['rgba(138,43,226,0.2)', 'rgba(255,105,180,0.2)']}
                style={{
                  padding: spacing.lg,
                  borderRadius: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,105,180,0.3)',
                }}
              >
                <Feather name="star" size={32} color="#FF69B4" style={{ marginBottom: spacing.md }} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#F5F5F5',
                  marginBottom: spacing.sm,
                }}>
                  Our Mission
                </Text>

                <Text style={{
                  fontSize: 16,
                  color: '#E0E0E0',
                  textAlign: 'center',
                  lineHeight: 24,
                  fontStyle: 'italic',
                }}>
                  To educate, unite, and inspire communities by connecting global sustainability with faith-based values of peace, compassion, and shared responsibility.
                </Text>
              </LinearGradient>
            </AppCard>

            {/* APP INFO */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="info" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  App Information
                </Text>
              </View>

              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: 14, color: '#BBB', marginBottom: 4 }}>Version</Text>
                <Text style={{ fontSize: 16, color: '#F5F5F5', fontWeight: '600' }}>1.0.0</Text>
              </View>

              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: 14, color: '#BBB', marginBottom: 4 }}>Built With</Text>
                <Text style={{ fontSize: 16, color: '#F5F5F5', fontWeight: '600', lineHeight: 22 }}>
                  React Native • Expo • Supabase • gTTS • OpenAI APIs
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 14, color: '#BBB', marginBottom: 4 }}>Pricing</Text>
                <Text style={{ fontSize: 16, color: '#F5F5F5', fontWeight: '600' }}>
                  Free for all users
                </Text>
              </View>
            </AppCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default AboutScreen;
