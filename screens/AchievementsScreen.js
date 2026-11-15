// screens/AchievementsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { spacing } from "../styles/globalStyles";

const { width } = Dimensions.get("window");

const AchievementsScreen = ({ route, navigation }) => {
  const { achievements, stats } = route.params;
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Group achievements by category
  const categories = ["All", ...new Set(achievements.map(a => a.category))];
  
  const filteredAchievements = selectedCategory === "All" 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  const CategoryTab = ({ category, isActive }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(category)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={isActive ? ["#8A2BE2", "#FF69B4"] : ["#1A1A20", "#1A1A20"]}
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: 20,
          marginRight: spacing.sm,
          borderWidth: isActive ? 0 : 1,
          borderColor: "#333",
        }}
      >
        <Text
          style={{
            color: isActive ? "#fff" : "#AAA",
            fontWeight: isActive ? "700" : "500",
            fontSize: 14,
          }}
        >
          {category}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const AchievementCard = ({ achievement }) => {
    const isUnlocked = achievement.unlocked;
    const progressPercent = Math.min((achievement.progress / achievement.target) * 100, 100);

    return (
      <View
        style={{
          marginBottom: spacing.lg,
        }}
      >
        <LinearGradient
          colors={isUnlocked ? ["#1A1A20", "#0A0A0F"] : ["#0F0F13", "#0A0A0F"]}
          style={{
            borderRadius: 16,
            padding: spacing.lg,
            shadowColor: isUnlocked ? achievement.color : "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isUnlocked ? 0.4 : 0.2,
            shadowRadius: 12,
            elevation: isUnlocked ? 8 : 4,
            borderWidth: 1.5,
            borderColor: isUnlocked ? `${achievement.color}80` : "#1A1A20",
            opacity: isUnlocked ? 1 : 0.6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {/* Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: isUnlocked ? `${achievement.color}30` : "#1A1A20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: spacing.md,
                borderWidth: 2,
                borderColor: isUnlocked ? achievement.color : "#333",
              }}
            >
              {isUnlocked ? (
                <Feather name={achievement.icon} size={32} color={achievement.color} />
              ) : (
                <Feather name="lock" size={32} color="#555" />
              )}
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isUnlocked ? "#F5F5F5" : "#777",
                    flex: 1,
                  }}
                >
                  {achievement.name}
                </Text>
                {isUnlocked && (
                  <View
                    style={{
                      backgroundColor: `${achievement.color}30`,
                      borderRadius: 12,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      marginLeft: spacing.sm,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "700", color: achievement.color }}>
                      UNLOCKED
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: 13,
                  color: isUnlocked ? "#AAA" : "#555",
                  marginBottom: spacing.md,
                  lineHeight: 18,
                }}
              >
                {achievement.description}
              </Text>

              {/* Progress Bar */}
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: isUnlocked ? "#888" : "#555", fontWeight: "600" }}>
                    Progress
                  </Text>
                  <Text style={{ fontSize: 11, color: isUnlocked ? "#F5F5F5" : "#777", fontWeight: "700" }}>
                    {achievement.progress} / {achievement.target}
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#1A1A20",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={isUnlocked ? [achievement.color, achievement.color] : ["#333", "#333"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>

              {/* Category Badge */}
              <View style={{ marginTop: spacing.sm }}>
                <Text style={{ fontSize: 10, color: "#666", fontWeight: "600" }}>
                  {achievement.category}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      {/* Header */}
      <LinearGradient
        colors={["#8A2BE2", "#FF69B4"]}
        style={{
          paddingTop: 60,
          paddingBottom: spacing.xl,
          paddingHorizontal: spacing.lg,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          shadowColor: "#8A2BE2",
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: spacing.md,
            }}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>
              Achievements
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
              Track your progress
            </Text>
          </View>
          <Feather name="award" size={32} color="#FFD700" />
        </View>

        {/* Overall Progress */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
              Overall Completion
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFD700" }}>
              {completionPercentage}%
            </Text>
          </View>
          <View style={{ height: 10, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 5, overflow: "hidden" }}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: "100%",
                width: `${completionPercentage}%`,
                borderRadius: 5,
              }}
            />
          </View>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: spacing.xs }}>
            {unlockedCount} of {totalCount} achievements unlocked
          </Text>
        </View>
      </LinearGradient>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
        }}
      >
        {categories.map((category) => (
          <CategoryTab
            key={category}
            category={category}
            isActive={selectedCategory === category}
          />
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Stats Summary for Selected Category */}
        {selectedCategory !== "All" && (
          <View style={{ marginBottom: spacing.lg }}>
            <LinearGradient
              colors={["#1A1A20", "#0A0A0F"]}
              style={{
                borderRadius: 16,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: "#333",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#F5F5F5", marginBottom: spacing.sm }}>
                {selectedCategory} Progress
              </Text>
              <Text style={{ fontSize: 13, color: "#AAA" }}>
                {filteredAchievements.filter(a => a.unlocked).length} of {filteredAchievements.length} unlocked
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Achievement Cards */}
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
            <Feather name="inbox" size={64} color="#333" style={{ marginBottom: spacing.lg }} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#777", marginBottom: spacing.sm }}>
              No Achievements Found
            </Text>
            <Text style={{ fontSize: 14, color: "#555", textAlign: "center" }}>
              Try selecting a different category
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AchievementsScreen;