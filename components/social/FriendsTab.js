// FriendsTab.js
// 🟣 EXACT FULL FILE WITH NOTIFICATION INSERTED - NO SIZE REDUCTION

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { AppCard, FriendCard } from './SocialCard';
import { spacing } from '../../styles/globalStyles';
import { supabase } from '../../supabase';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const FriendsTab = ({ 
  friends, 
  friendRequests, 
  sentRequests, 
  onRefresh 
}) => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendStats, setFriendStats] = useState(null);
  const [loadingFriendStats, setLoadingFriendStats] = useState(false);
  
  // Themed Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success"
  });
  const alertScaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const alertFadeAnim = React.useRef(new Animated.Value(0)).current;

  // Themed Confirmation States
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel"
  });
  const confirmScaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const confirmFadeAnim = React.useRef(new Animated.Value(0)).current;

  const showThemedAlert = (title, message, type = "success") => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const showThemedConfirm = (title, message, onConfirm, confirmText = "Confirm", cancelText = "Cancel") => {
    setConfirmConfig({ title, message, onConfirm, confirmText, cancelText });
    setConfirmVisible(true);
  };

  React.useEffect(() => {
    if (alertVisible) {
      Animated.parallel([
        Animated.spring(alertScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(alertFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(alertScaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(alertFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [alertVisible]);

  React.useEffect(() => {
    if (confirmVisible) {
      Animated.parallel([
        Animated.spring(confirmScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(confirmFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(confirmScaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(confirmFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [confirmVisible]);

  // ------------------------------------------------------------
  // 🔥 UPDATED ACCEPT FRIEND REQUEST — WITH NOTIFICATION INSERT
  // ------------------------------------------------------------
  const acceptFriendRequest = async (request) => {
    try {
      const { data: session } = await supabase.auth.getUser();
      const user = session?.user;

      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.friendship_id);

      if (error) {
        console.error('Error accepting friend request:', error);
        showThemedAlert('Error', 'Could not accept friend request', 'error');
        return;
      }

      // 📌 INSERT NOTIFICATION
      await supabase.from("notifications").insert({
        user_id: request.id, // the original sender (correct field)
        title: "Friend Request Accepted",
        message: `${user?.user_metadata?.full_name || "Someone"} accepted your friend request`,
        type: "friend_accept",
        created_at: new Date().toISOString()
      });

      showThemedAlert('Success', 'Friend request accepted!', 'success');
      await onRefresh();
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
      showThemedAlert('Error', 'Something went wrong', 'error');
    }
  };

  const rejectFriendRequest = async (friendshipId) => {
    try {
      showThemedConfirm(
        'Reject Friend Request',
        'Are you sure you want to reject this friend request?',
        async () => {
          const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

          if (error) {
            console.error('Error rejecting friend request:', error);
            showThemedAlert('Error', 'Could not reject friend request', 'error');
            return;
          }

          await onRefresh();
        },
        'Reject',
        'Cancel'
      );
    } catch (error) {
      console.error('Error in rejectFriendRequest:', error);
      showThemedAlert('Error', 'Something went wrong', 'error');
    }
  };

  const cancelFriendRequest = async (friendshipId) => {
    try {
      showThemedConfirm(
        'Cancel Friend Request',
        'Are you sure you want to cancel this friend request?',
        async () => {
          const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

          if (error) {
            console.error('Error canceling friend request:', error);
            showThemedAlert('Error', 'Could not cancel friend request', 'error');
            return;
          }

          showThemedAlert('Cancelled', 'Friend request has been cancelled', 'info');
          await onRefresh();
        },
        'Yes',
        'No'
      );
    } catch (error) {
      console.error('Error in cancelFriendRequest:', error);
      showThemedAlert('Error', 'Something went wrong', 'error');
    }
  };

  const removeFriend = async (friendId, friendshipId) => {
    try {
      showThemedConfirm(
        'Remove Friend',
        'Are you sure you want to remove this friend?',
        async () => {
          const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

          if (error) {
            console.error('Error removing friend:', error);
            showThemedAlert('Error', 'Could not remove friend', 'error');
            return;
          }

          showThemedAlert('Removed', 'Friend has been removed', 'info');
          setSelectedFriend(null);
          setFriendStats(null);
          await onRefresh();
        },
        'Remove',
        'Cancel'
      );
    } catch (error) {
      console.error('Error in removeFriend:', error);
      showThemedAlert('Error', 'Something went wrong', 'error');
    }
  };

  const fetchFriendStats = async (friendId) => {
    setLoadingFriendStats(true);
    try {
      const { data: podcasts, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', friendId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friend podcasts:', error);
        setLoadingFriendStats(false);
        return;
      }

      const total = podcasts?.length || 0;

      const sortedDates = (podcasts || [])
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

      const stylesUsed = {};
      const religionsUsed = new Set();
      (podcasts || []).forEach(p => {
        if (p.style) {
          stylesUsed[p.style] = (stylesUsed[p.style] || 0) + 1;
        }
        if (p.religion) {
          religionsUsed.add(p.religion);
        }
      });

      let level = 1;
      if (total >= 201) level = 7;
      else if (total >= 101) level = 6;
      else if (total >= 51) level = 5;
      else if (total >= 31) level = 4;
      else if (total >= 16) level = 3;
      else if (total >= 6) level = 2;

      const points = (total * 10) + (currentStreak * 5) + (Object.keys(stylesUsed).length * 15);

      const topStyles = Object.entries(stylesUsed)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      setFriendStats({
        total_podcasts: total,
        current_streak: currentStreak,
        total_points: points,
        level: level,
        top_styles: topStyles,
        religions_count: religionsUsed.size,
        unique_styles_count: Object.keys(stylesUsed).length,
        recent_podcasts: (podcasts || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Error in fetchFriendStats:', error);
    } finally {
      setLoadingFriendStats(false);
    }
  };

  const handleFriendPress = (friend) => {
    setSelectedFriend(friend);
    fetchFriendStats(friend.id);
  };

  const closeFriendProfile = () => {
    setSelectedFriend(null);
    setFriendStats(null);
  };

  const getLevelName = (level) => {
    const levels = {
      1: 'Beginner',
      2: 'Novice',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert',
      6: 'Master',
      7: 'Legend'
    };
    return levels[level] || 'Beginner';
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#9E9E9E',
      2: '#4CAF50',
      3: '#2196F3',
      4: '#9C27B0',
      5: '#FF9800',
      6: '#F44336',
      7: '#FFD700'
    };
    return colors[level] || '#9E9E9E';
  };

  const getNextLevelThreshold = (level) => {
    const thresholds = [0, 5, 15, 30, 50, 100, 200, 999];
    return thresholds[level] || 999;
  };

  const getAlertStyling = () => {
    switch (alertConfig.type) {
      case "success":
        return {
          icon: "check-circle",
          iconColor: "#4ADE80",
          bgColor: "rgba(74, 222, 128, 0.15)",
          borderColor: "rgba(74, 222, 128, 0.4)",
          shadowColor: "#4ADE80",
        };
      case "error":
        return {
          icon: "x-circle",
          iconColor: "#EF4444",
          bgColor: "rgba(239, 68, 68, 0.15)",
          borderColor: "rgba(239, 68, 68, 0.4)",
          shadowColor: "#EF4444",
        };
      case "info":
        return {
          icon: "info",
          iconColor: "#8A2BE2",
          bgColor: "rgba(138, 43, 226, 0.15)",
          borderColor: "rgba(138, 43, 226, 0.4)",
          shadowColor: "#8A2BE2",
        };
      default:
        return {
          icon: "info",
          iconColor: "#8A2BE2",
          bgColor: "rgba(138, 43, 226, 0.15)",
          borderColor: "rgba(138, 43, 226, 0.4)",
          shadowColor: "#8A2BE2",
        };
    }
  };

  const alertStyling = getAlertStyling();

  return (
    <>
      {/* Friend Requests Received */}
      {friendRequests.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Feather name="mail" size={20} color="#FF69B4" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5', marginLeft: 8 }}>
              Friend Requests ({friendRequests.length})
            </Text>
          </View>
          {friendRequests.map((request) => (
            <AppCard key={request.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {request.profile_pic ? (
                  <Image
                    source={{ uri: request.profile_pic }}
                    style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: '#8A2BE2',
                    }}
                  />
                ) : (
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: 'rgba(138,43,226,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#8A2BE2',
                  }}>
                    <Feather name="user" size={24} color="#8A2BE2" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#F5F5F5' }}>
                    {request.full_name || 'User'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#AAA' }}>
                    {request.email}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => acceptFriendRequest(request)}
                    style={{
                      backgroundColor: '#4CAF50',
                      borderRadius: 20,
                      padding: 8,
                    }}
                  >
                    <Feather name="check" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => rejectFriendRequest(request.friendship_id)}
                    style={{
                      backgroundColor: '#F44336',
                      borderRadius: 20,
                      padding: 8,
                    }}
                  >
                    <Feather name="x" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </AppCard>
          ))}
        </>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12 }}>
            <Feather name="send" size={20} color="#FF9800" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5', marginLeft: 8 }}>
              Sent Requests ({sentRequests.length})
            </Text>
          </View>
          {sentRequests.map((request) => (
            <AppCard key={request.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {request.profile_pic ? (
                  <Image
                    source={{ uri: request.profile_pic }}
                    style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: '#FF9800',
                    }}
                  />
                ) : (
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: 'rgba(255,152,0,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#FF9800',
                  }}>
                    <Feather name="user" size={24} color="#FF9800" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#F5F5F5' }}>
                    {request.full_name || 'User'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#AAA' }}>
                    {request.email}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#FF9800', marginTop: 2 }}>
                    Pending...
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => cancelFriendRequest(request.friendship_id)}
                  style={{
                    backgroundColor: 'rgba(244,67,54,0.2)',
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: '#F44336',
                  }}
                >
                  <Text style={{ color: '#F44336', fontWeight: '700', fontSize: 12 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </AppCard>
          ))}
        </>
      )}

      {/* Friends List */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12 }}>
        <Feather name="users" size={20} color="#4CAF50" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5', marginLeft: 8 }}>
          Your Friends ({friends.length})
        </Text>
      </View>
      {friends.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          <Feather name="users" size={60} color="#666" />
          <Text style={{ fontSize: 16, color: '#AAA', marginTop: 16 }}>
            No friends yet
          </Text>
          <Text style={{ fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center' }}>
            Go to Discover to find friends!
          </Text>
        </View>
      ) : (
        friends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            showRemove={true}
            onPress={() => handleFriendPress(friend)}
            onRemove={() => removeFriend(friend.id, friend.friendship_id)}
          />
        ))
      )}

      {/* Friend Profile Modal - ENHANCED GAME STYLE */}
      <Modal
        visible={!!selectedFriend}
        animationType="fade"
        transparent={true}
        onRequestClose={closeFriendProfile}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                width: width * 0.95,
                maxWidth: 500,
                backgroundColor: '#0A0A0F',
                borderRadius: 28,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: 'rgba(138,43,226,0.6)',
                shadowColor: '#8A2BE2',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.8,
                shadowRadius: 40,
                elevation: 25,
              }}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={closeFriendProfile}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 100,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 20,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Hero Header with Avatar */}
              <LinearGradient
                colors={['#8A2BE2', '#FF69B4', '#8A2BE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingTop: 60,
                  paddingBottom: 100,
                  alignItems: 'center',
                  borderBottomWidth: 3,
                  borderBottomColor: 'rgba(255,255,255,0.3)',
                }}
              >
                {/* Level Badge at Top */}
                {friendStats && (
                  <View style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    backgroundColor: getLevelColor(friendStats.level),
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderWidth: 2,
                    borderColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    elevation: 10,
                  }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                      LVL {friendStats.level}
                    </Text>
                  </View>
                )}

                {/* Large Avatar */}
                <View style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  borderWidth: 6,
                  borderColor: '#fff',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.6,
                  shadowRadius: 16,
                  elevation: 20,
                  marginBottom: 16,
                }}>
                  {selectedFriend?.profile_pic || selectedFriend?.avatar_url ? (
                    <Image
                      source={{ uri: selectedFriend.profile_pic || selectedFriend.avatar_url }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={{
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="user" size={60} color="#fff" />
                    </LinearGradient>
                  )}
                </View>

                {/* Name & Rank */}
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 }}>
                  {selectedFriend?.full_name || 'User'}
                </Text>
                {friendStats && (
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}>
                    <Feather name="award" size={18} color="#FFD700" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                      {getLevelName(friendStats.level)}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
                  {selectedFriend?.email}
                </Text>
              </LinearGradient>

              {/* Stats Cards Overlapping */}
              <View style={{
                marginTop: -60,
                paddingHorizontal: 20,
                marginBottom: 20,
              }}>
                {loadingFriendStats ? (
                  <View style={{
                    backgroundColor: '#1A1A20',
                    borderRadius: 20,
                    padding: 40,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'rgba(138,43,226,0.3)',
                  }}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text style={{ color: '#AAA', marginTop: 16, fontSize: 14 }}>
                      Loading stats...
                    </Text>
                  </View>
                ) : friendStats ? (
                  <>
                    {/* Main Stats Card - Game Style */}
                    <LinearGradient
                      colors={['#1A1A20', '#0A0A0F']}
                      style={{
                        borderRadius: 20,
                        padding: 24,
                        marginBottom: 16,
                        borderWidth: 2,
                        borderColor: 'rgba(138,43,226,0.5)',
                        shadowColor: '#8A2BE2',
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.6,
                        shadowRadius: 24,
                        elevation: 15,
                      }}
                    >
                      {/* Points Display */}
                      <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, color: '#AAA', marginBottom: 4 }}>
                          TOTAL POINTS
                        </Text>
                        <Text style={{ fontSize: 48, fontWeight: '800', color: '#FFD700' }}>
                          {friendStats.total_points}
                        </Text>
                      </View>

                      {/* Stats Row - Horizontal */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        marginBottom: 20,
                        paddingHorizontal: 10,
                      }}>
                        {/* Podcasts Stat */}
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <View style={{
                            backgroundColor: 'rgba(138,43,226,0.3)',
                            borderRadius: 16,
                            width: 56,
                            height: 56,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                            borderWidth: 2,
                            borderColor: '#8A2BE2',
                          }}>
                            <Feather name="mic" size={28} color="#8A2BE2" />
                          </View>
                          <Text style={{ fontSize: 24, fontWeight: '800', color: '#F5F5F5' }}>
                            {friendStats.total_podcasts}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#AAA' }}>Podcasts</Text>
                        </View>

                        {/* Separator Line */}
                        <View style={{ width: 1, height: 60, backgroundColor: 'rgba(138,43,226,0.3)', marginHorizontal: 12 }} />

                        {/* Streak Stat */}
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <View style={{
                            backgroundColor: 'rgba(255,107,53,0.3)',
                            borderRadius: 16,
                            width: 56,
                            height: 56,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                            borderWidth: 2,
                            borderColor: '#FF6B35',
                          }}>
                            <Feather name="zap" size={28} color="#FF6B35" />
                          </View>
                          <Text style={{ fontSize: 24, fontWeight: '800', color: '#F5F5F5' }}>
                            {friendStats.current_streak}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#AAA' }}>Streak</Text>
                        </View>

                        {/* Separator Line */}
                        <View style={{ width: 1, height: 60, backgroundColor: 'rgba(138,43,226,0.3)', marginHorizontal: 12 }} />

                        {/* Styles Stat */}
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <View style={{
                            backgroundColor: 'rgba(76,175,80,0.3)',
                            borderRadius: 16,
                            width: 56,
                            height: 56,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                            borderWidth: 2,
                            borderColor: '#4CAF50',
                          }}>
                            <Feather name="music" size={28} color="#4CAF50" />
                          </View>
                          <Text style={{ fontSize: 24, fontWeight: '800', color: '#F5F5F5' }}>
                            {friendStats.unique_styles_count}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#AAA' }}>Styles</Text>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Top Styles Card */}
                    {friendStats.top_styles.length > 0 && (
                      <LinearGradient
                        colors={['#1A1A20', '#0A0A0F']}
                        style={{
                          borderRadius: 20,
                          padding: 20,
                          marginBottom: 16,
                          borderWidth: 2,
                          borderColor: 'rgba(138,43,226,0.3)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                          <Feather name="star" size={22} color="#FFD700" />
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5', marginLeft: 10 }}>
                            Top Podcast Styles
                          </Text>
                        </View>
                        {friendStats.top_styles.map(([style, count], index) => (
                          <View
                            key={style}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingVertical: 12,
                              borderBottomWidth: index < friendStats.top_styles.length - 1 ? 1 : 0,
                              borderBottomColor: 'rgba(138,43,226,0.2)',
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <View style={{
                                backgroundColor: index === 0 ? 'rgba(255,215,0,0.2)' : index === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)',
                                borderRadius: 12,
                                width: 32,
                                height: 32,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                              }}>
                                <Text style={{
                                  color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                                  fontWeight: '800',
                                  fontSize: 14,
                                }}>
                                  #{index + 1}
                                </Text>
                              </View>
                              <Text style={{ fontSize: 15, color: '#F5F5F5', fontWeight: '600', flex: 1 }}>
                                {style}
                              </Text>
                            </View>
                            <View style={{
                              backgroundColor: 'rgba(138,43,226,0.2)',
                              borderRadius: 12,
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                              borderWidth: 1,
                              borderColor: 'rgba(138,43,226,0.4)',
                            }}>
                              <Text style={{ fontSize: 13, color: '#8A2BE2', fontWeight: '700' }}>
                                {count}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </LinearGradient>
                    )}

                    {/* Recent Activity */}
                    {friendStats.recent_podcasts.length > 0 && (
                      <LinearGradient
                        colors={['#1A1A20', '#0A0A0F']}
                        style={{
                          borderRadius: 20,
                          padding: 20,
                          marginBottom: 16,
                          borderWidth: 2,
                          borderColor: 'rgba(138,43,226,0.3)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                          <Feather name="clock" size={22} color="#FF69B4" />
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#F5F5F5', marginLeft: 10 }}>
                            Recent Activity
                          </Text>
                        </View>
                        {friendStats.recent_podcasts.map((podcast, index) => (
                          <View
                            key={podcast.id}
                            style={{
                              backgroundColor: 'rgba(138,43,226,0.1)',
                              borderRadius: 12,
                              padding: 14,
                              marginBottom: index < friendStats.recent_podcasts.length - 1 ? 10 : 0,
                              borderLeftWidth: 3,
                              borderLeftColor: '#8A2BE2',
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Feather name="mic" size={16} color="#8A2BE2" style={{ marginRight: 8 }} />
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#F5F5F5', flex: 1 }}>
                                {podcast.title}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 12, color: '#888' }}>
                                {moment(podcast.created_at).fromNow()}
                              </Text>
                              {podcast.style && (
                                <View style={{
                                  backgroundColor: 'rgba(138,43,226,0.3)',
                                  borderRadius: 10,
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                }}>
                                  <Text style={{ fontSize: 11, color: '#8A2BE2', fontWeight: '600' }}>
                                    {podcast.style}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </LinearGradient>
                    )}

                    {/* Remove Friend Button */}
                    <TouchableOpacity
                      onPress={() => removeFriend(selectedFriend.id, selectedFriend.friendship_id)}
                      style={{
                        backgroundColor: 'rgba(244,67,54,0.15)',
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: 'rgba(244,67,54,0.5)',
                        marginBottom: 20,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="user-x" size={20} color="#F44336" />
                        <Text style={{ color: '#F44336', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
                          Remove Friend
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Empty State */}
                    {friendStats.total_podcasts === 0 && (
                      <View style={{
                        alignItems: 'center',
                        paddingVertical: 40,
                        paddingHorizontal: 20,
                      }}>
                        <View style={{
                          backgroundColor: 'rgba(138,43,226,0.1)',
                          borderRadius: 50,
                          width: 100,
                          height: 100,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 20,
                          borderWidth: 3,
                          borderColor: 'rgba(138,43,226,0.3)',
                        }}>
                          <Feather name="mic-off" size={50} color="#666" />
                        </View>
                        <Text style={{ fontSize: 18, color: '#F5F5F5', fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
                          No Podcasts Yet
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 }}>
                          {selectedFriend.full_name || 'This user'} hasn't created any podcasts yet
                        </Text>
                      </View>
                    )}
                  </>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Themed Alert Modal */}
      <Modal visible={alertVisible} transparent animationType="none" statusBarTranslucent>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            opacity: alertFadeAnim,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setAlertVisible(false)}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          
          <Animated.View
            style={{
              transform: [{ scale: alertScaleAnim }],
              width: "100%",
              maxWidth: 340,
            }}
          >
            <LinearGradient
              colors={["#1A1A2E", "#0F0F1E"]}
              style={{
                borderRadius: 24,
                padding: 28,
                shadowColor: alertStyling.shadowColor,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 20,
                borderWidth: 1.5,
                borderColor: alertStyling.borderColor,
              }}
            >
              <View
                style={{
                  alignSelf: "center",
                  marginBottom: 20,
                  backgroundColor: alertStyling.bgColor,
                  borderRadius: 50,
                  width: 80,
                  height: 80,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: alertStyling.borderColor,
                }}
              >
                <Feather name={alertStyling.icon} size={48} color={alertStyling.iconColor} />
              </View>

              <Text
                style={{
                  color: "#FFF",
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 12,
                  letterSpacing: 0.3,
                }}
              >
                {alertConfig.title}
              </Text>

              <Text
                style={{
                  color: "#AAA",
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 28,
                  lineHeight: 22,
                }}
              >
                {alertConfig.message}
              </Text>

              <TouchableOpacity
                onPress={() => setAlertVisible(false)}
                style={{ borderRadius: 14, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={["#8A2BE2", "#FF69B4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    borderRadius: 14,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontWeight: "700",
                      fontSize: 16,
                      letterSpacing: 0.5,
                    }}
                  >
                    OK
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Themed Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="none" statusBarTranslucent>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            opacity: confirmFadeAnim,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setConfirmVisible(false)}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          
          <Animated.View
            style={{
              transform: [{ scale: confirmScaleAnim }],
              width: "100%",
              maxWidth: 340,
            }}
          >
            <LinearGradient
              colors={["#1A1A2E", "#0F0F1E"]}
              style={{
                borderRadius: 24,
                padding: 28,
                shadowColor: "#EF4444",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 20,
                borderWidth: 1.5,
                borderColor: "rgba(239, 68, 68, 0.4)",
              }}
            >
              <View
                style={{
                  alignSelf: "center",
                  marginBottom: 20,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderRadius: 50,
                  width: 80,
                  height: 80,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "rgba(239, 68, 68, 0.4)",
                }}
              >
                <Feather name="alert-circle" size={48} color="#EF4444" />
              </View>

              <Text
                style={{
                  color: "#FFF",
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 12,
                  letterSpacing: 0.3,
                }}
              >
                {confirmConfig.title}
              </Text>

              <Text
                style={{
                  color: "#AAA",
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 28,
                  lineHeight: 22,
                }}
              >
                {confirmConfig.message}
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setConfirmVisible(false)}
                  style={{ 
                    flex: 1,
                    borderRadius: 14, 
                    overflow: "hidden",
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingVertical: 16,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontWeight: "700",
                      fontSize: 16,
                      letterSpacing: 0.5,
                    }}
                  >
                    {confirmConfig.cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setConfirmVisible(false);
                    confirmConfig.onConfirm();
                  }}
                  style={{ flex: 1, borderRadius: 14, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={["#EF4444", "#DC2626"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      alignItems: "center",
                      borderRadius: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontWeight: "700",
                        fontSize: 16,
                        letterSpacing: 0.5,
                      }}
                    >
                      {confirmConfig.confirmText}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

export default FriendsTab;
