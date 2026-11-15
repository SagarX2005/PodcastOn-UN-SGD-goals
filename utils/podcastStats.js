// utils/podcastStats.js
// This file contains reusable functions to calculate podcast statistics

import moment from "moment";
import { supabase } from "../supabase";

/**
 * Fetch all podcasts for a specific user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of podcasts
 */
export const fetchUserPodcasts = async (userId) => {
  const { data, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching podcasts:", error);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    style: p.style || "Unknown",
    religion: p.religion || "N/A",
    audio_url: p.audio_url,
    date: p.created_at,
  }));
};

/**
 * Calculate comprehensive podcast statistics
 * @param {Array} podcasts - Array of podcast objects
 * @returns {Object} Statistics object with all counts and breakdowns
 */
export const calculatePodcastStats = (podcasts) => {
  // Basic counts
  const totalPodcasts = podcasts.length;
  const completedPodcasts = podcasts.filter(p => p.audio_url).length;
  const pendingPodcasts = totalPodcasts - completedPodcasts;

  // Time-based statistics
  const today = moment().startOf("day");
  const yesterday = moment().subtract(1, "days").startOf("day");
  const thisWeekStart = moment().startOf('week');
  const thisMonthStart = moment().startOf('month');
  const last7Days = moment().subtract(7, "days").startOf("day");
  const last30Days = moment().subtract(30, "days").startOf("day");

  const todayPodcasts = podcasts.filter(p => moment(p.date).isSame(today, "d")).length;
  const yesterdayPodcasts = podcasts.filter(p => moment(p.date).isSame(yesterday, "d")).length;
  const thisWeekPodcasts = podcasts.filter(p => moment(p.date).isAfter(thisWeekStart)).length;
  const thisMonthPodcasts = podcasts.filter(p => moment(p.date).isAfter(thisMonthStart)).length;
  const last7DaysPodcasts = podcasts.filter(p => moment(p.date).isAfter(last7Days)).length;
  const last30DaysPodcasts = podcasts.filter(p => moment(p.date).isAfter(last30Days)).length;

  // Style statistics
  const styleOptions = ["Conversational", "Educational", "Storytelling", "Motivational", "Spiritual", "Humorous"];
  const styleStats = {};
  styleOptions.forEach(style => {
    styleStats[style] = podcasts.filter(p => p.style === style).length;
  });
  const mostUsedStyle = Object.keys(styleStats).reduce((a, b) => styleStats[a] > styleStats[b] ? a : b, styleOptions[0]);

  // Religion statistics
  const religionOptions = ["Christianity", "Islam", "Hinduism", "Buddhism", "Sikhism", "Judaism", "Other"];
  const religionStats = {};
  religionOptions.forEach(religion => {
    religionStats[religion] = podcasts.filter(p => p.religion === religion).length;
  });
  const mostUsedReligion = Object.keys(religionStats).reduce((a, b) => religionStats[a] > religionStats[b] ? a : b, religionOptions[0]);

  // Podcasts without religion preference
  const noReligionPodcasts = podcasts.filter(p => p.religion === "N/A" || !p.religion).length;

  // Average podcasts per week (based on total time span)
  let averagePerWeek = 0;
  if (totalPodcasts > 0) {
    const oldestPodcast = podcasts[podcasts.length - 1];
    const newestPodcast = podcasts[0];
    const daysSinceFirst = moment(newestPodcast.date).diff(moment(oldestPodcast.date), 'days');
    const weeksSinceFirst = Math.max(daysSinceFirst / 7, 1);
    averagePerWeek = (totalPodcasts / weeksSinceFirst).toFixed(1);
  }

  return {
    // Overview
    totalPodcasts,
    completedPodcasts,
    pendingPodcasts,
    completionRate: totalPodcasts > 0 ? ((completedPodcasts / totalPodcasts) * 100).toFixed(1) : 0,

    // Time-based
    todayPodcasts,
    yesterdayPodcasts,
    thisWeekPodcasts,
    thisMonthPodcasts,
    last7DaysPodcasts,
    last30DaysPodcasts,
    averagePerWeek: parseFloat(averagePerWeek),

    // Style breakdown
    styleStats,
    mostUsedStyle,
    totalStyles: Object.values(styleStats).filter(count => count > 0).length,

    // Religion breakdown
    religionStats,
    mostUsedReligion,
    noReligionPodcasts,
    totalReligions: Object.values(religionStats).filter(count => count > 0).length,
  };
};

/**
 * Get quick stats summary (for dashboard widgets)
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Quick stats object
 */
export const getQuickStats = async (userId) => {
  const podcasts = await fetchUserPodcasts(userId);
  const stats = calculatePodcastStats(podcasts);

  return {
    total: stats.totalPodcasts,
    thisWeek: stats.thisWeekPodcasts,
    thisMonth: stats.thisMonthPodcasts,
    completed: stats.completedPodcasts,
    pending: stats.pendingPodcasts,
  };
};

/**
 * Get detailed stats for analytics page
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Full statistics object
 */
export const getDetailedStats = async (userId) => {
  const podcasts = await fetchUserPodcasts(userId);
  return calculatePodcastStats(podcasts);
};

/**
 * Get growth trend data (for charts)
 * @param {Array} podcasts - Array of podcast objects
 * @returns {Object} Trend data grouped by date
 */
export const getGrowthTrend = (podcasts) => {
  const last30DaysStart = moment().subtract(30, "days").startOf("day");
  const recentPodcasts = podcasts.filter(p => moment(p.date).isAfter(last30DaysStart));

  // Group by date
  const trendData = {};
  for (let i = 29; i >= 0; i--) {
    const date = moment().subtract(i, "days").format("MMM DD");
    trendData[date] = 0;
  }

  recentPodcasts.forEach(podcast => {
    const date = moment(podcast.date).format("MMM DD");
    if (trendData[date] !== undefined) {
      trendData[date]++;
    }
  });

  return trendData;
};

// Example usage in your Statistics Screen:
/*
import { getDetailedStats, getQuickStats, getGrowthTrend, fetchUserPodcasts } from '../utils/podcastStats';

// In your component:
const [stats, setStats] = useState(null);

useEffect(() => {
  const loadStats = async () => {
    const userId = userRef.current;
    const detailedStats = await getDetailedStats(userId);
    setStats(detailedStats);
  };
  loadStats();
}, []);

// Then use stats in your JSX:
<Text>Total Podcasts: {stats?.totalPodcasts}</Text>
<Text>This Week: {stats?.thisWeekPodcasts}</Text>
<Text>Completion Rate: {stats?.completionRate}%</Text>
<Text>Most Used Style: {stats?.mostUsedStyle}</Text>
*/