// App.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,                     // <-- NEW IMPORT
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { UserProvider, useUser } from "./UserContext";
import { navigationRef } from "./navigationRef";
import NetworkGuard from "./components/NetworkGuard";
import { supabase } from "./supabase";   // <-- Already imported above

// Screens
import LandingScreen from "./screens/LandingScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import PodcastGeneratorScreen from "./screens/PodcastGeneratorScreen";
import LibraryScreen from "./screens/LibraryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SocialsScreen from "./screens/SocialsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AboutScreen from "./screens/AboutScreen";
import FAQScreen from "./screens/FAQScreen";
import ContactSupportScreen from "./screens/ContactSupportScreen";
import TermsScreen from "./screens/TermsScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import AchievementsScreen from "./screens/AchievementsScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ApiKeyManagementScreen from "./screens/ApiKeyManagementScreen";
import OnboardingScreen from "./screens/OnboardingScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

const themeColors = {
  background: "#0A0A0F",
  text: "#F5F5F5",
  accentPurple: "#8A2BE2",
  accentPink: "#FF69B4",
};

// --------------------- NOTIFICATION BADGE -----------------------
function NotificationBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -10,
        backgroundColor: "#FF3B30",
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        zIndex: 99,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>{count}</Text>
    </View>
  );
}

// --------------------- CUSTOM TAB BAR ---------------------------
function CollapsibleTabBar({ state, descriptors, navigation, unreadCount }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedWidth = useRef(new Animated.Value(80)).current;
  const animatedHeight = useRef(new Animated.Value(60)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    if (isExpanded) {
      Animated.parallel([
        Animated.timing(animatedWidth, { toValue: 80, duration: 300, useNativeDriver: false }),
        Animated.timing(animatedHeight, { toValue: 60, duration: 300, useNativeDriver: false }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start(() => setIsExpanded(false));
    } else {
      setIsExpanded(true);
      Animated.parallel([
        Animated.timing(animatedWidth, { toValue: width - 32, duration: 300, useNativeDriver: false }),
        Animated.timing(animatedHeight, { toValue: 80, duration: 300, useNativeDriver: false }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      ]).start();
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <>
      {isExpanded && (
        <TouchableWithoutFeedback onPress={toggleExpanded}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          width: animatedWidth,
          height: animatedHeight,
          zIndex: 1000,
        }}
      >
        <LinearGradient
          colors={[themeColors.accentPurple, themeColors.accentPink]}
          style={{
            flex: 1,
            borderRadius: 30,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: isExpanded ? 16 : 0,
          }}
        >
          <TouchableOpacity onPress={toggleExpanded} style={{ width: isExpanded ? 48 : 80, height: isExpanded ? 48 : 60, alignItems: "center", justifyContent: "center", position: 'relative' }}>
            {/* Red Badge Dot - Only show when collapsed and has unread */}
            {!isExpanded && unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 12,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#FF3B30",
                  zIndex: 10,
                }}
              />
            )}

            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Feather name="menu" size={isExpanded ? 24 : 28} color={themeColors.text} />
            </Animated.View>
            {!isExpanded && <Text style={{ fontSize: 10, color: themeColors.text, marginTop: 2 }}>Menu</Text>}
          </TouchableOpacity>

          {isExpanded && (
            <Animated.View style={{ flex: 1, flexDirection: "row", opacity: opacityAnim, marginLeft: 8 }}>
              {state.routes.map((route, index) => {
                const focused = state.index === index;
                const { options } = descriptors[route.key];
                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={() => {
                      navigation.navigate(route.name);
                      toggleExpanded();
                    }}
                    style={{ flex: 1, alignItems: "center" }}
                  >
                    <View style={{ position: 'relative' }}>
                      {options.tabBarIcon &&
                        options.tabBarIcon({
                          focused,
                          color: focused ? themeColors.text : "rgba(245,245,245,0.7)",
                          size: focused ? 24 : 20,
                        })}
                      {route.name === "Notifications" && unreadCount > 0 && (
                        <NotificationBadge count={unreadCount} />
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: focused ? themeColors.text : "rgba(245,245,245,0.7)" }}>
                      {options.tabBarLabel || route.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
    </>
  );
}

// --------------------- MAIN TABS ----------------------------------
function MainTabs() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("read", false);
      setUnread(data?.length || 0);
    };

    loadNotifications();

    const channel = supabase
      .channel("realtime_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        payload => {
          console.log("🔔 New notification received:", payload.new);
          setUnread(prev => prev + 1);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={(props) => <CollapsibleTabBar {...props} unreadCount={unread} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: "Home", tabBarIcon: ({ size, color }) => <Feather name="home" size={size} color={color} /> }} />
      <Tab.Screen name="PodcastGenerator" component={PodcastGeneratorScreen} options={{ tabBarLabel: "Generate", tabBarIcon: ({ size, color }) => <Feather name="mic" size={size} color={color} /> }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: "Library", tabBarIcon: ({ size, color }) => <Feather name="book" size={size} color={color} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: "Alerts", tabBarIcon: ({ size, color }) => <Feather name="bell" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Profile", tabBarIcon: ({ size, color }) => <Feather name="user" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

// --------------------- APP NAVIGATOR ------------------------------
function AppNavigator() {
  const { user, loading, onboardingCompleted, setOnboardingCompleted } = useUser();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLanding(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        try {
          const completed = await AsyncStorage.getItem("onboardingCompleted");
          setOnboardingCompleted(completed === "true");
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          setOnboardingCompleted(false);
        }
      } else {
        setOnboardingCompleted(false);
      }
    };

    checkOnboarding();
  }, [user]);

  // ---------------- REALTIME POPUP NOTIFICATIONS ----------------
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new;
          Alert.alert("🔔 Notification", n.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <LinearGradient colors={[themeColors.accentPurple, themeColors.accentPink]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>Loading…</Text>
      </LinearGradient>
    );
  }

  console.log("Navigation state:", { showLanding, user: !!user, onboardingCompleted });

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: themeColors.background },
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      }}
    >
      {showLanding ? (
        <Stack.Screen name="Landing" component={LandingScreen} />
      ) : user ? (
        onboardingCompleted ? (
          <Stack.Screen name="MainApp" component={MainTabs} options={{ gestureEnabled: false }} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}

      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="PodcastGenerator" component={PodcastGeneratorScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Socials" component={SocialsScreen} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="ApiKeyManagement" component={ApiKeyManagementScreen} />
    </Stack.Navigator>
  );
}

// --------------------- MAIN EXPORT ------------------------------
export default function App() {
  return (
    <UserProvider>
      <NetworkGuard>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" backgroundColor={themeColors.background} />
          <AppNavigator />
        </NavigationContainer>
      </NetworkGuard>
    </UserProvider>
  );
}
