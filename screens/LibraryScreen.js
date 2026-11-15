import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';
import moment from "moment";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import globalStyles, { spacing } from "../styles/globalStyles";
import { supabase } from "../supabase";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { getThumbnailForPodcast } from "../utils/thumbnailMapping";

const LibraryScreen = () => {
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedReligion, setSelectedReligion] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [podcasts, setPodcasts] = useState([]);
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [playbackModalVisible, setPlaybackModalVisible] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [caption, setCaption] = useState("");
  const [downloadingPodcastId, setDownloadingPodcastId] = useState(null);

  // Themed Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success",
  });

  const userRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const alertScaleAnim = useRef(new Animated.Value(0.8)).current;
  const alertFadeAnim = useRef(new Animated.Value(0)).current;

  const styleOptions = [
    "Conversational",
    "Educational",
    "Storytelling",
    "Motivational",
    "Spiritual",
    "Humorous",
  ];
  const religionOptions = [
    "Christianity",
    "Islam",
    "Hinduism",
    "Buddhism",
    "Sikhism",
    "Judaism",
    "Other",
  ];

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

  const languageOptions = [
    { id: 'en', label: 'English 🇺🇸', value: 'English' },
    { id: 'es', label: 'Spanish 🇪🇸', value: 'Spanish' },
    { id: 'ar', label: 'Arabic 🇸🇦', value: 'Arabic' },
    { id: 'fr', label: 'French 🇫🇷', value: 'French' },
    { id: 'hi', label: 'Hindi 🇮🇳', value: 'Hindi' },
    { id: 'ja', label: 'Japanese 🇯🇵', value: 'Japanese' },
    { id: 'zh', label: 'Chinese 🇨🇳', value: 'Chinese' },
    { id: 'de', label: 'German 🇩🇪', value: 'German' },
  ];

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const showThemedAlert = (title, message, type = "success") => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  useEffect(() => {
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

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) return;
      userRef.current = user.id;
      fetchPodcasts();
    };
    fetchUser();
  }, []);

  const fetchPodcasts = async () => {
    if (!userRef.current) return;
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .eq("user_id", userRef.current)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching podcasts:", error);
      return;
    }

    const formatted = data.map((p) => ({
      id: p.id,
      title: p.title,
      style: p.style || "Unknown",
      religion: p.religion || "N/A",
      language: normalizeLanguage(p.language) || "en",
      audio_url: p.audio_url,
      script: p.script,
      date: p.created_at,
    }));

    setPodcasts(formatted);
  };

  useEffect(() => {
    const interval = setInterval(fetchPodcasts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (filterVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [filterVisible]);

  const filteredPodcasts = podcasts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStyle = selectedStyle ? p.style === selectedStyle : true;
    const matchReligion = selectedReligion ? p.religion === selectedReligion : true;
    const selectedLanguageCode = languageOptions.find(opt => opt.value === selectedLanguage)?.id;
    const matchLanguage = selectedLanguage ? p.language === selectedLanguageCode : true;
    return matchSearch && matchStyle && matchReligion && matchLanguage;
  });

  const categorizePodcasts = (list) => {
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "days").startOf("day");
    const last7Days = moment().subtract(7, "days").startOf("day");

    return {
      today: list.filter((p) => moment(p.date).isSame(today, "d")),
      yesterday: list.filter((p) => moment(p.date).isSame(yesterday, "d")),
      last7Days: list.filter(
        (p) =>
          moment(p.date).isAfter(last7Days) &&
          !moment(p.date).isSame(today, "d") &&
          !moment(p.date).isSame(yesterday, "d")
      ),
      older: list.filter((p) => moment(p.date).isBefore(last7Days)),
    };
  };

  const grouped = categorizePodcasts(filteredPodcasts);

  const handlePlayPodcast = async (podcast) => {
    if (!podcast.audio_url) {
      showThemedAlert(
        "Please Wait",
        "This podcast is still being generated.",
        "info"
      );
      return;
    }

    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: podcast.audio_url },
        { shouldPlay: true }
      );

      setSelectedPodcast(podcast);
      setPlaybackModalVisible(true);
      setCurrentSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis);
          setDurationMillis(status.durationMillis || 1);
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (error) {
      console.error("Error playing podcast:", error);
      showThemedAlert(
        "Playback Error",
        "Unable to play the podcast.",
        "error"
      );
    }
  };

  const handlePauseResume = async () => {
    if (!currentSound) return;
    if (isPlaying) await currentSound.pauseAsync();
    else await currentSound.playAsync();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = async (value) => {
    if (!currentSound) return;
    await currentSound.setPositionAsync(value);
  };

  const handleForward = async () => {
    if (!currentSound) return;
    let newPos = positionMillis + 10000;
    if (newPos > durationMillis) newPos = durationMillis;
    await currentSound.setPositionAsync(newPos);
  };

  const handleBackward = async () => {
    if (!currentSound) return;
    let newPos = positionMillis - 10000;
    if (newPos < 0) newPos = 0;
    await currentSound.setPositionAsync(newPos);
  };

  const handleCloseModal = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }
    setPlaybackModalVisible(false);
    setCurrentSound(null);
    setSelectedPodcast(null);
    setPositionMillis(0);
    setDurationMillis(1);
  };

  // DELETE CONFIRMATION + LOGIC
  const confirmDelete = (podcast) => {
    Alert.alert(
      "Delete Podcast",
      `Are you sure you want to delete "${podcast.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deletePodcast(podcast) },
      ]
    );
  };

  const deletePodcast = async (podcast) => {
    try {
      await supabase.from("global_podcasts").delete().eq("podcast_id", podcast.id);
      await supabase.from("podcast_comments").delete().eq("podcast_id", podcast.id);
      await supabase.from("podcast_reactions").delete().eq("podcast_id", podcast.id);

      const { error } = await supabase.from("podcasts").delete().eq("id", podcast.id);
      if (error) throw error;

      showThemedAlert("Deleted", "Podcast deleted successfully!", "success");

      // 🔥 instantly update UI without waiting for interval
      setPodcasts((prev) => prev.filter((item) => item.id !== podcast.id));

    } catch (error) {
      console.log("Delete error:", error);
      showThemedAlert("Error", "Failed to delete podcast", "error");
    }
  };

  const handleShareGlobally = () => {
    if (!selectedPodcast || !userRef.current) {
      showThemedAlert("Error", "Please select a podcast first", "error");
      return;
    }
    setCaptionModalVisible(true);
  };

  const handleConfirmShare = async () => {
    if (!selectedPodcast || !userRef.current) return;

    setIsSharing(true);
    setCaptionModalVisible(false);

    try {
      const { data: existingShare } = await supabase
        .from("global_podcasts")
        .select("id")
        .eq("podcast_id", selectedPodcast.id)
        .single();

      if (existingShare) {
        showThemedAlert(
          "Already Shared",
          "This podcast has already been shared globally!",
          "info"
        );
        setIsSharing(false);
        setCaption("");
        return;
      }

      const { error } = await supabase.from("global_podcasts").insert({
        podcast_id: selectedPodcast.id,
        user_id: userRef.current,
        title: selectedPodcast.title,
        style: selectedPodcast.style,
        religion: selectedPodcast.religion,
        language: normalizeLanguage(selectedPodcast.language) || "en",
        audio_url: selectedPodcast.audio_url,
        script: selectedPodcast.script,
        caption: caption.trim() || null,
      });

      if (error) {
        console.error("Error sharing podcast:", error);
        showThemedAlert(
          "Error",
          "Failed to share podcast globally. Please try again.",
          "error"
        );
      } else {
        showThemedAlert(
          "Success",
          "Your podcast has been shared globally!",
          "success"
        );
        setCaption("");
      }
    } catch (error) {
      console.error("Error sharing podcast:", error);
      showThemedAlert(
        "Error",
        "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPodcast = async (podcast) => {
    if (!podcast.audio_url) {
      showThemedAlert("Error", "No audio file available to download", "error");
      return;
    }

    try {
      setDownloadingPodcastId(podcast.id);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showThemedAlert(
          "Permission Denied",
          "Please grant storage permission to download podcasts",
          "error"
        );
        setDownloadingPodcastId(null);
        return;
      }

      const sanitizedTitle = podcast.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const timestamp = Date.now();
      const fileName = `${sanitizedTitle}_${timestamp}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        podcast.audio_url,
        fileUri,
        {}
      );

      const { uri } = await downloadResumable.downloadAsync();

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Podcasts", asset, false);

      showThemedAlert(
        "Download Complete",
        `${podcast.title} has been saved to your device!`,
        "success"
      );
    } catch (error) {
      console.error("Error downloading podcast:", error);
      showThemedAlert(
        "Download Failed",
        "Unable to download the podcast. Please try again.",
        "error"
      );
    } finally {
      setDownloadingPodcastId(null);
    }
  };

  const handleSharePodcast = async (podcast) => {
    if (!podcast.audio_url) {
      showThemedAlert("Error", "No audio file available to share", "error");
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showThemedAlert(
          "Error",
          "Sharing is not available on this device",
          "error"
        );
        return;
      }

      const sanitizedTitle = podcast.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const fileName = `${sanitizedTitle}.mp3`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        podcast.audio_url,
        fileUri,
        {}
      );

      showThemedAlert(
        "Preparing",
        "Preparing podcast for sharing...",
        "info"
      );

      const { uri } = await downloadResumable.downloadAsync();

      await Sharing.shareAsync(uri, {
        mimeType: "audio/mpeg",
        dialogTitle: `Share: ${podcast.title}`,
        UTI: "public.audio",
      });
    } catch (error) {
      console.error("Error sharing podcast:", error);
      showThemedAlert(
        "Share Failed",
        "Unable to share the podcast. Please try again.",
        "error"
      );
    }
  };

  const SectionHeader = ({ title }) => (
    <View style={{ marginVertical: spacing.md }}>
      <Text
        style={{
          color: "#F5F5F5",
          fontSize: 16,
          fontWeight: "700",
          marginBottom: spacing.xs,
        }}
      >
        {title}
      </Text>
      <LinearGradient
        colors={["#8A2BE2", "#FF69B4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 2, borderRadius: 2 }}
      />
    </View>
  );

  const PodcastCard = ({ podcast }) => {
    const [imageError, setImageError] = useState(false);
    const thumbnailSource = getThumbnailForPodcast(
      podcast.religion,
      podcast.style
    );
    const isDownloading = downloadingPodcastId === podcast.id;

    return (
      <View
        style={{
          backgroundColor: "#0F0F1E",
          marginBottom: 20,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1.5,
          borderColor: "rgba(255, 254, 254, 0.75)",
          shadowColor: "#8A2BE2",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {/* Thumbnail Section */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePlayPodcast(podcast)}
          style={{ position: "relative" }}
        >
          {thumbnailSource && !imageError ? (
            <>
              <Image
                source={thumbnailSource}
                style={{
                  width: "100%",
                  height: 200,
                  backgroundColor: "#1A1A2E",
                }}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(29, 22, 22, 0.35)",
                  borderColor: "rgba(255, 248, 248, 1)",
                  borderBottomWidth: 0.5,
                }}
              />
            </>
          ) : (
            <LinearGradient
              colors={["#8A2BE2", "#FF69B4", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 200,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MaterialIcons name="music-note" size={40} color="#FFF" />
              </View>
              {podcast.religion && (
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 16,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {podcast.religion}
                </Text>
              )}
            </LinearGradient>
          )}

          {/* Play Button Overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: "rgba(138, 43, 226, 0.9)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <MaterialIcons name="play-arrow" size={34} color="#FFF" style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/* Bottom Badges */}
          <View
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {podcast.religion && (
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <MaterialIcons
                  name="book"
                  size={12}
                  color="#FF69B4"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 11,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {podcast.religion}
                </Text>
              </View>
            )}

            {podcast.style && (
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <MaterialIcons
                  name="music-note"
                  size={12}
                  color="#8A2BE2"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 11,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {podcast.style}
                </Text>
              </View>
            )}

            {podcast.language && (
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <MaterialIcons
                  name="language"
                  size={12}
                  color="#007BFF"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 11,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {languageOptions.find(opt => opt.id === podcast.language)?.value || podcast.language}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Content Section */}
        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#F5F5F5",
              marginBottom: 8,
            }}
          >
            {podcast.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <MaterialIcons name="access-time" size={14} color="#888" />
            <Text style={{ color: "#888", fontSize: 13, marginLeft: 6 }}>
              {moment(podcast.date).fromNow()}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "rgba(138, 43, 226, 0.15)",
              marginBottom: 14,
            }}
          />

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, borderRadius: 8, overflow: "hidden" }}
              onPress={() => handlePlayPodcast(podcast)}
            >
              <LinearGradient
                colors={["#8A2BE2", "#FF69B4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: "#ffffff",
                  borderWidth: 0.5,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <MaterialIcons
                  name="play-arrow"
                  size={16}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  Play
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* DELETE INSTEAD OF SHARE WITH FRIENDS */}
            <TouchableOpacity
              style={{ flex: 1, borderRadius: 8, overflow: "hidden" }}
              onPress={() => confirmDelete(podcast)}
            >
              <LinearGradient
                colors={["#FF3B30", "#C70039"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: "#ffffff",
                  borderWidth: 0.5,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={16}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  Delete Podcast
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={{ borderRadius: 8, overflow: "hidden" }}
            onPress={() => handleSharePodcast(podcast)}
          >
            <LinearGradient
              colors={["#FF69B4", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderColor: "#ffffff",
                borderWidth: 0.5,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <MaterialIcons
                name="share"
                size={16}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Share
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
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
          icon: "cancel",
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
    <ImageBackground
      source={require("../assets/background-pattern.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <LinearGradient
          colors={["#8A2BE2", "#FF69B4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: spacing.xl + 10,
            paddingBottom: spacing.md,
            alignItems: "center",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            borderBottomWidth: 1.5,
            borderColor: "rgba(226, 223, 223, 0.75)",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
            My Library
          </Text>
        </LinearGradient>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            margin: spacing.md,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1A1A22",
              borderColor: "#8A2BE2",
              borderWidth: 1.5,
              borderRadius: 8,
              paddingHorizontal: spacing.sm,
              height: 42,
              marginRight: spacing.md,
            }}
          >
            <MaterialIcons
              name="search"
              size={18}
              color="#F5F5F5"
              style={{ marginRight: spacing.sm }}
            />
            <TextInput
              placeholder="Search podcasts here"
              placeholderTextColor="#AAA"
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, color: "#F5F5F5", fontSize: 14 }}
            />
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: "#1A1A22",
              borderRadius: 8,
              borderColor: "#FF69B4",
              borderWidth: 1.5,
              height: 42,
              width: 42,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialIcons name="filter-list" size={18} color="#F5F5F5" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xxl * 2,
          }}
          showsVerticalScrollIndicator={false}
        >
          {podcasts.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: spacing.xl * 2 }}>
              <MaterialIcons
                name="mic-none"
                size={60}
                color="#8A2BE2"
                style={{ marginBottom: spacing.md }}
              />
              <Text
                style={{
                  color: "#F5F5F5",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: spacing.xs,
                }}
              >
                No Podcasts Yet
              </Text>
              <Text
                style={{
                  color: "#AAA",
                  fontSize: 14,
                  textAlign: "center",
                  paddingHorizontal: spacing.xl,
                }}
              >
                Start creating your first podcast to see it here!
              </Text>
            </View>
          ) : filteredPodcasts.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: spacing.xl * 2 }}>
              <MaterialIcons
                name="search"
                size={60}
                color="#FF69B4"
                style={{ marginBottom: spacing.md }}
              />
              <Text
                style={{
                  color: "#F5F5F5",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: spacing.xs,
                }}
              >
                No Matches Found
              </Text>
              <Text
                style={{
                  color: "#AAA",
                  fontSize: 14,
                  textAlign: "center",
                  paddingHorizontal: spacing.xl,
                }}
              >
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            <>
              {grouped.today.length > 0 && (
                <>
                  <SectionHeader title="Today" />
                  {grouped.today.map((p) => (
                    <PodcastCard key={p.id} podcast={p} />
                  ))}
                </>
              )}
              {grouped.yesterday.length > 0 && (
                <>
                  <SectionHeader title="Yesterday" />
                  {grouped.yesterday.map((p) => (
                    <PodcastCard key={p.id} podcast={p} />
                  ))}
                </>
              )}
              {grouped.last7Days.length > 0 && (
                <>
                  <SectionHeader title="Last 7 Days" />
                  {grouped.last7Days.map((p) => (
                    <PodcastCard key={p.id} podcast={p} />
                  ))}
                </>
              )}
              {grouped.older.length > 0 && (
                <>
                  <SectionHeader title="Older" />
                  {grouped.older.map((p) => (
                    <PodcastCard key={p.id} podcast={p} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="none" transparent>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setFilterVisible(false)}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <Animated.View
            style={{
              transform: [{ scale: slideAnim }],
              opacity: fadeAnim,
              width: "100%",
              maxWidth: 420,
              backgroundColor: "#0A0A0F",
              borderRadius: 24,
              shadowColor: "#8c1af7ff",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.8,
              shadowRadius: 24,
              elevation: 20,
              borderWidth: 2,
              borderColor: "rgba(138, 43, 226, 0.5)",
            }}
          >
            <ScrollView
              style={{ maxHeight: 600 }}
              contentContainerStyle={{
                padding: spacing.lg,
                paddingBottom: spacing.xl,
              }}
              showsVerticalScrollIndicator={false}
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
                      color: "#fff",
                      fontSize: 24,
                      fontWeight: "700",
                    }}
                  >
                    Filters
                  </Text>
                  <Text
                    style={{ color: "#AAA", fontSize: 13, marginTop: 2 }}
                  >
                    Refine your search
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setFilterVisible(false)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="close" size={20} color="#F5F5F5" />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  color: "#FF69B4",
                  fontWeight: "700",
                  fontSize: 15,
                  marginBottom: spacing.sm,
                  letterSpacing: 0.5,
                }}
              >
                STYLE
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: spacing.xl,
                }}
              >
                {styleOptions.map((style) => {
                  const isActive = selectedStyle === style;
                  return (
                    <TouchableOpacity
                      key={style}
                      onPress={() =>
                        setSelectedStyle(isActive ? null : style)
                      }
                      style={{
                        marginRight: spacing.sm,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <LinearGradient
                        colors={
                          isActive
                            ? ["#8A2BE2", "#FF69B4"]
                            : [
                                "rgba(255,255,255,0.05)",
                                "rgba(255,255,255,0.05)",
                              ]
                        }
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 18,
                          borderRadius: 24,
                          borderWidth: isActive ? 0 : 1,
                          borderColor: "rgba(138,43,226,0.4)",
                        }}
                      >
                        <Text
                          style={{
                            color: isActive ? "#fff" : "#CCC",
                            fontWeight: isActive ? "700" : "600",
                            fontSize: 14,
                          }}
                        >
                          {style}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={{
                  color: "#FF69B4",
                  fontWeight: "700",
                  fontSize: 15,
                  marginBottom: spacing.sm,
                  letterSpacing: 0.5,
                }}
              >
                RELIGION
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: spacing.xl,
                }}
              >
                {religionOptions.map((religion) => {
                  const isActive = selectedReligion === religion;
                  return (
                    <TouchableOpacity
                      key={religion}
                      onPress={() =>
                        setSelectedReligion(isActive ? null : religion)
                      }
                      style={{
                        marginRight: spacing.sm,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <LinearGradient
                        colors={
                          isActive
                            ? ["#8A2BE2", "#FF69B4"]
                            : [
                                "rgba(255,255,255,0.05)",
                                "rgba(255,255,255,0.05)",
                              ]
                        }
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 18,
                          borderRadius: 24,
                          borderWidth: isActive ? 0 : 1,
                          borderColor: "rgba(138,43,226,0.4)",
                        }}
                      >
                        <Text
                          style={{
                            color: isActive ? "#fff" : "#CCC",
                            fontWeight: isActive ? "700" : "600",
                            fontSize: 14,
                          }}
                        >
                          {religion}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={{
                  color: "#FF69B4",
                  fontWeight: "700",
                  fontSize: 15,
                  marginBottom: spacing.sm,
                  letterSpacing: 0.5,
                }}
              >
                LANGUAGE
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: spacing.xl,
                }}
              >
                {languageOptions.map((language) => {
                  const isActive = selectedLanguage === language.value;
                  return (
                    <TouchableOpacity
                      key={language.id}
                      onPress={() =>
                        setSelectedLanguage(isActive ? null : language.value)
                      }
                      style={{
                        marginRight: spacing.sm,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <LinearGradient
                        colors={
                          isActive
                            ? ["#8A2BE2", "#FF69B4"]
                            : [
                                "rgba(255,255,255,0.05)",
                                "rgba(255,255,255,0.05)",
                              ]
                        }
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 18,
                          borderRadius: 24,
                          borderWidth: isActive ? 0 : 1,
                          borderColor: "rgba(138,43,226,0.4)",
                        }}
                      >
                        <Text
                          style={{
                            color: isActive ? "#fff" : "#CCC",
                            fontWeight: isActive ? "700" : "600",
                            fontSize: 14,
                          }}
                        >
                          {language.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedStyle(null);
                    setSelectedReligion(null);
                    setSelectedLanguage(null);
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#FF69B4",
                    paddingVertical: 14,
                    backgroundColor: "rgba(255,105,180,0.1)",
                  }}
                >
                  <Text
                    style={{
                      color: "#FF69B4",
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Reset All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFilterVisible(false)}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#8A2BE2", "#FF69B4"]}
                    style={{
                      paddingVertical: 14,
                      width: "100%",
                      alignItems: "center",
                      borderRadius: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Apply Filters
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Playback Modal */}
      <Modal
        visible={playbackModalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.lg,
          }}
        >
          <LinearGradient
            colors={["#1A1A2E", "#0F0F1E"]}
            style={{
              width: "100%",
              maxWidth: 400,
              borderRadius: 28,
              padding: spacing.xl * 1.5,
              shadowColor: "#8A2BE2",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.8,
              shadowRadius: 30,
              elevation: 24,
              borderWidth: 1,
              borderColor: "rgba(138,43,226,0.3)",
            }}
          >
            <TouchableOpacity
              onPress={handleCloseModal}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <MaterialIcons name="close" size={22} color="#FF69B4" />
            </TouchableOpacity>

            <View
              style={{
                alignSelf: "center",
                width: 180,
                height: 180,
                borderColor: "rgba(248, 248, 248, 0.99)",
                borderWidth: 2,
                borderRadius: 20,
                marginBottom: spacing.xl,
                overflow: "hidden",
                shadowColor: "#8809ffff",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              {selectedPodcast &&
              getThumbnailForPodcast(
                selectedPodcast.religion,
                selectedPodcast.style
              ) ? (
                <Image
                  source={getThumbnailForPodcast(
                    selectedPodcast.religion,
                    selectedPodcast.style
                  )}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#8A2BE2", "#FF69B4", "#8A2BE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                <MaterialIcons
                  name="music-note"
                  size={64}
                  color="rgba(255,255,255,0.9)"
                />
                </LinearGradient>
              )}
            </View>

            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 20,
                fontWeight: "700",
                marginBottom: spacing.xs,
                textAlign: "center",
              }}
            >
              {selectedPodcast?.title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: spacing.lg,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(138,43,226,0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "#8A2BE2",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {selectedPodcast?.style}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(255,105,180,0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "#FF69B4",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {selectedPodcast?.religion}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(0,123,255,0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "#007BFF",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {languageOptions.find(opt => opt.id === selectedPodcast?.language)?.value || selectedPodcast?.language}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={durationMillis}
                value={positionMillis}
                minimumTrackTintColor="#8A2BE2"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#FF69B4"
                onSlidingComplete={handleSeek}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.lg,
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  color: "#AAA",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {formatTime(positionMillis)}
              </Text>
              <Text
                style={{
                  color: "#AAA",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {formatTime(durationMillis)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 40,
                marginBottom: spacing.lg,
              }}
            >
              <TouchableOpacity
                onPress={handleBackward}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 30,
                  width: 56,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="skip-previous" size={28} color="#FF69B4" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePauseResume}
                style={{
                  borderRadius: 40,
                  overflow: "hidden",
                  shadowColor: "#8A2BE2",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={["#8A2BE2", "#FF69B4"]}
                  style={{
                    width: 72,
                    height: 72,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 40,
                  }}
                >
                  <MaterialIcons
                    name={isPlaying ? "pause" : "play-arrow"}
                    size={36}
                    color="#fff"
                    style={{ marginLeft: isPlaying ? 0 : 3 }}
                  />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForward}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 30,
                  width: 56,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="skip-next" size={28} color="#FF69B4" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleShareGlobally}
              disabled={isSharing}
              style={{
                borderRadius: 14,
                overflow: "hidden",
                opacity: isSharing ? 0.7 : 1,
              }}
            >
              <LinearGradient
                colors={["#FF69B4", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  borderRadius: 14,
                }}
              >
                <MaterialIcons
                  name={isSharing ? "hourglass-empty" : "public"}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {isSharing ? "Sharing..." : "Share Globally"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Caption Modal */}
      <Modal
        visible={captionModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setCaptionModalVisible(false);
              setCaption("");
            }}
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={{
                  backgroundColor: "#0F0F1E",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingTop: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      backgroundColor: "#333",
                      borderRadius: 2,
                    }}
                  />
                </View>

                <ScrollView
                  style={{ maxHeight: 500 }}
                  contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: 32,
                  }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 24,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    Share Globally
                  </Text>
                  <Text
                    style={{
                      color: "#888",
                      fontSize: 14,
                      marginBottom: 24,
                    }}
                  >
                    Add a caption to your podcast
                  </Text>

                  <View
                    style={{
                      backgroundColor: "#1A1A2E",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 24,
                      borderLeftWidth: 3,
                      borderLeftColor: "#8A2BE2",
                    }}
                  >
                    <Text
                      style={{
                        color: "#AAA",
                        fontSize: 12,
                        fontWeight: "600",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Podcast
                    </Text>
                    <Text
                      style={{
                        color: "#FFF",
                        fontWeight: "600",
                        fontSize: 16,
                        lineHeight: 22,
                      }}
                    >
                      {selectedPodcast?.title}
                    </Text>
                  </View>

                  <View style={{ marginBottom: 24 }}>
                    <Text
                      style={{
                        color: "#CCC",
                        fontSize: 14,
                        fontWeight: "600",
                        marginBottom: 10,
                      }}
                    >
                      Caption
                    </Text>
                    <TextInput
                      value={caption}
                      onChangeText={setCaption}
                      placeholder="Write something about this podcast..."
                      placeholderTextColor="#555"
                      multiline
                      maxLength={300}
                      style={{
                        backgroundColor: "#1A1A2E",
                        borderRadius: 12,
                        padding: 16,
                        color: "#FFF",
                        fontSize: 15,
                        minHeight: 120,
                        maxHeight: 180,
                        textAlignVertical: "top",
                        borderWidth: 1,
                        borderColor: "#333",
                      }}
                    />
                    <Text
                      style={{
                        color: caption.length > 270 ? "#FF69B4" : "#666",
                        fontSize: 12,
                        textAlign: "right",
                        marginTop: 8,
                        fontWeight: "600",
                      }}
                    >
                      {caption.length}/300
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setCaptionModalVisible(false);
                        setCaption("");
                      }}
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "#333",
                        paddingVertical: 16,
                        backgroundColor: "#1A1A2E",
                      }}
                    >
                      <Text
                        style={{
                          color: "#CCC",
                          fontWeight: "600",
                          fontSize: 15,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleConfirmShare}
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <LinearGradient
                        colors={["#8A2BE2", "#FF69B4"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 16,
                          alignItems: "center",
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFF",
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          Share
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
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
                <MaterialIcons
                  name={alertStyling.icon}
                  size={48}
                  color={alertStyling.iconColor}
                />
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
    </ImageBackground>
  );
};

export default LibraryScreen;