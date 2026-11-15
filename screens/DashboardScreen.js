// screens/DashboardScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useUser } from "../UserContext";
import { spacing } from "../styles/globalStyles";
import { supabase } from "../supabase";
import moment from "moment";
import Tooltip from "react-native-walkthrough-tooltip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import TutorialVideo from "../assets/videos/prj.mp4";

const { width, height } = Dimensions.get("window");

const normalizeLanguage = (lang) => {
  if (!lang) return null;
  const low = lang.toLowerCase().trim();
  if (["english", "en"].includes(low)) return "en";
  if (["spanish", "es", "español"].includes(low)) return "es";
  if (["arabic", "ar", "عربي"].includes(low)) return "ar";
  if (["french", "fr", "français"].includes(low)) return "fr";
  if (["german", "de", "deutsch"].includes(low)) return "de";
  if (["hindi", "hi"].includes(low)) return "hi";
  if (["japanese", "ja", "日本語"].includes(low)) return "ja";
  if (["chinese", "zh", "中文"].includes(low)) return "zh";
  return low; // fallback
};

const DashboardScreen = ({ navigation }) => {
  const { user } = useUser();

  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [userName, setUserName] = useState("");
  const userIdRef = useRef(null);

  // Tutorial UX
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showTutorialTooltip, setShowTutorialTooltip] = useState(false);

  // API Key Notice
  const [showApiKeyNotice, setShowApiKeyNotice] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Video controls
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  // Auto-hide controls
  const [showControls, setShowControls] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef(null);

  // Check if first time user and auto-play tutorial
useEffect(() => {
  const checkFirstTimeUser = async () => {
    try {
      const tutorialWatched = await AsyncStorage.getItem("tutorialWatched");
      if (!tutorialWatched) {
        // First time user - show modal and auto-play
        setShowTutorialModal(true);
        // Mark as watched immediately so it won't show again
        await AsyncStorage.setItem("tutorialWatched", "true");
        // Give modal time to render before playing
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.playAsync();
            setIsPlaying(true);
          }
        }, 500);
      }
    } catch (err) {
      console.error("Error checking first time user:", err);
    }
  };
  checkFirstTimeUser();
}, []);

  // Show tooltip only once (for returning users who haven't seen it)
  useEffect(() => {
    const checkTooltip = async () => {
      try {
        const tutorialWatched = await AsyncStorage.getItem("tutorialWatched");
        const tooltipSeen = await AsyncStorage.getItem("tutorialTooltipSeen");
        
        // Only show tooltip if tutorial was watched but tooltip hasn't been seen
        if (tutorialWatched && !tooltipSeen) {
          setShowTutorialTooltip(true);
        }
      } catch (err) {
        console.error("Error checking tutorial tooltip:", err);
      }
    };
    checkTooltip();
  }, []);

  // Reset video when modal closes
