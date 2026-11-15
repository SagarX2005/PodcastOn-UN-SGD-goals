import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../styles/globalStyles';
import { useUser } from '../UserContext';
import { supabase } from '../supabase';
import moment from 'moment';

const MenuItem = ({ icon, title, onPress, iconColor = "#FF69B4" }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    }}
    activeOpacity={0.7}
  >
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${iconColor}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    }}>
      <Feather name={icon} size={20} color={iconColor} />
    </View>
    <Text style={{ flex: 1, fontSize: 15, color: '#F5F5F5', fontWeight: '500' }}>{title}</Text>
    <Feather name="chevron-right" size={20} color="#666" />
  </TouchableOpacity>
);

const AppCard = ({ children, style }) => (
  <LinearGradient
    colors={['#1A1A20', '#0A0A0F']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
      {
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(138,43,226,0.3)',
      },
      style,
    ]}
  >
    {children}
  </LinearGradient>
);

const ProfileScreen = ({ navigation, route }) => {
  const { user, updateUser, logout } = useUser();
  const [editName, setEditName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const userIdRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [profileApiKey, setProfileApiKey] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);

  const calculateGamificationStats = (podcasts) => {
    const total = podcasts.length;
    
    const sortedDates = podcasts
      .map(p => moment(p.created_at).format('YYYY-MM-DD'))
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => moment(b).diff(moment(a)));

    let currentStreak = 0;
    let checkDate = moment().startOf('day');
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (moment(sortedDates[i]).isSame(checkDate, 'day')) {
        currentStreak++;
        checkDate = checkDate.subtract(1, 'day');
      } else {
        break;
      }
    }

    const uniqueStyles = new Set();
    podcasts.forEach(p => {
      if (p.style) {
        uniqueStyles.add(p.style);
      }
    });

    let level = 1;
    if (total >= 201) level = 7;
    else if (total >= 101) level = 6;
    else if (total >= 51) level = 5;
    else if (total >= 31) level = 4;
    else if (total >= 16) level = 3;
    else if (total >= 6) level = 2;

    const points = (total * 10) + (currentStreak * 5) + (uniqueStyles.size * 15);

    return {
      total_podcasts: total,
      current_streak: currentStreak,
      total_points: points,
      level: level,
      unique_styles_count: uniqueStyles.size,
    };
  };

  const getLevelName = (level) => {
    const levels = {
      1: 'Beginner', 2: 'Novice', 3: 'Intermediate',
      4: 'Advanced', 5: 'Expert', 6: 'Master', 7: 'Legend'
    };
    return levels[level] || 'Beginner';
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#9E9E9E', 2: '#4CAF50', 3: '#2196F3',
      4: '#9C27B0', 5: '#FF9800', 6: '#F44336', 7: '#FFD700'
    };
    return colors[level] || '#9E9E9E';
  };

  const getNextLevelThreshold = (level) => {
    const thresholds = [0, 5, 15, 30, 50, 100, 200, 999];
    return thresholds[level] || 999;
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, preferred_language')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          if (profile.avatar_url) {
            setProfilePicUrl(profile.avatar_url);
          }
          if (profile.full_name) {
            setEditName(profile.full_name);
          }
          if (profile.preferred_language) {
            setPreferredLanguage(profile.preferred_language);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfileData();
  }, []);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setLoading(false);
          return;
        }
        
        userIdRef.current = user.id;

        const { data: podcasts, error: podcastError } = await supabase
          .from("podcasts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (podcastError) {
          console.error("Error fetching podcasts:", podcastError);
          setLoading(false);
          return;
        }

        const stats = calculateGamificationStats(podcasts || []);
        setGamificationData(stats);
      } catch (error) {
        console.error("Error fetching gamification data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, [refreshTrigger]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshTrigger(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.refresh) {
      setRefreshTrigger(prev => prev + 1);
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh]);

  const handlePickImage = async () => {
    try {
      setUploadingImage(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
        setUploadingImage(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) {
        setUploadingImage(false);
        return;
      }

      const uri = result.assets[0].uri;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Could not get user information');
        setUploadingImage(false);
        return;
      }

      // Create unique filename
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const contentType = `image/${fileExt}`;

      // Delete old image if exists
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (oldProfile?.avatar_url) {
        try {
          const oldFileName = oldProfile.avatar_url.split('/').pop().split('?')[0];
          await supabase.storage
            .from('profile-pictures')
            .remove([oldFileName]);
        } catch (deleteError) {
          console.log('Could not delete old image:', deleteError);
        }
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, decode(base64), {
          contentType: contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', uploadError.message || 'Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          full_name: editName || user.email,
          email: user.email,
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        console.error('Database update error:', updateError);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        setUploadingImage(false);
        return;
      }

      setProfilePicUrl(publicUrl);
      updateUser({ ...user, profilePic: publicUrl });

      Alert.alert('Success', 'Profile picture updated successfully!');

    } catch (error) {
      console.error('Error in handlePickImage:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a valid username');
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Could not get user information');
        console.error('User error:', userError);
        return;
      }

      console.log('Updating profile for user:', user.id);
      console.log('New username:', editName.trim());

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine
        console.error('Check error:', checkError);
        Alert.alert('Error', 'Failed to check profile: ' + checkError.message);
        return;
      }

      console.log('Existing profile:', existingProfile);

      // Update or insert the profile
      const profileData = {
        id: user.id,
        full_name: editName.trim(),
        avatar_url: profilePicUrl || existingProfile?.avatar_url || null,
        email: user.email,
      };

      console.log('Profile data to upsert:', profileData);

      const { data: updatedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        Alert.alert('Error', 'Failed to update username: ' + upsertError.message);
        return;
      }

      console.log('Profile updated successfully:', updatedProfile);

      // Update local state
      updateUser({ ...user, name: editName.trim() });
      setIsEditingName(false);
      Alert.alert('Success', 'Username updated successfully!');

    } catch (error) {
      console.error('Error in handleSaveUsername:', error);
      Alert.alert('Error', 'An unexpected error occurred: ' + error.message);
    }
  };

  const handleSavePreferredLanguage = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Could not get user information');
        console.error('User error:', userError);
        return;
      }

      console.log('Updating preferred language for user:', user.id);
      console.log('New preferred language:', preferredLanguage);

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine
        console.error('Check error:', checkError);
        Alert.alert('Error', 'Failed to check profile: ' + checkError.message);
        return;
      }

      console.log('Existing profile:', existingProfile);

      // Update or insert the profile with preferred language
      const profileData = {
        id: user.id,
        full_name: editName || existingProfile?.full_name || user.email,
        avatar_url: profilePicUrl || existingProfile?.avatar_url || null,
        email: user.email,
        preferred_language: preferredLanguage,
      };

      console.log('Profile data to upsert:', profileData);

      const { data: updatedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        Alert.alert('Error', 'Failed to update preferred language: ' + upsertError.message);
        return;
      }

      console.log('Preferred language updated successfully:', updatedProfile);

      // Update local state if needed (though preferred language is stored locally)
      setIsEditingLanguage(false);
      Alert.alert('Success', 'Preferred language updated successfully!');

    } catch (error) {
      console.error('Error in handleSavePreferredLanguage:', error);
      Alert.alert('Error', 'An unexpected error occurred: ' + error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your podcasts will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            logout();
          },
        },
      ]
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
            <View style={{ position: 'relative', marginBottom: spacing.md }}>
              {profilePicUrl ? (
                <Image
                  source={{ uri: profilePicUrl }}
                  style={{
                    width: 120,
                    height: 125,
                    borderRadius: 60,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 4,
                    borderColor: '#fff',
                  }}
                >
                  <Feather name="user" size={50} color="#fff" />
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={uploadingImage}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#FF69B4',
                  borderRadius: 20,
                  padding: 8,
                  borderWidth: 3,
                  borderColor: '#fff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="camera" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 }}>
              {editName || user?.name || 'User'}
            </Text>
            
            {loading ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginTop: 4 }} />
            ) : gamificationData ? (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <Feather name="award" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  Level {gamificationData.level} • {getLevelName(gamificationData.level)}
                </Text>
              </View>
            ) : null}

            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              {user?.email || ''}
            </Text>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
          >
            {!loading && gamificationData && (
              <AppCard>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5' }}>
                    Your Progress
                  </Text>
                  <View style={{
                    backgroundColor: getLevelColor(gamificationData.level) + '30',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: getLevelColor(gamificationData.level) }}>
                      {gamificationData.total_points} pts
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: '#AAA' }}>Next level</Text>
                    <Text style={{ fontSize: 12, color: '#F5F5F5', fontWeight: '600' }}>
                      {gamificationData.total_podcasts} / {getNextLevelThreshold(gamificationData.level)}
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={['#8A2BE2', '#FF69B4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: '100%',
                        width: `${Math.min(((gamificationData.total_podcasts) / getNextLevelThreshold(gamificationData.level)) * 100, 100)}%`,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(138,43,226,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                    }}>
                      <Feather name="mic" size={24} color="#8A2BE2" />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#F5F5F5' }}>
                      {gamificationData.total_podcasts}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#AAA' }}>Podcasts</Text>
                  </View>

                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(255,105,180,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                    }}>
                      <Feather name="zap" size={24} color="#FF69B4" />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#F5F5F5' }}>
                      {gamificationData.current_streak}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#AAA' }}>Day Streak</Text>
                  </View>

                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(76,175,80,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                    }}>
                      <Feather name="music" size={24} color="#4CAF50" />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#F5F5F5' }}>
                      {gamificationData.unique_styles_count}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#AAA' }}>Unique Styles</Text>
                  </View>
                </View>
              </AppCard>
            )}

            <AppCard>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.md, color: '#F5F5F5' }}>
                Account Settings
              </Text>

              {isEditingName ? (
                <View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#8A2BE2',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: 'rgba(138,43,226,0.05)',
                    marginBottom: spacing.md,
                  }}>
                    <Feather name="user" size={20} color="#8A2BE2" style={{ marginRight: 10 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 16, color: '#F5F5F5', paddingVertical: 12 }}
                      placeholder="Enter new username"
                      placeholderTextColor="#666"
                      value={editName}
                      onChangeText={setEditName}
                      autoFocus
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={handleSaveUsername}
                      style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
                    >
                      <LinearGradient colors={['#8A2BE2', '#FF69B4']} style={{ padding: 14, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsEditingName(false)}
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: '#FF69B4',
                        padding: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,105,180,0.05)',
                      }}
                    >
                      <Text style={{ color: '#FF69B4', fontWeight: '700', fontSize: 15 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <MenuItem icon="user" title="Change Username" onPress={() => setIsEditingName(true)} iconColor="#8A2BE2" />
<MenuItem
  icon="bell"
  title="Notifications"
  onPress={() => navigation.navigate('Notifications')}
  iconColor="#FF9800"
/>
                  <MenuItem icon="key" title="API Key Management" onPress={() => navigation.navigate('ApiKeyManagement')} iconColor="#00BCD4" />
                  <MenuItem
                    icon="globe"
                    title={`Preferred Language: ${preferredLanguage.toUpperCase()}`}
                    onPress={() => setIsEditingLanguage(true)}
                    iconColor="#2196F3"
                  />
                </>
              )}
            </AppCard>

            <AppCard>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.md, color: '#F5F5F5' }}>
                Support & Information
              </Text>
              <MenuItem icon="help-circle" title="Help & FAQ" onPress={() => navigation.navigate('FAQ')} iconColor="#4CAF50" />
              <MenuItem icon="message-circle" title="Contact Support" onPress={() => navigation.navigate('ContactSupport')} iconColor="#FF69B4" />
              <MenuItem icon="file-text" title="Terms of Service" onPress={() => navigation.navigate('Terms')} iconColor="#9C27B0" />
              <MenuItem icon="shield" title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} iconColor="#FF5722" />
              <MenuItem icon="info" title="About App" onPress={() => navigation.navigate('About')} iconColor="#00BCD4" />
            </AppCard>

            <AppCard style={{ borderColor: 'rgba(244,67,54,0.3)' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.md, color: '#F44336' }}>
                Critical Settings
              </Text>
              <MenuItem icon="log-out" title="Logout" onPress={handleLogout} iconColor="#FF9800" />
              <MenuItem icon="trash" title="Delete Account" onPress={handleDeleteAccount} iconColor="#F44336" />
            </AppCard>
          </ScrollView>

          <Modal
            visible={isEditingLanguage}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsEditingLanguage(false)}
          >
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}>
              <View style={{
                backgroundColor: '#1A1A20',
                borderRadius: 20,
                padding: 20,
                width: '90%',
                maxWidth: 400,
                borderWidth: 1,
                borderColor: 'rgba(138,43,226,0.3)',
              }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#F5F5F5',
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  Select Preferred Language
                </Text>

                <View>
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'es', label: 'Spanish' },
                    { id: 'ar', label: 'Arabic' },
                    { id: 'fr', label: 'French' },
                    { id: 'de', label: 'German' },
                    { id: 'hi', label: 'Hindi' },
                    { id: 'zh', label: 'Chinese' },
                    { id: 'ja', label: 'Japanese' },
                  ].map(option => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setPreferredLanguage(option.id)}
                      style={{
                        marginTop: 8,
                        paddingVertical: 12,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: preferredLanguage === option.id ? '#FF69B4' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <Text style={{ color: '#F5F5F5', fontWeight: '600' }}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity onPress={handleSavePreferredLanguage} style={{ flex: 1 }}>
                    <LinearGradient colors={['#8A2BE2', '#FF69B4']} style={{ padding: 14, borderRadius: 14, alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, borderWidth: 1.5, borderColor: '#FF69B4', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setIsEditingLanguage(false)}
                  >
                    <Text style={{ color: '#FF69B4', fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ProfileScreen;