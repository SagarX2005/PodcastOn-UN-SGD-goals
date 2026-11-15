import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../styles/globalStyles';
import { useUser } from '../UserContext';
import { supabase } from '../supabase';

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

const ContactMethod = ({ icon, title, subtitle, onPress, color = "#FF69B4", subtitleStyle }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    }}
    activeOpacity={0.7}
  >
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
      <Text style={[{ fontSize: 14, color: '#BBB' }, subtitleStyle]}>
        {subtitle}
      </Text>
    </View>
    <Feather name="chevron-right" size={20} color="#BBB" />
  </TouchableOpacity>
);

// Custom Alert Modal Component
const CustomAlert = ({ visible, onClose, title, message, isSuccess, icon }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}>
      <LinearGradient
        colors={['#1A1A20', '#0A0A0F']}
        style={{
          width: '100%',
          maxWidth: 340,
          borderRadius: 24,
          padding: 24,
          borderWidth: 2,
          borderColor: isSuccess ? 'rgba(138,43,226,0.5)' : 'rgba(255,105,180,0.5)',
          shadowColor: isSuccess ? '#8A2BE2' : '#FF69B4',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.6,
          shadowRadius: 24,
          elevation: 15,
        }}
      >
        {/* Icon */}
        <View style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: isSuccess ? 'rgba(138,43,226,0.2)' : 'rgba(255,105,180,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 20,
          borderWidth: 3,
          borderColor: isSuccess ? '#8A2BE2' : '#FF69B4',
        }}>
          <Feather
            name={icon || (isSuccess ? "check-circle" : "alert-circle")}
            size={38}
            color={isSuccess ? '#8A2BE2' : '#FF69B4'}
          />
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 22,
          fontWeight: '800',
          color: '#F5F5F5',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          {title}
        </Text>

        {/* Message */}
        <Text style={{
          fontSize: 15,
          color: '#CCC',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 24,
        }}>
          {message}
        </Text>

        {/* Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{ borderRadius: 14, overflow: 'hidden' }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSuccess ? ['#8A2BE2', '#FF69B4'] : ['#FF69B4', '#8A2BE2']}
            style={{
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {isSuccess ? 'Got it!' : 'OK'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </Modal>
);

const ContactSupportScreen = () => {
  const { user } = useUser();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    isSuccess: true,
    icon: null,
  });

  const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/rd2acc3ed6pcrdutjdhvaxo5iefrl4om';

  const showCustomAlert = (title, message, isSuccess = true, icon = null) => {
    setAlertConfig({ title, message, isSuccess, icon });
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertConfig.isSuccess) {
      setSubject('');
      setMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showCustomAlert(
        "Missing Information",
        "Please fill in both subject and message fields to send your support request.",
        false,
        "alert-circle-outline"
      );
      return;
    }

    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const payload = {
        subject: subject.trim(),
        message: message.trim(),
        user_email: user?.email || currentUser?.email || 'No email',
        user_name: user?.name || currentUser?.user_metadata?.full_name || 'Anonymous',
        user_id: currentUser?.id || 'N/A',
        sent_at: new Date().toISOString(),
      };

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showCustomAlert(
          "Message Sent!",
          "Your support request has been received. Our team will review your message and respond to your email within 24 hours.",
          true,
          "checkmark-circle"
        );
      } else {
        const errText = await response.text();
        console.error("Webhook error:", errText);
        showCustomAlert(
          "Unable to Send",
          "We couldn't send your message at this time. Please try again in a few moments or contact us directly at assistance.resona@outlook.com",
          false,
          "close-circle"
        );
      }

    } catch (error) {
      console.error("Error sending message:", error);
      showCustomAlert(
        "Connection Error",
        "An unexpected error occurred while sending your message. Please check your internet connection and try again.",
        false,
        "wifi-off"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+919156008469').catch(() => {
      showCustomAlert(
        "Call Failed",
        "Unable to initiate phone call. Please ensure your device supports phone calls or dial +91 91560 08469 manually.",
        false,
        "call-outline"
      );
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:assistance.resona@outlook.com').catch(() => {
      showCustomAlert(
        "Email App Not Found",
        "Unable to open email client. Please ensure you have an email app installed or contact us at assistance.resona@outlook.com",
        false,
        "mail-outline"
      );
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          {/* Custom Alert Modal */}
          <CustomAlert
            visible={alertVisible}
            onClose={handleAlertClose}
            title={alertConfig.title}
            message={alertConfig.message}
            isSuccess={alertConfig.isSuccess}
            icon={alertConfig.icon}
          />

          {/* Gradient Header */}
          <LinearGradient
            colors={['#8A2BE2', '#FF69B4']}
            style={{
              paddingTop: 60,
              paddingBottom: 30,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              alignItems: 'center',
              shadowColor: '#8A2BE2',
              shadowOpacity: 0.6,
              shadowRadius: 20,
              elevation: 6,
              borderBottomWidth: 1.5,
              borderColor: 'rgba(226, 223, 223, 0.75)',
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Contact Support</Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Introduction */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <Feather name="headphones" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  We're Here to Help
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 24 }}>
                Have an issue, question, or feedback about Resona? Our support team is ready to assist you.
              </Text>
            </AppCard>

            {/* Quick Contact Methods */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="zap" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Quick Contact
                </Text>
              </View>

              <ContactMethod
                icon="phone"
                title="Call Us"
                subtitle="+91 91560 08469"
                onPress={handleCall}
                color="#FF69B4"
              />

              <ContactMethod
                icon="mail"
                title="Email Support"
                subtitle="assistance.resona@outlook.com"
                onPress={handleEmail}
                color="#8A2BE2"
                subtitleStyle={{ fontSize: 12 }}
              />
            </AppCard>

            {/* Contact Form */}
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Feather name="message-circle" size={24} color="#FF69B4" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>
                  Send us a Message
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(138,43,226,0.1)',
                padding: spacing.md,
                borderRadius: 12,
                marginBottom: spacing.lg,
                borderWidth: 1,
                borderColor: 'rgba(138,43,226,0.3)',
              }}>
                <Text style={{ fontSize: 12, color: '#AAA', marginBottom: 4 }}>Sending from:</Text>
                <Text style={{ fontSize: 14, color: '#F5F5F5', fontWeight: '600' }}>
                  {user?.email || 'Not logged in'}
                </Text>
              </View>

              {/* Subject Input */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: 14, color: '#BBB', marginBottom: 8 }}>Subject</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#8A2BE2',
                    borderRadius: 12,
                    backgroundColor: '#0A0A0F',
                  }}
                >
                  <Feather name="bookmark" size={18} color="#FF69B4" style={{ marginLeft: 12, marginRight: 8 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: '#F5F5F5', paddingVertical: 12, paddingRight: 12 }}
                    placeholder="What's this about?"
                    placeholderTextColor="#555"
                    value={subject}
                    onChangeText={setSubject}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Message Input */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ fontSize: 14, color: '#BBB', marginBottom: 8 }}>Your Message</Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#8A2BE2',
                    borderRadius: 12,
                    backgroundColor: '#0A0A0F',
                    minHeight: 120,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 12 }}>
                    <Feather name="message-square" size={18} color="#FF69B4" style={{ marginRight: 8, marginTop: 2 }} />
                    <TextInput
                      style={{ 
                        flex: 1, 
                        fontSize: 16, 
                        color: '#F5F5F5', 
                        textAlignVertical: 'top',
                        minHeight: 96
                      }}
                      placeholder="Describe your issue, question, or feedback..."
                      placeholderTextColor="#555"
                      multiline
                      value={message}
                      onChangeText={setMessage}
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  shadowColor: '#8A2BE2',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  opacity: loading ? 0.7 : 1,
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
                  {loading ? (
                    <>
                      <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sending...</Text>
                    </>
                  ) : (
                    <>
                      <Feather name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Send Message</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={{ 
                fontSize: 12, 
                color: '#888', 
                textAlign: 'center', 
                marginTop: spacing.md,
                lineHeight: 18
              }}>
                Your message will be sent directly to our support team and you will receive our reply in your inbox.
              </Text>
            </AppCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ContactSupportScreen;