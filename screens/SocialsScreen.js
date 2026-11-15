import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../styles/globalStyles';
import { useUser } from '../UserContext';
import { supabase } from '../supabase';

// Import Tab Components
import { TabButton } from '../components/social/SocialCard';
import FeedTab from '../components/social/FeedTab';
import FriendsTab from '../components/social/FriendsTab';
import DiscoverTab from '../components/social/DiscoverTab';

const SocialsScreen = ({ navigation }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [feedPodcasts, setFeedPodcasts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchFeed();
    } else if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab]);

  const initializeData = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      setCurrentUserId(user.id);
      fetchFeed();
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await fetchFeed();
    } else if (activeTab === 'friends') {
      await fetchFriends();
    }
    setRefreshing(false);
  };

  const fetchFeed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id, user_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const friendIds = friendships?.map(f =>
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        setFeedPodcasts([]);
        return;
      }

      const { data: podcasts, error } = await supabase
        .from('podcasts')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && podcasts) {
        const podcastsWithCounts = await Promise.all(
          podcasts.map(async (podcast) => {
            const { count: likesCount } = await supabase
              .from('podcast_reactions')
              .select('*', { count: 'exact', head: true })
              .eq('podcast_id', podcast.id);

            const { count: commentsCount } = await supabase
              .from('podcast_comments')
              .select('*', { count: 'exact', head: true })
              .eq('podcast_id', podcast.id);

            const { data: userLike } = await supabase
              .from('podcast_reactions')
              .select('*')
              .eq('podcast_id', podcast.id)
              .eq('user_id', user.id)
              .single();

            return {
              ...podcast,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              user_liked: !!userLike,
            };
          })
        );

        setFeedPodcasts(podcastsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendships) {
        const userIds = new Set();
        friendships.forEach(f => {
          if (f.user_id !== user.id) userIds.add(f.user_id);
          if (f.friend_id !== user.id) userIds.add(f.friend_id);
        });

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(userIds));

        const profileMap = {};
        profiles?.forEach(p => {
          profileMap[p.id] = p;
        });

        const acceptedFriends = friendships
          .filter(f => f.status === 'accepted')
          .map(f => {
            const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
            const profile = profileMap[friendId];
            return {
              id: friendId,
              friendship_id: f.id,
              full_name: profile?.full_name,
              email: profile?.email,
              profile_pic: profile?.avatar_url,
              avatar_url: profile?.avatar_url,
              status: 'accepted',
            };
          });

        const pendingRequests = friendships
          .filter(f => f.status === 'pending' && f.friend_id === user.id)
          .map(f => {
            const profile = profileMap[f.user_id];
            return {
              id: f.user_id,
              friendship_id: f.id,
              full_name: profile?.full_name,
              email: profile?.email,
              profile_pic: profile?.avatar_url,
              avatar_url: profile?.avatar_url,
              status: 'pending',
            };
          });

        const sentRequestsList = friendships
          .filter(f => f.status === 'pending' && f.user_id === user.id)
          .map(f => {
            const profile = profileMap[f.friend_id];
            return {
              id: f.friend_id,
              friendship_id: f.id,
              full_name: profile?.full_name,
              email: profile?.email,
              profile_pic: profile?.avatar_url,
              avatar_url: profile?.avatar_url,
              status: 'pending',
            };
          });

        setFriends(acceptedFriends);
        setFriendRequests(pendingRequests);
        setSentRequests(sentRequestsList);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          {/* HEADER */}
          <LinearGradient
            colors={['#8A2BE2', '#FF69B4']}
            style={{
              paddingTop: 60,
              paddingBottom: 20,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            }}
          >
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 }}>
                Social
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                Connect with friends and share podcasts
              </Text>
            </View>

            {/* Tabs */}
            <View style={{
              flexDirection: 'row',
              marginTop: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              marginHorizontal: spacing.lg,
              borderRadius: 12,
              padding: 4,
            }}>
              <TabButton
                active={activeTab === 'feed'}
                icon="newspaper"
                label="Feed"
                onPress={() => setActiveTab('feed')}
              />
              <TabButton
                active={activeTab === 'friends'}
                icon="people"
                label="Friends"
                onPress={() => setActiveTab('friends')}
              />
              <TabButton
                active={activeTab === 'discover'}
                icon="search"
                label="Discover"
                onPress={() => setActiveTab('discover')}
              />
            </View>
          </LinearGradient>

          {/* CONTENT */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl * 2,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8A2BE2"
                colors={['#8A2BE2', '#FF69B4']}
              />
            }
          >
            {/* Render Active Tab */}
            {activeTab === 'feed' && (
              <FeedTab
                loading={loading}
                feedPodcasts={feedPodcasts}
                currentUserId={currentUserId}
                onRefresh={fetchFeed}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsTab
                friends={friends}
                friendRequests={friendRequests}
                sentRequests={sentRequests}
                onRefresh={fetchFriends}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverTab
                friends={friends}
                friendRequests={friendRequests}
                sentRequests={sentRequests}
                onRefresh={fetchFriends}
              />
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default SocialsScreen;