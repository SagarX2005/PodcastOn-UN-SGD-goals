import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import globalStyles, { spacing } from '../styles/globalStyles';
import { supabase } from '../supabase';
import ThemedAlert from '../components/ThemedAlert';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // 👀 states for eye toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertContent({ title, message });
    setAlertVisible(true);
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }, // saved to metadata
      },
    });
    setLoading(false);

    if (error) {
      showAlert('Signup Failed', error.message);
    } else {
      showAlert('Success', 'Account created! Please check your email to verify.');
    }
  };

  return (
    <>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          {/* Header */}
          <LinearGradient
            colors={['#8A2BE2', '#FF69B4']}
            style={{
              paddingTop: 70,
              paddingBottom: spacing.xl,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              alignItems: 'center',
              shadowColor: '#8A2BE2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 6,
              borderBottomWidth: 2,
              borderColor: 'rgba(226, 223, 223, 0.75)',
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255,255,255,0.15)',
                marginBottom: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="mic" size={28} color="#fff" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#F5F5F5' }}>
              Interfaith SDG
            </Text>
            <Text style={{ fontSize: 23, fontWeight: 'bold', color: '#F5F5F5' }}>
              Podcast Generator
            </Text>
          </LinearGradient>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
                <LinearGradient
                  colors={['#1A1A20', '#0A0A0F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 22,
                    padding: spacing.lg,
                    borderWidth: 1.5,
                    borderColor: 'rgba(138,43,226,0.4)',
                    shadowColor: '#8A2BE2',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  <Text
                    style={{
                      color: '#F5F5F5',
                      fontSize: 26,
                      fontWeight: '700',
                      textAlign: 'center',
                      marginBottom: spacing.sm,
                    }}
                  >
                    Create Account
                  </Text>
                  <Text
                    style={{
                      color: 'rgba(245,245,245,0.7)',
                      textAlign: 'center',
                      marginBottom: spacing.xl,
                      fontSize: 15,
                    }}
                  >
                    Join us to get started!
                  </Text>

                  {/* Full Name */}
                  <View
                    style={[
                      globalStyles.inputContainer,
                      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
                    ]}
                  >
                    <Feather
                      name="user"
                      size={20}
                      color="rgba(245,245,245,0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        globalStyles.textInput,
                        {
                          flex: 1,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#F5F5F5',
                        },
                        nameFocused && { borderColor: '#8A2BE2', borderWidth: 1.5 },
                      ]}
                      placeholder="Enter your full name"
                      placeholderTextColor="rgba(245,245,245,0.4)"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Email */}
                  <View
                    style={[
                      globalStyles.inputContainer,
                      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={20}
                      color="rgba(245,245,245,0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        globalStyles.textInput,
                        {
                          flex: 1,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#F5F5F5',
                        },
                        emailFocused && { borderColor: '#FF69B4', borderWidth: 1.5 },
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(245,245,245,0.4)"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password */}
                  <View
                    style={[
                      globalStyles.inputContainer,
                      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={20}
                      color="rgba(245,245,245,0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        globalStyles.textInput,
                        {
                          flex: 1,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#F5F5F5',
                          paddingRight: 35,
                        },
                        passwordFocused && { borderColor: '#8A2BE2', borderWidth: 1.5 },
                      ]}
                      placeholder="Create a password"
                      placeholderTextColor="rgba(245,245,245,0.4)"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={{ position: 'absolute', right: 10 }}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color="rgba(245,245,245,0.7)"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password */}
                  <View
                    style={[
                      globalStyles.inputContainer,
                      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
                    ]}
                  >
                    <Feather
                      name="unlock"
                      size={20}
                      color="rgba(245,245,245,0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        globalStyles.textInput,
                        {
                          flex: 1,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#F5F5F5',
                          paddingRight: 35,
                        },
                        confirmPasswordFocused && { borderColor: '#FF69B4', borderWidth: 1.5 },
                      ]}
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(245,245,245,0.4)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      style={{ position: 'absolute', right: 10 }}
                    >
                      <Feather
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color="rgba(245,245,245,0.7)"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Create Account Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSignup}
                    style={{ marginTop: spacing.lg }}
                  >
                    <LinearGradient
                      colors={['#8A2BE2', '#FF69B4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        shadowColor: '#FF69B4',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.6,
                        shadowRadius: 12,
                        elevation: 5,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                        {loading ? 'Creating...' : 'Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Sign In link */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={{ marginTop: spacing.md }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 15,
                        color: '#FFF',
                        fontWeight: '600',
                      }}
                    >
                      Already have an account?{' '}
                      <Text
                        style={{
                          textDecorationLine: 'underline',
                          color: '#8A2BE2',
                        }}
                      >
                        Sign In
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>

      {/* Custom Alert */}
      <ThemedAlert
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onClose={() => {
          setAlertVisible(false);
          if (alertContent.title === 'Success') {
            navigation.replace('Login');
          }
        }}
      />
    </>
  );
};

export default SignupScreen;
