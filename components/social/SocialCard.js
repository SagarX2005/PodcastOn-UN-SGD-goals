import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing } from '../../styles/globalStyles';
import { supabase } from '../../supabase';
import moment from 'moment';

export const AppCard = ({ children, style }) => (
  <LinearGradient
    colors={['#1A1A20', '#0A0A0F']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
      {
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(138,43,226,0.2)',
      },
      style,
    ]}
  >
    {children}
  </LinearGradient>
);

export const TabButton = ({ active, icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: active ? '#FF69B4' : 'transparent',
    }}
  >
    <MaterialIcons name={icon} size={22} color={active ? '#fffafcff' : '#666'} />
    <Text style={{
      fontSize: 11,
      fontWeight: active ? '700' : '500',
      color: active ? '#fffafcff' : '#666',
      marginTop: 4,
    }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const FriendCard = ({ friend, onPress, onRemove, showRemove = false }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <AppCard>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {friend.profile_pic || friend.avatar_url ? (
          <Image
            source={{ uri: friend.profile_pic || friend.avatar_url }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 2,
              borderColor: '#8A2BE2',
            }}
          />
        ) : (
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(138,43,226,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#8A2BE2',
          }}>
            <MaterialIcons name="person" size={24} color="#8A2BE2" />
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#F5F5F5' }}>
            {friend.full_name || 'User'}
          </Text>
          <Text style={{ fontSize: 13, color: '#AAA', marginTop: 2 }}>
            {friend.email}
          </Text>
          {friend.status && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
            }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: friend.status === 'accepted' ? '#4CAF50' : '#FF9800',
                marginRight: 6,
              }} />
              <Text style={{ fontSize: 11, color: '#AAA', textTransform: 'capitalize' }}>
                {friend.status}
              </Text>
            </View>
          )}
        </View>

        {showRemove ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRemove && onRemove();
            }}
            style={{
              backgroundColor: 'rgba(244,67,54,0.2)',
              borderRadius: 20,
              padding: 8,
              borderWidth: 1,
              borderColor: '#F44336',
            }}
          >
            <MaterialIcons name="person-remove" size={18} color="#F44336" />
          </TouchableOpacity>
        ) : (
          <MaterialIcons name="chevron-forward" size={20} color="#666" />
        )}
      </View>
    </AppCard>
  </TouchableOpacity>
);

export const PodcastFeedCard = ({ podcast, onLike, onComment, onShare, currentUserId }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('podcast_comments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('podcast_id', podcast.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data);
    }
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const { error } = await supabase
      .from('podcast_comments')
      .insert({
        podcast_id: podcast.id,
        user_id: currentUserId,
        comment_text: commentText.trim(),
      });

    if (!error) {
      setCommentText('');
      fetchComments();
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  return (
    <AppCard>
      {/* User Info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {podcast.user?.raw_user_meta_data?.avatar_url ? (
          <Image
            source={{ uri: podcast.user.raw_user_meta_data.avatar_url }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(138,43,226,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialIcons name="person" size={20} color="#8A2BE2" />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#F5F5F5' }}>
            {podcast.user?.raw_user_meta_data?.full_name || 'User'}
          </Text>
          <Text style={{ fontSize: 11, color: '#AAA' }}>
            {moment(podcast.created_at).fromNow()}
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="more-horiz" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Podcast Content */}
      <View style={{
        backgroundColor: 'rgba(138,43,226,0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialIcons name="mic" size={18} color="#FF69B4" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#F5F5F5', marginLeft: 8 }}>
            {podcast.title || 'Untitled Podcast'}
          </Text>
        </View>
        {podcast.style && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="music-note" size={14} color="#8A2BE2" />
            <Text style={{ fontSize: 12, color: '#AAA', marginLeft: 6 }}>
              Style: {podcast.style}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
      }}>
        <TouchableOpacity
          onPress={() => onLike(podcast.id)}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <MaterialIcons
            name={podcast.user_liked ? "favorite" : "favorite-border"}
            size={20}
            color={podcast.user_liked ? "#FF69B4" : "#666"}
          />
          <Text style={{
            fontSize: 13,
            color: podcast.user_liked ? "#FF69B4" : "#666",
            marginLeft: 6,
            fontWeight: '600',
          }}>
            {podcast.likes_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <MaterialIcons name="chat" size={20} color="#666" />
          <Text style={{ fontSize: 13, color: "#666", marginLeft: 6, fontWeight: '600' }}>
            {podcast.comments_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onShare(podcast)}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <MaterialIcons name="share" size={20} color="#666" />
          <Text style={{ fontSize: 13, color: "#666", marginLeft: 6, fontWeight: '600' }}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                color: '#F5F5F5',
                fontSize: 13,
              }}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              style={{
                marginLeft: 8,
                backgroundColor: '#8A2BE2',
                borderRadius: 20,
                padding: 8,
              }}
            >
              <MaterialIcons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {loadingComments ? (
            <ActivityIndicator size="small" color="#8A2BE2" />
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F5F5F5' }}>
                    {comment.user?.raw_user_meta_data?.full_name || 'User'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>
                    {moment(comment.created_at).fromNow()}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#CCC', marginTop: 4 }}>
                  {comment.comment_text}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </AppCard>
  );
};