useEffect(() => {
  if (!showTutorialModal && videoRef.current) {
    videoRef.current.pauseAsync();
    videoRef.current.setPositionAsync(0);
    setIsPlaying(false);
    setPositionMillis(0);
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
  }
}, [showTutorialModal]);

  // Auto-hide controls logic
  const startHideControlsTimer = () => {
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      hideControls();
    }, 3000);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    if (isPlaying) {
      startHideControlsTimer();
    }
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  // Show/hide controls when playing state changes
  useEffect(() => {
    if (isPlaying) {
      startHideControlsTimer();
    } else {
      clearTimeout(hideControlsTimeout.current);
      showControlsTemporarily();
    }

    return () => clearTimeout(hideControlsTimeout.current);
  }, [isPlaying]);

  const handleVideoPress = () => {
    if (showControls) {
      if (isPlaying) {
        hideControls();
      }
    } else {
      showControlsTemporarily();
    }
  };

  // Video control functions
  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
    showControlsTemporarily();
  };

  const handleSkipForward = async () => {
    if (!videoRef.current) return;
    const newPosition = Math.min(positionMillis + 10000, durationMillis);
    await videoRef.current.setPositionAsync(newPosition);
    showControlsTemporarily();
  };

  const handleSkipBackward = async () => {
    if (!videoRef.current) return;
    const newPosition = Math.max(positionMillis - 10000, 0);
    await videoRef.current.setPositionAsync(newPosition);
    showControlsTemporarily();
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      setDurationMillis(status.durationMillis);
      setIsPlaying(status.isPlaying);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fetch pending friend requests count
  const fetchPendingRequests = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) return;

      const { data: friendRequests, error: reqError } = await supabase
        .from("friendships")
        .select("id")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (!reqError && friendRequests) {
        setPendingRequestsCount(friendRequests.length);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  // Calculate gamification stats from podcast data
  const calculateGamificationStats = async (userId, podcasts) => {

    const total = podcasts.length;

    // Global uploads & reactions on global_podcasts
    const { data: globalPodcasts } = await supabase
      .from("global_podcasts")
      .select("id, likes_count, comments_count")
      .eq("user_id", userId);

    const globalUploads = globalPodcasts?.length || 0;

    // FIXED: Get actual likes from global_podcast_likes table (not just the cached count)
    let totalLikes = 0;
    let totalComments = 0;

    if (globalPodcasts && globalPodcasts.length > 0) {
      const globalPodcastIds = globalPodcasts.map(p => p.id);

      // Count actual likes from global_podcast_likes
      const { data: globalLikesData, error: globalLikesError } = await supabase
        .from("global_podcast_likes")
        .select("id")
        .in("global_podcast_id", globalPodcastIds);

      if (!globalLikesError && globalLikesData) {
        totalLikes = globalLikesData.length;
      }

      // Count actual comments from global_podcast_comments
      const { data: globalCommentsData, error: globalCommentsError } = await supabase
        .from("global_podcast_comments")
        .select("id")
        .in("global_podcast_id", globalPodcastIds);

      if (!globalCommentsError && globalCommentsData) {
        totalComments = globalCommentsData.length;
      }
    }

    // Likes on personal podcasts (from friends/private sharing)
    const { data: personalReactions } = await supabase
      .from("podcast_reactions")
      .select("id")
      .in(
        "podcast_id",
        podcasts.map((p) => p.id)
      )
      .eq("reaction_type", "like");

    const personalLikes = personalReactions?.length || 0;

    // Comments on personal podcasts
    const { data: personalComments } = await supabase
      .from("podcast_comments")
      .select("id")
      .in(
        "podcast_id",
        podcasts.map((p) => p.id)
      );

    const personalCommentsCount = personalComments?.length || 0;

    // TOTAL LIKES = Global likes + Personal likes
    const combinedLikes = totalLikes + personalLikes;
    const combinedComments = totalComments + personalCommentsCount;

    // Streaks (unchanged)
    const sortedDates = podcasts
      .map((p) => moment(p.created_at).format("YYYY-MM-DD"))
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => moment(b).diff(moment(a)));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = moment().startOf("day");

    for (let i = 0; i < sortedDates.length; i++) {
      if (moment(sortedDates[i]).isSame(checkDate, "day")) {
        currentStreak++;
        tempStreak++;
        checkDate = checkDate.subtract(1, "day");
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        break;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Styles, religions, and languages used
    const stylesUsed = {};
    const religionsUsed = new Set();
    const languagesUsed = new Set();
    podcasts.forEach((p) => {
      if (p.style) {
        stylesUsed[p.style] = (stylesUsed[p.style] || 0) + 1;
      }
      if (p.religion) {
        religionsUsed.add(p.religion);
      }
      if (p.language) {
        const normalized = normalizeLanguage(p.language);
        if (normalized) languagesUsed.add(normalized);
      }
    });

    // Level by total podcasts (unchanged)
    let level = 1;
    if (total >= 201) level = 7;
    else if (total >= 101) level = 6;
    else if (total >= 51) level = 5;
    else if (total >= 31) level = 4;
    else if (total >= 16) level = 3;
    else if (total >= 6) level = 2;

    // Points calculation with combined likes and comments
    const points =
      total * 10 +
      currentStreak * 5 +
      Object.keys(stylesUsed).length * 15 +
      globalUploads * 20 +
      combinedLikes * 2 +
      combinedComments * 3;

    return {
      total_podcasts: total,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_points: points,
      level,
      styles_used: stylesUsed,
      religions_used: Array.from(religionsUsed),
      global_uploads: globalUploads,
      total_likes: combinedLikes, // FIXED: Now shows actual total likes
      total_comments: combinedComments, // FIXED: Now shows actual total comments
      personal_likes: personalLikes,
      personal_comments: personalCommentsCount,
    };
  };

  // Achievements definition
  const getAllAchievements = (stats) => {
    const achievements = [
      // Milestone Badges
      {
        id: "first_step",
        name: "First Step",
        description: "Created your first podcast",
        icon: "mic",
        color: "#4CAF50",
        unlocked: stats.total_podcasts >= 1,
        progress: Math.min(stats.total_podcasts, 1),
        target: 1,
        category: "Milestones",
      },
      {
        id: "getting_started",
        name: "Getting Started",
        description: "Created 5 podcasts",
        icon: "radio",
        color: "#2196F3",
        unlocked: stats.total_podcasts >= 5,
        progress: Math.min(stats.total_podcasts, 5),
        target: 5,
        category: "Milestones",
      },
      {
        id: "podcaster",
        name: "Podcaster",
        description: "Created 10 podcasts",
        icon: "headphones",
        color: "#9C27B0",
        unlocked: stats.total_podcasts >= 10,
        progress: Math.min(stats.total_podcasts, 10),
        target: 10,
        category: "Milestones",
      },
      {
        id: "committed",
        name: "Committed Creator",
        description: "Created 25 podcasts",
        icon: "disc",
        color: "#FF9800",
        unlocked: stats.total_podcasts >= 25,
        progress: Math.min(stats.total_podcasts, 25),
        target: 25,
        category: "Milestones",
      },
      {
        id: "expert",
        name: "Expert Producer",
        description: "Created 50 podcasts",
        icon: "award",
        color: "#F44336",
        unlocked: stats.total_podcasts >= 50,
        progress: Math.min(stats.total_podcasts, 50),
        target: 50,
        category: "Milestones",
      },
      {
        id: "master",
        name: "Master Creator",
        description: "Created 100 podcasts",
        icon: "star",
        color: "#FFD700",
        unlocked: stats.total_podcasts >= 100,
        progress: Math.min(stats.total_podcasts, 100),
        target: 100,
        category: "Milestones",
      },

      // Streak Badges
      {
        id: "streak_3",
        name: "3 Day Warrior",
        description: "Created podcasts for 3 days straight",
        icon: "zap",
        color: "#FF6B35",
        unlocked: stats.current_streak >= 3,
        progress: Math.min(stats.current_streak, 3),
        target: 3,
        category: "Streaks",
      },
      {
        id: "streak_7",
        name: "Week Champion",
        description: "Created podcasts for 7 days straight",
        icon: "activity",
        color: "#FF5722",
        unlocked: stats.current_streak >= 7,
        progress: Math.min(stats.current_streak, 7),
        target: 7,
        category: "Streaks",
      },
      {
        id: "streak_14",
        name: "Fortnight Hero",
        description: "Created podcasts for 14 days straight",
        icon: "trending-up",
        color: "#E91E63",
        unlocked: stats.current_streak >= 14,
        progress: Math.min(stats.current_streak, 14),
        target: 14,
        category: "Streaks",
      },
      {
        id: "streak_30",
        name: "Monthly Legend",
        description: "Created podcasts for 30 days straight",
        icon: "target",
        color: "#9C27B0",
        unlocked: stats.current_streak >= 30,
        progress: Math.min(stats.current_streak, 30),
        target: 30,
        category: "Streaks",
      },

      // Style Mastery
      {
        id: "storyteller",
        name: "Storyteller",
        description: "Created 10 storytelling podcasts",
        icon: "book-open",
        color: "#00BCD4",
        unlocked: (stats.styles_used["Storytelling"] || 0) >= 10,
        progress: Math.min(stats.styles_used["Storytelling"] || 0, 10),
        target: 10,
        category: "Style Master",
      },
      {
        id: "educator",
        name: "Educator",
        description: "Created 10 educational podcasts",
        icon: "book",
        color: "#3F51B5",
        unlocked: (stats.styles_used["Educational"] || 0) >= 10,
        progress: Math.min(stats.styles_used["Educational"] || 0, 10),
        target: 10,
        category: "Style Master",
      },
      {
        id: "motivator",
        name: "Motivator",
        description: "Created 10 motivational podcasts",
        icon: "sun",
        color: "#FFEB3B",
        unlocked: (stats.styles_used["Motivational"] || 0) >= 10,
        progress: Math.min(stats.styles_used["Motivational"] || 0, 10),
        target: 10,
        category: "Style Master",
      },
      {
        id: "conversationalist",
        name: "Conversationalist",
        description: "Created 10 conversational podcasts",
        icon: "message-circle",
        color: "#8BC34A",
        unlocked: (stats.styles_used["Conversational"] || 0) >= 10,
        progress: Math.min(stats.styles_used["Conversational"] || 0, 10),
        target: 10,
        category: "Style Master",
      },

      // Social
      {
        id: "first_share",
        name: "First Share",
        description: "Shared your first podcast globally",
        icon: "share-2",
        color: "#03A9F4",
        unlocked: stats.global_uploads >= 1,
        progress: Math.min(stats.global_uploads, 1),
        target: 1,
        category: "Social",
      },
      {
        id: "social_butterfly",
        name: "Social Butterfly",
        description: "Shared 10 podcasts globally",
        icon: "users",
        color: "#00BCD4",
        unlocked: stats.global_uploads >= 10,
        progress: Math.min(stats.global_uploads, 10),
        target: 10,
        category: "Social",
      },
      {
        id: "influencer",
        name: "Influencer",
        description: "Received 50 likes on your podcasts",
        icon: "heart",
        color: "#E91E63",
        unlocked: stats.total_likes >= 50,
        progress: Math.min(stats.total_likes, 50),
        target: 50,
        category: "Social",
      },
      {
        id: "viral_sensation",
        name: "Viral Sensation",
        description: "Received 100 likes on your podcasts",
        icon: "trending-up",
        color: "#FF4081",
        unlocked: stats.total_likes >= 100,
        progress: Math.min(stats.total_likes, 100),
        target: 100,
        category: "Social",
      },
      {
        id: "conversationalist_social",
        name: "Conversation Starter",
        description: "Received 25 comments on your podcasts",
        icon: "message-square",
        color: "#9C27B0",
        unlocked: stats.total_comments >= 25,
        progress: Math.min(stats.total_comments, 25),
        target: 25,
        category: "Social",
      },

      // Diversity
      {
        id: "style_explorer",
        name: "Style Explorer",
        description: "Used 3 different podcast styles",
        icon: "layers",
        color: "#673AB7",
        unlocked: Object.keys(stats.styles_used).length >= 3,
        progress: Math.min(Object.keys(stats.styles_used).length, 3),
        target: 3,
        category: "Diversity",
      },
      {
        id: "diversity_champion",
        name: "Diversity Champion",
        description: "Used all 6 podcast styles",
        icon: "grid",
        color: "#3F51B5",
        unlocked: Object.keys(stats.styles_used).length >= 6,
        progress: Math.min(Object.keys(stats.styles_used).length, 6),
        target: 6,
        category: "Diversity",
      },
      {
        id: "faith_explorer",
        name: "Faith Explorer",
        description: "Created podcasts about 5 different religions",
        icon: "globe",
        color: "#00BCD4",
        unlocked: stats.religions_used.length >= 5,
        progress: Math.min(stats.religions_used.length, 5),
        target: 5,
        category: "Diversity",
      },
      {
        id: "bilingual_broadcaster",
        name: "Bilingual Broadcaster",
        description: "Created podcasts in 2 different languages",
        icon: "message-circle",
        color: "#2196F3",
        unlocked: stats.languages_used?.length >= 2,
        progress: Math.min(stats.languages_used?.length || 0, 2),
        target: 2,
        category: "Diversity",
      },
      {
        id: "language_explorer",
        name: "Language Explorer",
        description: "Created podcasts in 3 different languages",
        icon: "globe",
        color: "#FF9800",
        unlocked: stats.languages_used?.length >= 3,
        progress: Math.min(stats.languages_used?.length || 0, 3),
        target: 3,
        category: "Diversity",
      },
      {
        id: "polyglot_podcaster",
        name: "Polyglot Podcaster",
        description: "Created podcasts in all 8 languages",
        icon: "star",
        color: "#9C27B0",
        unlocked: stats.languages_used?.length >= 8,
        progress: Math.min(stats.languages_used?.length || 0, 8),
        target: 8,
        category: "Diversity",
      },

      // Special
      {
        id: "consistent",
        name: "Consistent Creator",
        description: "Reached a 10-day streak",
        icon: "check-circle",
        color: "#4CAF50",
        unlocked: stats.longest_streak >= 10,
        progress: Math.min(stats.longest_streak, 10),
        target: 10,
        category: "Special",
      },
      {
        id: "unstoppable",
        name: "Unstoppable",
        description: "Reached a 21-day streak",
        icon: "shield",
        color: "#FF9800",
        unlocked: stats.longest_streak >= 21,
        progress: Math.min(stats.longest_streak, 21),
        target: 21,
        category: "Special",
      },
    ];

    return achievements;
  };

  // Initial fetch
  const loadGamification = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();
      if (error || !authUser) {
        if (!isRefresh) setLoading(false);
        return;
      }

      userIdRef.current = authUser.id;

      // Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, openrouter_api_key")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!profileError && profile) {
        if (profile.avatar_url) setProfilePicUrl(profile.avatar_url);
        if (profile.full_name) setUserName(profile.full_name);
        setHasApiKey(!!profile.openrouter_api_key);
      }

      // Podcasts
      const { data: podcasts, error: podcastError } = await supabase
        .from("podcasts")
        .select("id, title, style, religion, language, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      if (podcastError) {
        console.error("Error fetching podcasts:", podcastError);
        if (!isRefresh) setLoading(false);
        return;
      }

      const stats = await calculateGamificationStats(
        authUser.id,
        podcasts || []
      );
      const allAchievements = getAllAchievements(stats);
      const unlockedAchievements = allAchievements.filter((a) => a.unlocked);
      const recentBadges = unlockedAchievements.slice(-3).reverse();

      setGamificationData({
        stats,
        recentBadges,
        allAchievements,
        totalPodcasts: podcasts?.length || 0,
      });

      await fetchPendingRequests();
    } catch (err) {
      console.error("Error fetching gamification data:", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  // Refresh stats function
  const refreshStats = async () => {
    setRefreshing(true);
    try {
      await loadGamification(true);
    } catch (err) {
      console.error("Error refreshing stats:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGamification();
  }, []);

  // Refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadGamification();
    });
    return unsubscribe;
  }, [navigation]);

  const tileData = [
    {
      id: 1,
      icon: "mic",
      title: "Generate",
      subtitle: "Podcast",
      screen: "PodcastGenerator",
      colors: ["#8A2BE2", "#FF69B4"],
    },
    {
      id: 2,
      icon: "book",
      title: "My",
      subtitle: "Library",
      screen: "Library",
      colors: ["#667eea", "#764ba2"],
    },
    {
      id: 3,
      icon: "users",
      title: "Socials",
      subtitle: "Connect",
      screen: "Socials",
      colors: ["#764ba2", "#667eea"],
    },
    {
      id: 4,
      icon: "user",
      title: "Profile",
      subtitle: "Settings",
      screen: "Profile",
      colors: ["#FF69B4", "#8A2BE2"],
    },
  ];

  const renderTile = (tile) => (
    <TouchableOpacity
      key={tile.id}
      activeOpacity={0.8}
      style={{
        width: (width - spacing.lg * 3) / 2,
        marginVertical: spacing.md,
      }}
      onPress={() => navigation.navigate(tile.screen)}
    >
      <LinearGradient
        colors={tile.colors || ["#1A1A20", "#0A0A0F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          shadowColor: tile.colors ? tile.colors[0] : "#8A2BE2",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 10,
          borderWidth: 1.5,
          borderColor: tile.colors
            ? `${tile.colors[0]}80`
            : "rgba(138,43,226,0.5)",
        }}
      >
        {tile.showBadge && (
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "#FF3B30",
              borderRadius: 12,
              minWidth: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
              borderWidth: 2,
              borderColor: "#fff",
              shadowColor: "#FF3B30",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {tile.badgeCount}
            </Text>
          </View>
        )}

        <Feather
          name={tile.icon}
          size={28}
          color="#fff"
          style={{ marginBottom: spacing.md }}
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 2,
            textAlign: "center",
          }}
        >
          {tile.title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
          }}
        >
          {tile.subtitle}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color }) => (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: spacing.sm }}>
      <View
        style={{
          backgroundColor: `${color}20`,
          borderRadius: 12,
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        }}
      >
        <Feather name={icon} size={24} color={color} />
      </View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: "#F5F5F5",
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: "#AAA",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );

  const getLevelName = (level) => {
    const levels = {
      1: "Beginner",
      2: "Novice",
      3: "Intermediate",
      4: "Advanced",
      5: "Expert",
      6: "Master",
      7: "Legend",
    };
    return levels[level] || "Beginner";
  };

  const getNextLevelThreshold = (level) => {
    const thresholds = [0, 5, 15, 30, 50, 100, 200, 999];
    return thresholds[level] || 999;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      {/* Header Gradient */}
      <LinearGradient
        colors={["#8A2BE2", "#FF69B4"]}
        style={{
          paddingTop: 70,
          paddingBottom: spacing.xl,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          shadowColor: "#8A2BE2",
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 6,
          borderBottomWidth: 1.5,
          borderColor: "rgba(226,226,226,0.6)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
          }}
        >
          {/* Profile Picture */}
          <View style={{ marginRight: spacing.md }}>
            {profilePicUrl ? (
              <Image
                source={{ uri: profilePicUrl }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth: 3,
                  borderColor: "#fff",
                }}
              />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "rgba(255,255,255,0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: "#fff",
                }}
              >
                <Feather name="user" size={28} color="#fff" />
              </View>
            )}
          </View>

          {/* Welcome Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 16, color: "#fff", fontWeight: "500" }}
            >
              Welcome back,
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: "#fff",
                marginTop: 6,
              }}
            >
              {userName || user?.name || "User"}!
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: 120,
        }}
      >
        {/* Quick Actions */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#F5F5F5",
            marginBottom: spacing.md,
          }}
        >
          Quick Actions
        </Text>
        <View
          style={{
            height: 2,
            backgroundColor: "#FF69B4",
            marginBottom: spacing.lg,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {tileData.map(renderTile)}
        </View>

        {/* Gamification Section */}
        {loading ? (
          <View
            style={{
              paddingVertical: spacing.xl,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text
              style={{
                color: "#AAA",
                marginTop: spacing.sm,
              }}
            >
              Loading your progress...
            </Text>
          </View>
        ) : (
          <>
            {/* Level & Points Card */}
            <LinearGradient
              colors={["#1A1A20", "#0A0A0F"]}
              style={{
                borderRadius: 20,
                padding: spacing.xl,
                marginTop: spacing.xl,
                shadowColor: "#8A2BE2",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.5,
                shadowRadius: 24,
                elevation: 12,
                borderWidth: 1.5,
                borderColor: "rgba(138,43,226,0.5)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.lg,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#F5F5F5",
                      marginBottom: 4,
                    }}
                  >
                    Level {gamificationData?.stats?.level || 1}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#8A2BE2",
                      fontWeight: "600",
                    }}
                  >
                    {getLevelName(gamificationData?.stats?.level || 1)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "800",
                      color: "#FF69B4",
                    }}
                  >
                    {gamificationData?.stats?.total_points || 0}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#AAA" }}>Points</Text>
                </View>
              </View>

              {/* Level Progress Bar */}
              <View style={{ marginBottom: spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#AAA" }}>
                    Progress to next level
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#F5F5F5",
                      fontWeight: "600",
                    }}
                  >
                    {gamificationData?.stats?.total_podcasts || 0} /{" "}
                    {getNextLevelThreshold(
                      gamificationData?.stats?.level || 1
                    )}
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#1A1A20",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#8A2BE2", "#FF69B4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: "100%",
                      width: `${
                        Math.min(
                          ((gamificationData?.stats?.total_podcasts || 0) /
                            getNextLevelThreshold(
                              gamificationData?.stats?.level || 1
                            )) *
                            100,
                          100
                        ) || 0
                      }%`,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>

              {/* Quick Stats Grid */}
              <View
                style={{
                  flexDirection: "row",
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: "#333",
                }}
              >
                <StatCard
                  icon="disc"
                  value={gamificationData?.stats?.total_podcasts || 0}
                  label="Podcasts"
                  color="#8A2BE2"
                />
                <View
                  style={{
                    width: 1,
                    backgroundColor: "#333",
                    marginHorizontal: spacing.sm,
                  }}
                />
                <StatCard
                  icon="zap"
                  value={gamificationData?.stats?.current_streak || 0}
                  label="Day Streak"
                  color="#FF6B35"
                />
              </View>
            </LinearGradient>

            {/* Extended Stats */}
            <LinearGradient
              colors={["#1A1A20", "#0A0A0F"]}
              style={{
                borderRadius: 20,
                padding: spacing.xl,
                marginTop: spacing.lg,
                shadowColor: "#8A2BE2",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.5,
                shadowRadius: 24,
                elevation: 12,
                borderWidth: 1.5,
                borderColor: "rgba(138,43,226,0.5)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.lg,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#F5F5F5",
                  }}
                >
                  Your Stats
                </Text>
                <TouchableOpacity
                  onPress={refreshStats}
                  disabled={refreshing}
                  style={{
                    padding: spacing.sm,
                    borderRadius: 8,
                    backgroundColor: refreshing ? "rgba(255,255,255,0.1)" : "rgba(138,43,226,0.2)",
                  }}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#8A2BE2" />
                  ) : (
                    <Feather name="refresh-ccw" size={20} color="#8A2BE2" />
                  )}
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  marginBottom: spacing.md,
                }}
              >
                <StatCard
                  icon="share-2"
                  value={gamificationData?.stats?.global_uploads || 0}
                  label="Global Shares"
                  color="#03A9F4"
                />
                <View
                  style={{
                    width: 1,
                    backgroundColor: "#333",
                    marginHorizontal: spacing.sm,
                  }}
                />
                <StatCard
                  icon="heart"
                  value={gamificationData?.stats?.total_likes || 0}
                  label="Total Likes"
                  color="#E91E63"
                />
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: "#333",
                  marginVertical: spacing.sm,
                }}
              />

              <View style={{ flexDirection: "row" }}>
                <StatCard
                  icon="message-square"
                  value={gamificationData?.stats?.total_comments || 0}
                  label="Comments"
                  color="#9C27B0"
                />
                <View
                  style={{
                    width: 1,
                    backgroundColor: "#333",
                    marginHorizontal: spacing.sm,
                  }}
                />
                <StatCard
                  icon="target"
                  value={gamificationData?.stats?.longest_streak || 0}
                  label="Best Streak"
                  color="#FFD700"
                />
              </View>
            </LinearGradient>

            {/* Achievements Section */}
            {gamificationData?.allAchievements &&
              gamificationData.allAchievements.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("Achievements", {
                      achievements: gamificationData.allAchievements,
                      stats: gamificationData.stats,
                    })
                  }
                >
                  <LinearGradient
                    colors={["#1A1A20", "#0A0A0F"]}
                    style={{
                      borderRadius: 20,
                      padding: spacing.xl,
                      marginTop: spacing.lg,
                      shadowColor: "#FFD700",
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 0.5,
                      shadowRadius: 24,
                      elevation: 12,
                      borderWidth: 1.5,
                      borderColor: "rgba(255,215,0,0.5)",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: spacing.lg,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <Feather
                            name="award"
                            size={24}
                            color="#FFD700"
                            style={{ marginRight: 10 }}
                          />
                          <Text
                            style={{
                              fontSize: 20,
                              fontWeight: "700",
                              color: "#F5F5F5",
                            }}
                          >
                            Achievements
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: "#AAA" }}>
                          {
                            gamificationData.allAchievements.filter(
                              (a) => a.unlocked
                            ).length
                          }{" "}
                          of {gamificationData.allAchievements.length} Unlocked
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={24} color="#AAA" />
                    </View>

                    <View style={{ marginBottom: spacing.lg }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: "#AAA" }}>
                          Overall Progress
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#FFD700",
                            fontWeight: "700",
                          }}
                        >
                          {Math.round(
                            (gamificationData.allAchievements.filter(
                              (a) => a.unlocked
                            ).length /
                              gamificationData.allAchievements.length) *
                              100
                          )}
                          %
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 12,
                          backgroundColor: "#1A1A20",
                          borderRadius: 6,
                          overflow: "hidden",
                        }}
                      >
                        <LinearGradient
                          colors={["#FFD700", "#FFA500"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            height: "100%",
                            width: `${
                              (gamificationData.allAchievements.filter(
                                (a) => a.unlocked
                              ).length /
                                gamificationData.allAchievements.length) *
                              100
                            }%`,
                            borderRadius: 6,
                          }}
                        />
                      </View>
                    </View>

                    {gamificationData.recentBadges &&
                    gamificationData.recentBadges.length > 0 ? (
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#AAA",
                            marginBottom: spacing.md,
                          }}
                        >
                          Latest Unlocked
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-around",
                            marginBottom: spacing.md,
                          }}
                        >
                          {gamificationData.recentBadges
                            .slice(0, 3)
                            .map((badge) => (
                              <View
                                key={badge.id}
                                style={{
                                  alignItems: "center",
                                  flex: 1,
                                  paddingHorizontal: 4,
                                }}
                              >
                                <View
                                  style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: `${badge.color}20`,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 8,
                                    borderWidth: 2,
                                    borderColor: badge.color,
                                  }}
                                >
                                  <Feather
                                    name={badge.icon}
                                    size={28}
                                    color={badge.color}
                                  />
                                </View>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "600",
                                    color: "#F5F5F5",
                                    textAlign: "center",
                                  }}
                                  numberOfLines={2}
                                >
                                  {badge.name}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    ) : (
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: spacing.md,
                        }}
                      >
                        <Feather
                          name="lock"
                          size={32}
                          color="#666"
                          style={{ marginBottom: spacing.sm }}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#AAA",
                            textAlign: "center",
                          }}
                        >
                          Start creating podcasts to unlock achievements
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        marginTop: spacing.md,
                        paddingTop: spacing.md,
                        borderTopWidth: 1,
                        borderTopColor: "#333",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#8A2BE2",
                          fontWeight: "600",
                        }}
                      >
                        Tap to view all achievements
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

            {/* No Gamification Data - First Time User */}
            {(!gamificationData?.stats ||
              gamificationData.stats.total_podcasts === 0) && (
              <LinearGradient
                colors={["#1A1A20", "#0A0A0F"]}
                style={{
                  borderRadius: 20,
                  padding: spacing.xl,
                  marginTop: spacing.xl,
                  shadowColor: "#8A2BE2",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  elevation: 12,
                  borderWidth: 1.5,
                  borderColor: "rgba(138,43,226,0.5)",
                  alignItems: "center",
                }}
              >
                <Feather
                  name="award"
                  size={48}
                  color="#8A2BE2"
                  style={{ marginBottom: spacing.md }}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#F5F5F5",
                    marginBottom: spacing.sm,
                    textAlign: "center",
                  }}
                >
                  Start Your Journey!
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#AAA",
                    textAlign: "center",
                    marginBottom: spacing.lg,
                    lineHeight: 20,
                  }}
                >
                  Create your first podcast to unlock badges, earn points, and
                  level up your creator profile!
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("PodcastGenerator")}
                  style={{ borderRadius: 12, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={["#8A2BE2", "#FF69B4"]}
                    style={{
                      paddingHorizontal: spacing.xl,
                      paddingVertical: spacing.md,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Feather name="mic" size={20} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      Create First Podcast
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </>
        )}
      </ScrollView>

      {/* CUSTOM TUTORIAL VIDEO MODAL */}
      <Modal
        visible={showTutorialModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTutorialModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#1A1A20", "#0A0A0F"]}
            style={styles.modalContainer}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.iconCircle}>
                  <Feather name="play-circle" size={24} color="#8A2BE2" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>App Tutorial</Text>
                  <Text style={styles.modalSubtitle}>Learn how to use the app</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowTutorialModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Video Player */}
            <TouchableWithoutFeedback onPress={handleVideoPress}>
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={TutorialVideo}
                  style={styles.video}
                  resizeMode="contain"
                  shouldPlay={false}
                  isLooping={false}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                />
                
                {/* Video Overlay Controls */}
                {showControls && (
                  <Animated.View 
                    style={[
                      styles.controlsOverlay,
                      { opacity: controlsOpacity }
                    ]}
                  >
                    {/* Time Display */}
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>
                        {formatTime(positionMillis)} / {formatTime(durationMillis)}
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <LinearGradient
                          colors={["#8A2BE2", "#FF69B4"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${
                                durationMillis > 0
                                  ? (positionMillis / durationMillis) * 100
                                  : 0
                              }%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Control Buttons */}
                    <View style={styles.controlButtons}>
                      {/* Skip Backward */}
                      <TouchableOpacity
                        onPress={handleSkipBackward}
                        style={styles.controlButton}
                      >
                        <Feather name="rotate-ccw" size={28} color="#fff" />
                        <Text style={styles.controlButtonText}>10s</Text>
                      </TouchableOpacity>

                      {/* Play/Pause */}
                      <TouchableOpacity
                        onPress={handlePlayPause}
                        style={[styles.controlButton, styles.playButton]}
                      >
                        <LinearGradient
                          colors={["#8A2BE2", "#FF69B4"]}
                          style={styles.playButtonGradient}
                        >
                          <Feather
                            name={isPlaying ? "pause" : "play"}
                            size={36}
                            color="#fff"
                          />
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Skip Forward */}
                      <TouchableOpacity
                        onPress={handleSkipForward}
                        style={styles.controlButton}
                      >
                        <Feather name="rotate-cw" size={28} color="#fff" />
                        <Text style={styles.controlButtonText}>10s</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              </View>
            </TouchableWithoutFeedback>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                Watch this tutorial to learn how to use all the app features
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Floating Tutorial Button + Tooltip */}
      <Tooltip
        isVisible={showTutorialTooltip}
        content={
          <View style={{ padding: 10 }}>
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Tutorial Button
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
              }}
            >
              Tap here to watch the app walkthrough anytime!
            </Text>
          </View>
        }
        placement="top"
        onClose={async () => {
          setShowTutorialTooltip(false);
          try {
            await AsyncStorage.setItem("tutorialTooltipSeen", "true");
          } catch (err) {
            console.error("Error saving tooltip state:", err);
          }
        }}
        backgroundColor="rgba(0,0,0,0.85)"
        contentStyle={{
          backgroundColor: "rgba(138,43,226,0.95)",
          borderRadius: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.floatingButton}
          onPress={async () => {
            setShowTutorialModal(true);
            setShowTutorialTooltip(false);
            try {
              await AsyncStorage.setItem("tutorialTooltipSeen", "true");
            } catch (err) {
              console.error("Error saving tooltip state:", err);
            }
          }}
        >
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            style={styles.floatingButtonGradient}
          >
            <Feather name="play-circle" size={28} color="#000" />
          </LinearGradient>
          
          {/* Label below button */}
          <View style={styles.floatingButtonLabel}>
            <Text style={styles.floatingButtonLabelText}>Tutorial</Text>
          </View>
        </TouchableOpacity>
      </Tooltip>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(138, 43, 226, 0.5)",
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 43, 226, 0.3)",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(138, 43, 226, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#8A2BE2",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#AAA",
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    position: "relative",
    backgroundColor: "#000",
    aspectRatio: 12 / 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(138, 43, 226, 0.3)",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  controlButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  playButton: {
    width: 70,
    height: 70,
  },
  playButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(138, 43, 226, 0.3)",
  },
  footerText: {
    color: "#AAA",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    alignItems: "center",
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFD700",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingButtonLabel: {
    marginTop: 6,
    backgroundColor: "rgba(0,0, 0, 0, 0.85)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  floatingButtonLabelText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default DashboardScreen;