import React, { useState } from 'react';
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

const FAQItem = ({ question, answer, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setIsExpanded(!isExpanded)}
      style={{
        paddingVertical: spacing.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
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
            <Feather name="help-circle" size={16} color="#FF69B4" />
          </View>
          <Text style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '600',
            color: '#F5F5F5',
            lineHeight: 22,
          }}>
            {question}
          </Text>
        </View>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#BBB"
        />
      </View>

      {isExpanded && (
        <View style={{
          marginTop: spacing.md,
          marginLeft: 48,
          paddingRight: spacing.sm
        }}>
          <Text style={{
            fontSize: 14,
            color: '#BBB',
            lineHeight: 20,
          }}>
            {answer}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const FAQScreen = () => {
  const faqData = [
    {
      question: "How do I generate a podcast?",
      answer:
        "Go to the Generate tab, choose an SDG topic and a faith perspective (such as Islam, Christianity, Buddhism, etc.), and the AI will create a podcast script and audio automatically. You can save the generated podcast to your library."
    },
    {
      question: "Can I save and listen later?",
      answer:
        "Yes! Any generated podcast can be saved to your Library. You can listen again anytime without needing to regenerate."
    },
    {
      question: "Is the app free? Do I need premium?",
      answer:
        "The app is completely free. There is currently no premium plan. All users receive the same features such as podcast generation, library storage, and basic sharing options."
    },
    {
      question: "Can I share the podcasts?",
      answer:
        "Yes, you will be able to share them from My Library once the sharing feature is fully deployed. For now, you can access the saved MP3 file locally and share manually."
    },
    {
      question: "How do I find and enter my API key?",
      answer:
        "1. Visit openrouter.ai and create an account\n2. Go to your dashboard and generate an API key\n3. In the app, go to your Profile screen\n4. Tap on 'API Key Management'\n5. Enter your OpenRouter API key and save it\n\nThe API key is required to generate podcasts and is stored securely on your device."
    },
    {
      question: "How does the AI create interfaith perspectives?",
      answer:
        "The AI explains each SDG through religious viewpoints using a culturally respectful tone. Every script is checked by an AI reviewer for stereotypes and disrespectful framing, and is rewritten once if a problem is found. You can also report any shared podcast using the flag icon, and we will review it."
    },
  ];

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
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>FAQ</Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
          >
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="message-circle" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  FAQs
                </Text>
              </View>

              {faqData.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isLast={index === faqData.length - 1}
                />
              ))}
            </AppCard>

            <AppCard>
              <LinearGradient
                colors={['rgba(138,43,226,0.2)', 'rgba(255,105,180,0.2)']}
                style={{
                  padding: spacing.lg,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Feather name="headphones" size={32} color="#FF69B4" style={{ marginBottom: spacing.md }} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#F5F5F5',
                  textAlign: 'center',
                }}>
                  Need additional help?
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#BBB',
                  textAlign: 'center',
                  marginBottom: spacing.md
                }}>
                  Reach out to us for support or feedback to improve Resona.
                </Text>

                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#8A2BE2', '#FF69B4']}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Feather name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Contact Support</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </AppCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default FAQScreen;
