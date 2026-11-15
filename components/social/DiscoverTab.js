import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Feather } from '@expo/vector-icons';
import { AppCard } from './SocialCard';
import { supabase } from '../../supabase';

const DiscoverTab = ({ friends, friendRequests, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [stats, setStats] = useState({ activeUsers: 0, podcastsShared: 0 });

  // Alert config
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success"
  });
  const alertScaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const alertFadeAnim = React.useRef(new Animated.Value(0)).current;

  const showThemedAlert = (title, message, type = "success") => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
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

  // Fetch community stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Count active users (profiles with recent activity)
        const { count: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Count podcasts shared (global_podcasts)
        const { count: podcastsShared } = await supabase
          .from('global_podcasts')
          .select('*', { count: 'exact', head: true });

        setStats({ activeUsers: activeUsers || 0, podcastsShared: podcastsShared || 0 });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values if fetch fails
      }
    };

    fetchStats();
  }, []);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileResults } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(20);

      const { data: existingFriendships } = await supabase
        .from('friendships')
        .select('friend_id, user_id, status')
        .or(`user_id.eq.${user.id}, friend_id.eq.${user.id}`);

      const connectedUserIds = new Set(
        existingFriendships?.map(f => f.user_id === user.id ? f.friend_id : f.user_id) || []
      );

      const filteredResults = profileResults
        ?.filter(profile => !connectedUserIds.has(profile.id))
        .map(profile => ({
          ...profile,
          profile_pic: profile.avatar_url,
        })) || [];

      setSearchResults(filteredResults);
    } catch (error) {
      console.error(error);
      showThemedAlert("Error", "Failed to search users", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => searchUsers(text), 500);
    setSearchTimeout(timeout);
  };

  const sendFriendRequest = async (friendId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showThemedAlert("Error", "Login required", "error");
        return;
      }

      // Check existing
      const { data: existing } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),
             and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (existing?.length > 0) {
        const f = existing[0];
        if (f.status === "pending") return showThemedAlert("Pending", "Request already sent", "info");
        if (f.status === "accepted") return showThemedAlert("Friends", "You are already friends", "info");
        if (f.status === "blocked") return showThemedAlert("Blocked", "You cannot send request", "error");
      }

      // Insert new request
      await supabase.from("friendships").insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

      // Get sender profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // INSERT notification
      await supabase
        .from("notifications")
        .insert({
          user_id: friendId,
          sender_id: user.id,
          type: "friend_request",
          message: `${profile?.full_name || user.email} sent you a friend request`,
        });

      // Remove from UI & refresh
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
      showThemedAlert("Success", "Friend request sent 🎉", "success");
      await onRefresh();

    } catch (error) {
      console.error(error);
      showThemedAlert("Error", "Something went wrong", "error");
    }
  };

  const getAlertStyling = () => {
    switch (alertConfig.type) {
      case "success": return {
        icon: "check",
        iconColor: "#4ADE80",
        bgColor: "rgba(74, 222, 128, 0.15)",
        borderColor: "rgba(74, 222, 128, 0.4)",
        shadowColor: "#4ADE80",
      };
      case "error": return {
        icon: "x",
        iconColor: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.15)",
        borderColor: "rgba(239, 68, 68, 0.4)",
        shadowColor: "#EF4444",
      };
      default: return {
        icon: "info",
        iconColor: "#8A2BE2",
        bgColor: "rgba(138,43,226,0.15)",
        borderColor: "rgba(138,43,226,0.4)",
        shadowColor: "#8A2BE2",
      };
    }
  };

  const alertStyling = getAlertStyling();

  return (
    <>
      {/* SEARCH BAR */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(138,43,226,0.3)"
      }}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={{ flex: 1, fontSize: 15, color: "#F5F5F5", paddingVertical: 12, marginLeft: 10 }}
          placeholder="Search users by name or email…"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchLoading && <ActivityIndicator size="small" color="#8A2BE2" />}
      </View>

      {/* RESULTS */}
      {searchLoading && searchQuery.trim() !== '' ? (
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={{ color: "#AAA", marginTop: 12 }}>Searching users...</Text>
        </View>
      ) : searchQuery.trim() !== "" ? (
        searchResults.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Ionicons name="search-outline" size={60} color="#666" />
            <Text style={{ fontSize: 16, color: "#AAA", marginTop: 16 }}>No users found</Text>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#F5F5F5", marginBottom: 12 }}>
              Search Results ({searchResults.length})
            </Text>

            {searchResults.map(u => (
              <AppCard key={u.id}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={{ uri: u.avatar_url }}
                    style={{
                      width: 50, height: 50,
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: "#8A2BE2",
                    }}
                  />

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#F5F5F5" }}>
                      {u.full_name || "User"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#AAA" }}>{u.email}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => sendFriendRequest(u.id)}
                    style={{
                      backgroundColor: "rgba(138,43,226,0.2)",
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: "#8A2BE2",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="person-add" size={14} color="#8A2BE2" />
                      <Text style={{ marginLeft: 4, color: "#8A2BE2", fontWeight: "700" }}>Add</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))}
          </>
        )
      ) : (
        <>
          {/* SUGGESTIONS SECTION */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#F5F5F5", marginBottom: 16 }}>
              💡 Suggestions
            </Text>
            <AppCard>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name="bulb-outline" size={24} color="#FFD700" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#F5F5F5" }}>
                  Connect with Similar Interests
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "#AAA", lineHeight: 20 }}>
                Find users who share your passion for podcasts and music. Start by searching for topics you're interested in!
              </Text>
            </AppCard>

            <AppCard>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name="people-outline" size={24} color="#8A2BE2" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#F5F5F5" }}>
                  Build Your Network
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "#AAA", lineHeight: 20 }}>
                Connect with podcasters, listeners, and creators. Share recommendations and discover new content together!
              </Text>
            </AppCard>
          </View>

          {/* STATS SECTION */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#F5F5F5", marginBottom: 16 }}>
              📊 Community Stats
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{
                flex: 1,
                backgroundColor: "rgba(138,43,226,0.1)",
                borderRadius: 12,
                padding: 16,
                marginRight: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(138,43,226,0.3)",
              }}>
                <Feather name="users" size={32} color="#8A2BE2" />
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#F5F5F5", marginTop: 8 }}>{stats.activeUsers.toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: "#AAA" }}>Active Users</Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: "rgba(255,105,180,0.1)",
                borderRadius: 12,
                padding: 16,
                marginLeft: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,105,180,0.3)",
              }}>
                <Feather name="share-2" size={32} color="#FF69B4" />
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#F5F5F5", marginTop: 8 }}>{stats.podcastsShared.toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: "#AAA" }}>Podcasts Shared</Text>
              </View>
            </View>
          </View>

          {/* MAIN HEADER */}
          <View style={{ alignItems: "center", paddingTop: 20 }}>
            <Ionicons name="people-circle-outline" size={80} color="#666" />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#F5F5F5", marginTop: 20 }}>
              Discover New Friends
            </Text>
            <Text style={{ fontSize: 14, color: "#AAA", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Start typing above to search for users, or explore featured profiles and community suggestions below!
            </Text>
          </View>
        </>
      )}

      {/* ALERT MODAL */}
      <Modal transparent visible={alertVisible}>
        <Animated.View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
          opacity: alertFadeAnim,
        }}>
          <TouchableOpacity
            style={{ position: "absolute", width: "100%", height: "100%" }}
            onPress={() => setAlertVisible(false)}
          />

          <Animated.View style={{ transform: [{ scale: alertScaleAnim }], width: "100%", maxWidth: 340 }}>
            <LinearGradient colors={["#1A1A2E", "#0F0F1E"]} style={{
              padding: 28, borderRadius: 24,
              borderColor: alertStyling.borderColor,
              borderWidth: 1.5,
            }}>
              <View style={{
                alignSelf: "center",
                width: 80, height: 80,
                borderRadius: 50,
                backgroundColor: alertStyling.bgColor,
                justifyContent: "center", alignItems: "center",
                borderWidth: 2,
                borderColor: alertStyling.borderColor,
                marginBottom: 18,
              }}>
                <Feather name={alertStyling.icon} size={48} color={alertStyling.iconColor} />
              </View>

              <Text style={{
                fontSize: 22, color: "#FFF",
                fontWeight: "800", textAlign: "center",
                marginBottom: 12,
              }}>
                {alertConfig.title}
              </Text>

              <Text style={{
                fontSize: 15, color: "#AAA",
                textAlign: "center", marginBottom: 20,
              }}>
                {alertConfig.message}
              </Text>

              <TouchableOpacity onPress={() => setAlertVisible(false)}>
                <LinearGradient
                  colors={["#8A2BE2", "#FF69B4"]}
                  style={{ padding: 16, alignItems: "center", borderRadius: 12 }}
                >
                  <Text style={{ fontSize: 16, color: "#FFF", fontWeight: "700" }}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

export default DiscoverTab;
