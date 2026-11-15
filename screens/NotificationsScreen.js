import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../styles/globalStyles';
import { supabase } from '../supabase';

const NotificationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error in loadNotifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const renderNotificationIcon = (type) => {
    if (type === 'friend_request') {
      return { name: 'user-plus', color: '#FF69B4', bg: 'rgba(255,105,180,0.2)' };
    }
    if (type === 'friend_accept') {
      return { name: 'check-circle', color: '#4ADE80', bg: 'rgba(74,222,128,0.18)' };
    }
    return { name: 'bell', color: '#8A2BE2', bg: 'rgba(138,43,226,0.18)' };
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          {/* HEADER */}
          <LinearGradient
            colors={['#8A2BE2', '#FF69B4']}
            style={{
              paddingTop: 60,
              paddingBottom: 22,
              paddingHorizontal: spacing.lg,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: 'rgba(0,0,0,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Feather name="bell" size={24} color="#fff" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: 2,
                  }}
                >
                  Notifications
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  Stay updated with your social activity
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* CONTENT */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <ActivityIndicator size="large" color="#8A2BE2" />
                <Text style={{ color: '#AAA', marginTop: 12 }}>
                  Loading notifications…
                </Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <View
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    borderWidth: 1.5,
                    borderColor: 'rgba(138,43,226,0.4)',
                  }}
                >
                  <Feather
                    name="bell-off"
                    size={42}
                    color="#666"
                  />
                </View>
                <Text
                  style={{
                    color: '#F5F5F5',
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 6,
                  }}
                >
                  No notifications yet
                </Text>
                <Text
                  style={{
                    color: '#888',
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 20,
                    paddingHorizontal: 20,
                  }}
                >
                  You’ll see friend requests, acceptances, and other updates here.
                </Text>
              </View>
            ) : (
              notifications.map((n) => {
                const icon = renderNotificationIcon(n.type);
                return (
                  <LinearGradient
                    key={n.id}
                    colors={['#151520', '#0C0C14']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      marginBottom: 12,
                      borderRadius: 18,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: 'rgba(138,43,226,0.45)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      {/* Icon bubble */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: icon.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.15)',
                        }}
                      >
                        <Feather name={icon.name} size={22} color={icon.color} />
                      </View>

                      {/* Text content */}
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: '#F5F5F5',
                              fontSize: 14,
                              fontWeight: '600',
                              flex: 1,
                              paddingRight: 6,
                            }}
                          >
                            {n.message}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 6,
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text
                            style={{
                              color: '#888',
                              fontSize: 11,
                            }}
                          >
                            {formatDate(n.created_at)}
                          </Text>

                          {/* Type badge */}
                          <View
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: 'rgba(138,43,226,0.18)',
                              borderWidth: 1,
                              borderColor: 'rgba(138,43,226,0.5)',
                            }}
                          >
                            <Text
                              style={{
                                color: '#C4A5FF',
                                fontSize: 10,
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                              }}
                            >
                              {n.type === 'friend_request'
                                ? 'Friend Request'
                                : n.type === 'friend_accept'
                                ? 'Friend Accepted'
                                : 'Notification'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                );
              })
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
  