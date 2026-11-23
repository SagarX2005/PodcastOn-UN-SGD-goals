// ApiKeyManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { spacing } from '../styles/globalStyles';
import { getApiKey, saveApiKey, removeApiKey } from '../utils/apiKeyStore';

const ApiKeyManagementScreen = ({ navigation }) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedKey();
  }, []);

  const loadSavedKey = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setIsLoading(false);
        return;
      }

      const key = await getApiKey(user.id);
      if (key) {
        setSavedKey(key);
      }
    } catch (error) {
      console.error('Error loading API key:', error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    if (key.length <= 20) return '•'.repeat(key.length);
    return key.substring(0, 10) + '•'.repeat(key.length - 20) + key.substring(key.length - 10);
  };

  const validateApiKey = async () => {
    if (!apiKey || apiKey.trim().length === 0) {
      Alert.alert('Error', 'Please enter an API key');
      return false;
    }

    if (!apiKey.startsWith('sk-or-v1-')) {
      Alert.alert('Invalid Format', 'OpenRouter API keys start with "sk-or-v1-"');
      return false;
    }

    setIsValidating(true);

    try {
      // Test the API key with the auth/key endpoint
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });

      if (response.ok) {
        return true;
      } else {
        Alert.alert('Invalid Key', 'API key is invalid or has insufficient permissions');
        return false;
      }
    } catch (error) {
      Alert.alert('Validation Error', 'Failed to validate API key. Please check your connection.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveKey = async () => {
    const isValid = await validateApiKey();
    if (!isValid) return;

    setIsSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Could not get user information');
        setIsSaving(false);
        return;
      }

      // Save key to device secure keystore
      await saveApiKey(user.id, apiKey.trim());

      setSavedKey(apiKey.trim());
      setIsEditing(false);
      setApiKey('');
      Alert.alert('Success', 'API key saved successfully! You can now generate unlimited podcasts.');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = () => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to remove your API key? You will need to add it again to generate podcasts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              await removeApiKey(user.id);

              setSavedKey('');
              setIsEditing(false);
              Alert.alert('Deleted', 'API key has been removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete API key');
            }
          },
        },
      ]
    );
  };

  const InfoCard = ({ children, color = '#4A90E2' }) => (
    <LinearGradient
      colors={[`${color}20`, `${color}10`]}
      style={{
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: `${color}40`,
      }}
    >
      {children}
    </LinearGradient>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
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
              paddingTop: 60,
              paddingBottom: 30,
              paddingHorizontal: spacing.lg,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Feather name="key" size={32} color="#fff" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>
                API Key Manager
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
              Manage your OpenRouter API key
            </Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Why Info Card */}
            <InfoCard color="#4A90E2">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Feather name="info" size={24} color="#4A90E2" style={{ marginRight: 12, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
                    Why use your own API key?
                  </Text>
                  <Text style={{ fontSize: 13, color: '#D0D0D0', lineHeight: 20 }}>
                    • Generate unlimited podcasts{'\n'}
                    • No sharing limits with others{'\n'}
                    • Control your own costs{'\n'}
                    • Faster processing times
                  </Text>
                </View>
              </View>
            </InfoCard>

            {/* How to Get Key Card */}
            <InfoCard color="#9C27B0">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Feather name="star" size={24} color="#9C27B0" style={{ marginRight: 12, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
                    How to get your API key
                  </Text>
                  <Text style={{ fontSize: 13, color: '#D0D0D0', lineHeight: 20, marginBottom: 12 }}>
                    1. Visit OpenRouter.ai{'\n'}
                    2. Sign up / Log in{'\n'}
                    3. Go to "Keys" section{'\n'}
                    4. Click "Create Key"{'\n'}
                    5. Copy and paste below
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://openrouter.ai')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(156,39,176,0.3)',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ color: '#E1BEE7', fontSize: 13, fontWeight: '600', marginRight: 6 }}>
                      Open OpenRouter
                    </Text>
                    <Feather name="external-link" size={16} color="#E1BEE7" />
                  </TouchableOpacity>
                </View>
              </View>
            </InfoCard>

            {/* Current Key Status */}
            {savedKey && !isEditing && (
              <LinearGradient
                colors={['#1A1A20', '#0A0A0F']}
                style={{
                  borderRadius: 20,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1.5,
                  borderColor: 'rgba(76,175,80,0.5)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="check-circle" size={24} color="#4CAF50" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                      API Key Active
                    </Text>
                  </View>
                </View>

                <View style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#D0D0D0', fontSize: 13, fontFamily: 'monospace', flex: 1 }}>
                      {showKey ? savedKey : maskApiKey(savedKey)}
                    </Text>
                    <TouchableOpacity onPress={() => setShowKey(!showKey)} style={{ marginLeft: 12 }}>
                      <Feather name={showKey ? "eye-off" : "eye"} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['#8A2BE2', '#FF69B4']}
                      style={{ paddingVertical: 14, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                        Update Key
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteKey}
                    style={{
                      flex: 1,
                      borderWidth: 1.5,
                      borderColor: '#F44336',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: 'rgba(244,67,54,0.1)',
                    }}
                  >
                    <Text style={{ color: '#F44336', fontWeight: '700', fontSize: 15 }}>
                      Delete Key
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            {/* Add/Edit Key Form */}
            {(!savedKey || isEditing) && (
              <LinearGradient
                colors={['#1A1A20', '#0A0A0F']}
                style={{
                  borderRadius: 20,
                  padding: spacing.lg,
                  borderWidth: 1.5,
                  borderColor: 'rgba(138,43,226,0.5)',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 }}>
                  {savedKey ? 'Update Your API Key' : 'Add Your API Key'}
                </Text>

                <Text style={{ fontSize: 13, color: '#AAA', marginBottom: 12 }}>
                  OpenRouter API Key
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1.5,
                  borderColor: apiKey ? '#8A2BE2' : 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  marginBottom: 20,
                }}>
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      fontSize: 14,
                      color: '#fff',
                      fontFamily: 'monospace',
                    }}
                    placeholder="sk-or-v1-..."
                    placeholderTextColor="#666"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry={!showKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowKey(!showKey)} style={{ padding: 8 }}>
                    <Ionicons name={showKey ? "eye-off" : "eye"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={handleSaveKey}
                    disabled={isValidating || isSaving || !apiKey}
                    style={{ flex: 1, borderRadius: 12, overflow: 'hidden', opacity: (!apiKey || isValidating || isSaving) ? 0.5 : 1 }}
                  >
                    <LinearGradient
                      colors={['#8A2BE2', '#FF69B4']}
                      style={{ paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                    >
                      {(isValidating || isSaving) ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                            Save Key
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {isEditing && (
                    <TouchableOpacity
                      onPress={() => {
                        setIsEditing(false);
                        setApiKey('');
                      }}
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: '#FF69B4',
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,105,180,0.1)',
                      }}
                    >
                      <Text style={{ color: '#FF69B4', fontWeight: '700', fontSize: 15 }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            )}

            {/* Free Credits Info */}
            <InfoCard color="#4CAF50">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Feather name="gift" size={24} color="#4CAF50" style={{ marginRight: 12, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 }}>
                    💡 Pro Tip
                  </Text>
                  <Text style={{ fontSize: 13, color: '#D0D0D0', lineHeight: 20 }}>
                    OpenRouter offers $1 free credit for new users! Perfect for testing. You can add more credits anytime.
                  </Text>
                </View>
              </View>
            </InfoCard>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ApiKeyManagementScreen;