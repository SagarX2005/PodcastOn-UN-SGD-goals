import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, StatusBar, Text, Dimensions, Animated } from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Use a base design dimensions (e.g., iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Calculate scaling factors
const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(scaleWidth, scaleHeight);

// Responsive size function
const normalize = (size) => Math.round(size * scale);

export default function LandingScreen() {
  // Animation references
  const linesReveal = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;
  const screenFadeOut = useRef(new Animated.Value(1)).current;

  // Typewriter state
  const [typewriterText, setTypewriterText] = useState("");
  const fullSubtitle = "An AI Powered\nInterfaith SDG Podcast Generator";

  useEffect(() => {
    startAnimationSequence();
  }, []);

  const startAnimationSequence = () => {
    Animated.parallel([
      Animated.timing(linesReveal, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 45,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(gradientOpacity, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: false,
      }).start(() => {
        startTypewriterEffect();
      });
    });
  };

  const startTypewriterEffect = () => {
    let charIndex = 0;
    const typeSpeed = 90;

    const typeInterval = setInterval(() => {
      if (charIndex <= fullSubtitle.length) {
        setTypewriterText(fullSubtitle.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          startFadeOutTransition();
        }, 5000);
      }
    }, typeSpeed);
  };

  const startFadeOutTransition = () => {
    Animated.timing(screenFadeOut, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" translucent />

      <Animated.View style={[styles.container, { opacity: screenFadeOut }]}>
        {/* Top-left diagonal line */}
        <AnimatedLine
          position={{ 
            top: SCREEN_HEIGHT * 0.25, 
            left: -SCREEN_WIDTH * 0.3 
          }}
          colors={["rgba(137, 43, 226, 1)", "transparent"]}
          gradientStart={{ x: 0, y: 0 }}
          gradientEnd={{ x: 1, y: 1 }}
          revealDirection="leftToRight"
          animationValue={linesReveal}
        />

        {/* Bottom-right diagonal line */}
        <AnimatedLine
          position={{ 
            bottom: SCREEN_HEIGHT * 0.28, 
            right: -SCREEN_WIDTH * 0.3 
          }}
          colors={["rgba(255, 105, 180, 1)", "transparent"]}
          gradientStart={{ x: 1, y: 0 }}
          gradientEnd={{ x: 0, y: 1 }}
          revealDirection="rightToLeft"
          animationValue={linesReveal}
        />

        {/* Top-left gradient fill */}
        <Animated.View
          style={[
            styles.gradientFill,
            {
              top: -SCREEN_HEIGHT * 1.01,
              left: -SCREEN_WIDTH * 0.8,
              opacity: gradientOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(137, 43, 226, 0.95)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.fillArea,
              {
                width: SCREEN_WIDTH * 2,
                height: SCREEN_HEIGHT * 1.5,
                transform: [{ rotate: "45deg" }],
              },
            ]}
          />
        </Animated.View>

        {/* Bottom-right gradient fill */}
        <Animated.View
          style={[
            styles.gradientFill,
            {
              bottom: -SCREEN_HEIGHT * 0.98,
              right: -SCREEN_WIDTH * 0.8,
              opacity: gradientOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,105,180,0.9)", "transparent"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.fillArea,
              {
                width: SCREEN_WIDTH * 2,
                height: SCREEN_HEIGHT * 1.5,
                transform: [{ rotate: "45deg" }],
              },
            ]}
          />
        </Animated.View>

        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <LottieView
            source={require("../assets/animations/resona.json")}
            autoPlay
            loop={false}
            style={{
              width: normalize(1000),
              height: normalize(500),
            }}
            speed={0.3}
          />
        </Animated.View>

        {/* Subtitle Text */}
        <Text style={styles.subtitle}>{typewriterText}</Text>
      </Animated.View>
    </>
  );
}

const AnimatedLine = ({ position, colors, gradientStart, gradientEnd, revealDirection, animationValue }) => {
  const translateX =
    revealDirection === "leftToRight"
      ? animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SCREEN_WIDTH * 1.5],
        })
      : animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SCREEN_WIDTH * 1.5],
        });

  return (
    <View style={[styles.lineContainer, position]}>
      <LinearGradient 
        colors={colors} 
        start={gradientStart} 
        end={gradientEnd} 
        style={styles.diagonalLine} 
      />
      <Animated.View style={[styles.revealMask, { transform: [{ translateX }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: normalize(60),
  },
  lineContainer: {
    position: "absolute",
    width: SCREEN_WIDTH * 1.5,
    height: normalize(3),
    transform: [{ rotate: "-45deg" }],
    overflow: "hidden",
  },
  diagonalLine: {
    width: "100%",
    height: "100%",
  },
  revealMask: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#0A0A0F",
  },
  gradientFill: {
    position: "absolute",
  },
  fillArea: {
    opacity: 0.3,
  },
  logoContainer: {
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: normalize(15) },
    shadowOpacity: 0.7,
    shadowRadius: normalize(25),
    elevation: 30,
  },
  subtitle: {
    position: "absolute",
    bottom: normalize(40),
    textAlign: "center",
    fontSize: normalize(17),
    fontWeight: "700",
    color: "#F5F5F5",
    textShadowColor: "#8A2BE2",
    textShadowOffset: { width: 0, height: normalize(2) },
    textShadowRadius: normalize(15),
    letterSpacing: 0.5,
    lineHeight: normalize(28),
    minHeight: normalize(60),
    paddingHorizontal: normalize(20),
  },
});