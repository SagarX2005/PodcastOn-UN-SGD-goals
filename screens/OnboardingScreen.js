import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../UserContext";

const { width, height } = Dimensions.get("window");

const themeColors = {
  background: "#0A0A0F",
  text: "#F5F5F5",
  accentPurple: "#8A2BE2",
  accentPink: "#FF69B4",
};

const OnboardingScreen = ({ navigation }) => {
  const { setOnboardingCompleted } = useUser();
  const [canProceed, setCanProceed] = useState(false);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20; // Reduced tolerance
    if (isAtEnd && !canProceed) {
      setCanProceed(true);
    } else if (!isAtEnd && canProceed) {
      setCanProceed(false); // Reset if scrolled back up
    }
  };

  const handleProceed = async () => {
    if (!canProceed) {
      Alert.alert("Please read all instructions", "Scroll to the bottom to continue.");
      return;
    }

    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      if (setOnboardingCompleted) {
        setOnboardingCompleted(true);
      } else {
        navigation.replace("MainApp");
      }
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      if (setOnboardingCompleted) {
        setOnboardingCompleted(true);
      } else {
        navigation.replace("MainApp");
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[themeColors.accentPurple, themeColors.accentPink]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Feather name="star" size={32} color={themeColors.text} />
          <Text style={styles.title}>Welcome to Resona!</Text>
          <Text style={styles.subtitle}>Let's get you started with a few quick steps</Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Step 1: API Key Setup */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Set Up Your API Key</Text>
          </View>
          <Text style={styles.stepDescription}>
            To generate podcasts, you need an OpenRouter API key. This allows the app to create AI-powered content.
          </Text>

          <View style={styles.instructionList}>
            <View style={styles.instructionItem}>
              <Feather name="external-link" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Visit <Text style={styles.linkText}>openrouter.ai</Text> and sign up for an account
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <Feather name="key" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Get your API key from the dashboard
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <Feather name="settings" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Go to Profile → API Key Management in the app
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <Feather name="check-circle" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Enter your API key and save it
              </Text>
            </View>
          </View>
        </View>

        {/* Step 2: Watch Tutorial */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Watch the Tutorial</Text>
          </View>
          <Text style={styles.stepDescription}>
            Learn how to use all the features of the app with our interactive tutorial.
          </Text>

          <View style={styles.instructionList}>
            <View style={styles.instructionItem}>
              <Feather name="home" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Go to the Dashboard (Home screen)
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <Feather name="play-circle" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Tap the golden "Tutorial" button in the bottom right
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <Feather name="eye" size={20} color="#8A2BE2" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Watch the full tutorial video to learn all features
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesContainer}>
          <Feather name="info" size={24} color="#FFD700" style={styles.notesIcon} />
          <Text style={styles.notesTitle}>Important Notes:</Text>
          <Text style={styles.notesText}>
            • Your API key is stored securely and only used for podcast generation{"\n"}
            • You can change or remove your API key anytime in Profile settings{"\n"}
            • The tutorial is always available if you need to review it later{"\n"}
            • Start creating your first podcast once you're set up!
          </Text>
        </View>

        {/* Spacer to ensure scroll detection */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleProceed}
          disabled={!canProceed}
          style={[
            styles.proceedButton,
            { opacity: canProceed ? 1 : 0.5 }
          ]}
        >
          <LinearGradient
            colors={canProceed ? ["#FFD700", "#FFA500"] : ["#666", "#999"]}
            style={styles.proceedButtonGradient}
          >
            <Text style={styles.proceedButtonText}>
              {canProceed ? "Get Started!" : "Scroll to Continue"}
            </Text>
            <Feather name="arrow-right" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  gradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: "#8A2BE2",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 6,
    borderBottomWidth: 1.5,
    borderColor: "rgba(226,226,226,0.6)",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: themeColors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(245,245,245,0.8)",
    textAlign: "center",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  stepContainer: {
    backgroundColor: "rgba(138,43,226,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(138,43,226,0.3)",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.accentPink,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "800",
    color: themeColors.text,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.text,
  },
  stepDescription: {
    fontSize: 14,
    color: "rgba(245,245,245,0.9)",
    lineHeight: 20,
    marginBottom: 16,
  },
  instructionList: {
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  instructionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 20,
    flex: 1,
  },
  linkText: {
    color: themeColors.accentPink,
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: "rgba(255,215,0,0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  notesIcon: {
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFD700",
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 22,
  },
  spacer: {
    height: 50,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: themeColors.background,
    borderTopWidth: 1,
    borderTopColor: "rgba(138,43,226,0.2)",
  },
  proceedButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  proceedButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
});

export default OnboardingScreen;
