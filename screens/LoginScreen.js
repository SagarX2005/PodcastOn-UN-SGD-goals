import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import globalStyles, { spacing } from "../styles/globalStyles";
import { supabase } from "../supabase";
import ThemedAlert from "../components/ThemedAlert";
import { useUser } from "../UserContext";

const LoginScreen = ({ navigation }) => {
  const { updateUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👀 toggle state

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", message: "" });

  const showAlert = (title, message) => {
    setAlertContent({ title, message });
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      showAlert("Login Failed", error.message);
    } else if (data?.user) {
      updateUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || "User",
      });
    }
  };

  return (
    <>
      <ImageBackground
        source={require("../assets/background-pattern.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
          {/* Header matches Signup */}
          <LinearGradient
            colors={["#8A2BE2", "#FF69B4"]}
            style={{
              paddingTop: 70,
              paddingBottom: spacing.xl,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              alignItems: "center",
              shadowColor: "#8A2BE2",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 6,
              borderBottomWidth: 2,
              borderColor: "rgba(226, 223, 223, 0.75)",
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "rgba(255,255,255,0.15)",
                marginBottom: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="mic" size={28} color="#fff" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "#F5F5F5" }}>
              Interfaith SDG
            </Text>
            <Text style={{ fontSize: 23, fontWeight: "bold", color: "#F5F5F5" }}>
              Podcast Generator
            </Text>
          </LinearGradient>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
                <LinearGradient
                  colors={["#1A1A20", "#0A0A0F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 22,
                    padding: spacing.lg,
                    borderWidth: 1.5,
                    borderColor: "rgba(138,43,226,0.4)",
                    shadowColor: "#8A2BE2",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#F5F5F5",
                      fontSize: 26,
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: spacing.sm,
                    }}
                  >
                    Welcome Back
                  </Text>
                  <Text
                    style={{
                      color: "rgba(245,245,245,0.7)",
                      textAlign: "center",
                      marginBottom: spacing.xl,
                      fontSize: 15,
                    }}
                  >
                    Sign in to continue
                  </Text>

                  {/* Email */}
                  <View
                    style={[
                      globalStyles.inputContainer,
                      { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={20}
                      color="rgba(245,245,245,0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        globalStyles.textInput,
                        {
                          flex: 1,
                          borderRadius: 12,
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "#F5F5F5",
                        },
                        emailFocused && { borderColor: "#FF69B4", borderWidth: 1.5 },
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(245,245,245,0.4)"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password with Eye Toggle 👀 */}
                  <View
                    style={[
                      globalStyles.inputContainer,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: spacing.md,
                      },
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={20}
                      color="rgba(245,245,245,0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        globalStyles.textInput,
                        {
                          flex: 1,
                          borderRadius: 12,
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "#F5F5F5",
                          paddingRight: 35, // space for eye icon
                        },
                        passwordFocused && { borderColor: "#8A2BE2", borderWidth: 1.5 },
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(245,245,245,0.4)"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={{ position: "absolute", right: 10 }}
                    >
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(245,245,245,0.7)"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLogin}
                    style={{ marginTop: spacing.lg }}
                  >
                    <LinearGradient
                      colors={["#8A2BE2", "#FF69B4"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        shadowColor: "#FF69B4",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.6,
                        shadowRadius: 12,
                        elevation: 5,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                        {loading ? "Signing In..." : "Sign In"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Signup link */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Signup")}
                    style={{ marginTop: spacing.md }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 15,
                        color: "#FFF",
                        fontWeight: "600",
                      }}
                    >
                      Don’t have an account?{" "}
                      <Text
                        style={{
                          textDecorationLine: "underline",
                          color: "#8A2BE2",
                        }}
                      >
                        Create One
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>

      {/* Custom Alert */}
      <ThemedAlert
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
};

export default LoginScreen;
