import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated, 
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import moment from 'moment';
import { getThumbnailForPodcast } from '../../utils/thumbnailMapping';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import { createNotification } from '../../utils/notifications';

const { width } = Dimensions.get('window');

const GlobalPodcastCard = ({
  podcast,
  currentUserId,
  onPlayPodcast,
}) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(podcast.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(
    podcast.comments_count || 0
  );
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageError, setImageError] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const thumbnailSource = getThumbnailForPodcast(
    podcast.religion,
    podcast.style
  );

  useEffect(() => {
    checkIfLiked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcast.id, currentUserId]);

  const checkIfLiked = async () => {
    try {
      const { data } = await supabase
        .from('global_podcast_likes')
        .select('id')
        .eq('global_podcast_id', podcast.id)
        .eq('user_id', currentUserId)
        .single();

      setLiked(!!data);
    } catch (error) {
      setLiked(false);
    }
  };

  const handleLike = useCallback(async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const wasLiked = liked;
    const previousCount = likesCount;
    setLiked(!wasLiked);
    setLikesCount(
      wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1
    );

    try {
      if (wasLiked) {
        await supabase
          .from('global_podcast_likes')
          .delete()
          .eq('global_podcast_id', podcast.id)
          .eq('user_id', currentUserId);

        await supabase
          .from('global_podcasts')
          .update({ likes_count: Math.max(0, previousCount - 1) })
          .eq('id', podcast.id);
      } else {
        await supabase.from('global_podcast_likes').insert({
          global_podcast_id: podcast.id,
          user_id: currentUserId,
        });

        await supabase
          .from('global_podcasts')
          .update({ likes_count: previousCount + 1 })
          .eq('id', podcast.id);

        // Create notification for the podcast owner
        if (podcast.user_id !== currentUserId) {
          await createNotification(
            podcast.user_id,
            currentUserId,
            'global_podcast_like',
            null,
            podcast.id,
            { podcast_title: podcast.title }
          );
        }
      }
    } catch (error) {
      setLiked(wasLiked);
      setLikesCount(previousCount);
      Alert.alert('Error', 'Failed to update like');
    }
  }, [liked, likesCount, podcast.id, currentUserId, scaleAnim]);

  const fetchComments = useCallback(async () => {
    try {
      setLoadingComments(true);

      const { data: commentsData, error: commentsError } = await supabase
        .from('global_podcast_comments')
        .select('*')
        .eq('global_podcast_id', podcast.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Comments Error:', commentsError);
        throw commentsError;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(commentsData.map((c) => c.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles Error:', profilesError);
      }

      const commentsWithProfiles = commentsData.map((comment) => ({
        ...comment,
        profiles: profiles?.find((p) => p.id === comment.user_id) || null,
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Fetch comments error:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [podcast.id]);

  const handleCommentPress = useCallback(async () => {
    setShowComments(true);
    await fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    setSubmittingComment(true);
    setNewComment('');

    try {
      const { data: insertedComment, error: insertError } = await supabase
        .from('global_podcast_comments')
        .insert({
          global_podcast_id: podcast.id,
          user_id: currentUserId,
          comment_text: commentText,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw insertError;
      }

      const newCount = commentsCount + 1;
      setCommentsCount(newCount);

      await supabase
        .from('global_podcasts')
        .update({ comments_count: newCount })
        .eq('id', podcast.id);

      // Create notification for the podcast owner
      if (podcast.user_id !== currentUserId) {
        await createNotification(
          podcast.user_id,
          currentUserId,
          'global_podcast_comment',
          null,
          podcast.id,
          { podcast_title: podcast.title, comment_text: commentText }
        );
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', currentUserId)
        .single();

      const newCommentWithProfile = {
        ...insertedComment,
        profiles: userProfile || null,
      };

      setComments((prevComments) => [
        newCommentWithProfile,
        ...prevComments,
      ]);
    } catch (error) {
      console.error('Submit comment error:', error);
      Alert.alert('Error', 'Failed to post comment');
      setNewComment(commentText);
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, podcast.id, currentUserId, commentsCount]);

  const handleCloseComments = () => {
    setShowComments(false);
    setNewComment('');
  };

  return (
    <>
      <View
        style={{
          backgroundColor: '#0F0F1E',
          marginHorizontal: 0,
          marginBottom: 24,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.76)',
          shadowColor: '#8A2BE2',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: '#5d306660',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(221, 209, 209, 0.83)',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              overflow: 'hidden',
              marginRight: 12,
              borderWidth: 2,
              borderColor: '#8A2BE2',
            }}
          >
            {podcast.profiles?.avatar_url ? (
              <Image
                source={{ uri: podcast.profiles.avatar_url }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <LinearGradient
                colors={['#8A2BE2', '#FF69B4']}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#FFF',
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  {podcast.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#FFF',
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 2,
              }}
            >
              {podcast.profiles?.full_name || 'Unknown User'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="schedule" size={12} color="#888" />
              <Text
                style={{
                  color: '#888',
                  fontSize: 12,
                  marginLeft: 4,
                }}
              >
                {moment(podcast.shared_at).fromNow()}
              </Text>
            </View>
          </View>
        </View>

        {/* Audio Player + Thumbnail */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onPlayPodcast(podcast)}
          style={{ position: 'relative' }}
        >
          {thumbnailSource && !imageError ? (
            <>
              <Image
                source={thumbnailSource}
                style={{
                  width: '100%',
                  height: 220,
                  backgroundColor: '#1A1A2E',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 1)',
                }}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                }}
              />
            </>
          ) : (
            <LinearGradient
              colors={['#8A2BE2', '#FF69B4', '#8A2BE2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 220,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <MaterialIcons name="music-note" size={40} color="#FFF" />
              </View>
              {podcast.religion && (
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 16,
                    fontWeight: '600',
                    textTransform: 'capitalize',
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
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(138, 43, 226, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <MaterialIcons
                name="play-arrow"
                size={38}
                color="#FFF"
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>

          {/* Bottom Badges */}
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {podcast.religion && (
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <MaterialIcons
                  name="menu-book"
                  size={12}
                  color="#FF69B4"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {podcast.religion}
                </Text>
              </View>
            )}

            {podcast.style && (
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
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
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {podcast.style}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={{ padding: 18 }}>
          <Text
            style={{
              color: '#FFF',
              fontSize: 19,
              fontWeight: '700',
              marginBottom: 10,
            }}
          >
            {podcast.title}
          </Text>

          {podcast.caption && (
            <Text
              style={{
                color: '#CCC',
                fontSize: 15,
                marginBottom: 14,
              }}
            >
              {podcast.caption}
            </Text>
          )}

          {(podcast.language || podcast.style || podcast.religion) && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              {podcast.language && (
                <View
                  style={{
                    backgroundColor: 'rgba(0, 229, 255, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 229, 255, 0.4)',
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: '#00E5FF',
                      fontSize: 13,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {podcast.language}
                  </Text>
                </View>
              )}
              {podcast.style && (
                <View
                  style={{
                    backgroundColor: 'rgba(138, 43, 226, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(138, 43, 226, 0.4)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="music-note"
                    size={14}
                    color="#8A2BE2"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color: '#8A2BE2',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {podcast.style}
                  </Text>
                </View>
              )}

              {podcast.religion && (
                <View
                  style={{
                    backgroundColor: 'rgba(255, 105, 180, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 105, 180, 0.4)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="menu-book"
                    size={14}
                    color="#FF69B4"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color: '#FF69B4',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {podcast.religion}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(138, 43, 226, 0.15)',
              marginBottom: 14,
            }}
          />

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={handleLike}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 28,
              }}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <MaterialIcons
                  name={liked ? 'favorite' : 'favorite-border'}
                  size={28}
                  color={liked ? '#FF69B4' : '#AAA'}
                />
              </Animated.View>

              {likesCount > 0 && (
                <Text
                  style={{
                    color: liked ? '#FF69B4' : '#AAA',
                    marginLeft: 8,
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  {likesCount}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCommentPress}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 28,
              }}
            >
              <Feather name="message-circle" size={26} color="#AAA" />
              {commentsCount > 0 && (
                <Text
                  style={{
                    color: '#AAA',
                    marginLeft: 8,
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  {commentsCount}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {commentsCount > 0 && (
            <TouchableOpacity
              onPress={handleCommentPress}
              activeOpacity={0.7}
              style={{ marginTop: 14 }}
            >
              <Text
                style={{
                  color: '#8A2BE2',
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                View all {commentsCount} comment
                {commentsCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* COMMENTS MODAL */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={handleCloseComments}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            }}
          >
            {/* Tap to close area */}
            <TouchableOpacity
              style={{ flex: 0.25 }}
              activeOpacity={1}
              onPress={handleCloseComments}
            />

            {/* Modal Content */}
            <View
              style={{
                flex: 0.75,
                backgroundColor: '#0F0F1E',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(138, 43, 226, 0.2)',
                }}
              >
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 18,
                    fontWeight: '700',
                  }}
                >
                  Comments {commentsCount > 0 ? `${commentsCount}` : ''}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseComments}
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                >
                  <MaterialIcons name="close" size={28} color="#AAA" />
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {loadingComments ? (
                  <View
                    style={{
                      paddingVertical: 40,
                      alignItems: 'center',
                    }}
                  >
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text
                      style={{
                        color: '#666',
                        marginTop: 12,
                        fontSize: 14,
                      }}
                    >
                      Loading comments...
                    </Text>
                  </View>
                ) : comments.length === 0 ? (
                  <View
                    style={{
                      alignItems: 'center',
                      paddingVertical: 60,
                    }}
                  >
                    <MaterialIcons
                      name="chat-bubble-outline"
                      size={60}
                      color="#444"
                    />
                    <Text
                      style={{
                        color: '#FFF',
                        fontSize: 16,
                        fontWeight: '700',
                        marginTop: 16,
                      }}
                    >
                      No comments yet
                    </Text>
                    <Text
                      style={{
                        color: '#888',
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      Be the first to comment!
                    </Text>
                  </View>
                ) : (
                  comments.map((comment) => (
                    <View
                      key={comment.id}
                      style={{
                        flexDirection: 'row',
                        marginBottom: 20,
                        paddingBottom: 16,
                        borderBottomWidth: 1,
                        borderBottomColor:
                          'rgba(138, 43, 226, 0.1)',
                      }}
                    >
                      {/* Avatar */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          overflow: 'hidden',
                          marginRight: 12,
                          borderWidth: 2,
                          borderColor: '#8A2BE2',
                        }}
                      >
                        {comment.profiles?.avatar_url ? (
                          <Image
                            source={{
                              uri: comment.profiles.avatar_url,
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        ) : (
                          <LinearGradient
                            colors={['#8A2BE2', '#FF69B4']}
                            style={{
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#FFF',
                                fontWeight: '700',
                                fontSize: 16,
                              }}
                            >
                              {comment.profiles?.full_name?.[0]
                                ?.toUpperCase() || 'U'}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>

                      {/* Comment Content */}
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFF',
                              fontWeight: '700',
                              fontSize: 15,
                              marginRight: 8,
                            }}
                          >
                            {comment.profiles?.full_name ||
                              'Unknown User'}
                          </Text>
                          <Text
                            style={{
                              color: '#666',
                              fontSize: 12,
                            }}
                          >
                            {moment(comment.created_at).fromNow()}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: '#DDD',
                            fontSize: 14,
                            lineHeight: 20,
                          }}
                        >
                          {comment.comment_text}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Input Area */}
              <View
                style={{
                  backgroundColor: '#1A1A2E',
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(138, 43, 226, 0.3)',
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: Platform.OS === 'ios' ? 34 : 16,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  {/* User Avatar placeholder */}
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(138, 43, 226, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      marginBottom: 4,
                    }}
                  >
                    <Feather name="user" size={20} color="#8A2BE2" />
                  </View>

                  {/* Input Container */}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                    }}
                  >
                    <TextInput
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="Add a comment..."
                      placeholderTextColor="#666"
                      multiline
                      maxLength={500}
                      editable={!submittingComment}
                      style={{
                        flex: 1,
                        color: '#FFF',
                        fontSize: 14,
                        backgroundColor: '#0F0F1E',
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        maxHeight: 100,
                        borderWidth: 1,
                        borderColor: newComment.trim()
                          ? 'rgba(138, 43, 226, 0.5)'
                          : 'rgba(138, 43, 226, 0.2)',
                        marginRight: 8,
                      }}
                    />

                    {/* Send Button */}
                    <TouchableOpacity
                      onPress={handleSubmitComment}
                      disabled={
                        !newComment.trim() || submittingComment
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          newComment.trim() && !submittingComment
                            ? '#8A2BE2'
                            : '#333',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4,
                      }}
                    >
                      {submittingComment ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Feather
                          name="send"
                          size={18}
                          color={
                            newComment.trim() ? '#FFF' : '#666'
                          }
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

// PLAYBACK MODAL COMPONENT
const PlaybackModal = ({
  visible,
  onClose,
  isPlaying,
  onPauseResume,
  onForward,
  onBackward,
  positionMillis,
  durationMillis,
  onSeek,
  podcast,
  formatTime,
}) => {
  if (!podcast) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <LinearGradient
        colors={['#0A0A0F', '#150018', '#0A0A0F']}
        style={{
          flex: 1,
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingHorizontal: 20,
        }}
      >
        <StatusBar barStyle="light-content" />

        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            alignSelf: 'flex-end',
            padding: 8,
            marginBottom: 20,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="keyboard-arrow-down" size={36} color="#fff" />
        </TouchableOpacity>

        {/* Artwork */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View
            style={{
              width: width * 0.75,
              height: width * 0.75,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: 'rgba(138,43,226,0.6)',
              shadowColor: '#8A2BE2',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Image
              source={getThumbnailForPodcast(podcast?.religion, podcast?.style)}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Title & Creator */}
        <View style={{ alignItems: 'center', marginTop: 32, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {podcast?.title || 'Untitled'}
          </Text>

          <Text
            style={{
              color: '#ccc',
              fontSize: 16,
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            {podcast?.profiles?.full_name || 'Unknown Creator'}
          </Text>

          {/* Badges */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {podcast?.religion && (
              <View
                style={{
                  backgroundColor: 'rgba(255, 105, 180, 0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 105, 180, 0.4)',
                }}
              >
                <Text
                  style={{
                    color: '#FF69B4',
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {podcast.religion}
                </Text>
              </View>
            )}
            {podcast?.style && (
              <View
                style={{
                  backgroundColor: 'rgba(138, 43, 226, 0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(138, 43, 226, 0.4)',
                }}
              >
                <Text
                  style={{
                    color: '#8A2BE2',
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {podcast.style}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Slider */}
        <View style={{ marginTop: 40, paddingHorizontal: 10 }}>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={durationMillis || 1}
            value={positionMillis}
            onSlidingComplete={onSeek}
            minimumTrackTintColor="#8A2BE2"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '600' }}>
              {formatTime(positionMillis)}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '600' }}>
              {formatTime(durationMillis)}
            </Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            marginTop: 50,
            paddingHorizontal: 20,
          }}
        >
          {/* Backward 10s */}
          <TouchableOpacity
            onPress={onBackward}
            activeOpacity={0.7}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(138, 43, 226, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(138, 43, 226, 0.4)',
            }}
          >
            <MaterialIcons name="replay-10" size={32} color="#8A2BE2" />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={onPauseResume}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#8A2BE2', '#FF69B4']}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                shadowColor: '#8A2BE2',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={48}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Forward 10s */}
          <TouchableOpacity
            onPress={onForward}
            activeOpacity={0.7}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(138, 43, 226, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(138, 43, 226, 0.4)',
            }}
          >
            <MaterialIcons name="forward-10" size={32} color="#8A2BE2" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const FeedTab = ({ currentUserId }) => {
  const [globalPodcasts, setGlobalPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('latest');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [languageReady, setLanguageReady] = useState(false);

  // Playback states
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [playbackModalVisible, setPlaybackModalVisible] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const fetchPreferredLanguage = useCallback(async () => {
    if (!currentUserId) {
      setPreferredLanguage('en');
      setLanguageReady(true);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.error('Error fetching preferred language:', error);
        setPreferredLanguage('en');
      } else {
        setPreferredLanguage(profile?.preferred_language || 'en');
      }
    } catch (error) {
      console.error('Error fetching preferred language:', error);
      setPreferredLanguage('en');
    }
    setLanguageReady(true);
  }, [currentUserId]);

  const fetchLatestPodcasts = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      const { data: podcasts, error: podcastsError } = await supabase
        .from('global_podcasts')
        .select('*')
        .order('shared_at', { ascending: false })
        .limit(20);

      if (podcastsError) {
        console.error('Podcasts Error:', podcastsError);
        throw podcastsError;
      }

      if (!podcasts || podcasts.length === 0) {
        setGlobalPodcasts([]);
        return;
      }

      const podcastIds = podcasts.map((p) => p.id);

      const { data: likesData, error: likesError } = await supabase
        .from('global_podcast_likes')
        .select('global_podcast_id')
        .in('global_podcast_id', podcastIds);

      if (likesError) {
        console.error('Likes Error:', likesError);
      }

      const likesCountMap = {};
      likesData?.forEach((like) => {
        likesCountMap[like.global_podcast_id] =
          (likesCountMap[like.global_podcast_id] || 0) + 1;
      });

      const { data: commentsData, error: commentsError } = await supabase
        .from('global_podcast_comments')
        .select('global_podcast_id')
        .in('global_podcast_id', podcastIds);

      if (commentsError) {
        console.error('Comments Error:', commentsError);
      }

      const commentsCountMap = {};
      commentsData?.forEach((comment) => {
        commentsCountMap[comment.global_podcast_id] =
          (commentsCountMap[comment.global_podcast_id] || 0) + 1;
      });

      const userIds = [...new Set(podcasts.map((p) => p.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles Error:', profilesError);
      }

      const podcastsWithProfiles = podcasts.map((podcast) => ({
        ...podcast,
        likes_count: likesCountMap[podcast.id] || 0,
        comments_count: commentsCountMap[podcast.id] || 0,
        profiles: profiles?.find((p) => p.id === podcast.user_id) || null,
      }));

      setGlobalPodcasts(podcastsWithProfiles);
    } catch (error) {
      console.error('Fetch latest error:', error);
      Alert.alert('Error', 'Failed to load podcasts');
    } finally {
      setLoading(false);
    }
  }, [preferredLanguage]);

  const fetchRecommendedPodcasts = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      const { data: recommendedPodcasts, error: rpcError } = await supabase.rpc(
        'get_smart_recommended_podcasts',
        {
          p_user_id: currentUserId,
          p_limit: 25,
        }
      );

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        await fetchLatestPodcasts();
        return;
      }

      if (!recommendedPodcasts || recommendedPodcasts.length === 0) {
        await fetchLatestPodcasts();
        return;
      }

      const podcastIds = recommendedPodcasts.map((p) => p.id);

      const { data: likesData, error: likesError } = await supabase
        .from('global_podcast_likes')
        .select('global_podcast_id')
        .in('global_podcast_id', podcastIds);

      if (likesError) {
        console.error('Likes Error:', likesError);
      }

      const likesCountMap = {};
      likesData?.forEach((like) => {
        likesCountMap[like.global_podcast_id] =
          (likesCountMap[like.global_podcast_id] || 0) + 1;
      });

      const { data: commentsData, error: commentsError } = await supabase
        .from('global_podcast_comments')
        .select('global_podcast_id')
        .in('global_podcast_id', podcastIds);

      if (commentsError) {
        console.error('Comments Error:', commentsError);
      }

      const commentsCountMap = {};
      commentsData?.forEach((comment) => {
        commentsCountMap[comment.global_podcast_id] =
          (commentsCountMap[comment.global_podcast_id] || 0) + 1;
      });

      const userIds = [...new Set(recommendedPodcasts.map((p) => p.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles Error:', profilesError);
      }

      const podcastsWithProfiles = recommendedPodcasts.map((podcast) => ({
        ...podcast,
        likes_count: likesCountMap[podcast.id] || 0,
        comments_count: commentsCountMap[podcast.id] || 0,
        profiles: profiles?.find((p) => p.id === podcast.user_id) || null,
      }));

      setGlobalPodcasts(podcastsWithProfiles);
    } catch (error) {
      console.error('Fetch recommended error:', error);
      await fetchLatestPodcasts();
    } finally {
      setLoading(false);
    }
  }, [currentUserId, fetchLatestPodcasts]);

  const loadPodcasts = useCallback(async () => {
    if (viewMode === 'recommended') {
      await fetchRecommendedPodcasts();
    } else {
      await fetchLatestPodcasts();
    }
  }, [viewMode, fetchLatestPodcasts, fetchRecommendedPodcasts]);

  useEffect(() => {
    if (!currentUserId) return;

    fetchPreferredLanguage();
  }, [currentUserId, fetchPreferredLanguage]);

  useEffect(() => {
    if (languageReady) {
      loadPodcasts();
    }
  }, [languageReady, loadPodcasts]);

  // Cleanup audio when component unmounts or screen loses focus
  useFocusEffect(
    useCallback(() => {
      // Only cleanup on blur, don't reload
      return () => {
        if (currentSound) {
          currentSound.stopAsync().catch(() => {});
          currentSound.unloadAsync().catch(() => {});
          setCurrentSound(null);
          setIsPlaying(false);
          setPlaybackModalVisible(false);
        }
      };
    }, [currentSound])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPodcasts();
    setRefreshing(false);
  }, [loadPodcasts]);

  // PLAYBACK FUNCTIONS
  const handlePlayPodcast = async (podcast) => {
    if (!podcast.audio_url) {
      Alert.alert('Please Wait', 'This podcast is still being generated.');
      return;
    }

    try {
      // Stop and cleanup existing sound
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: podcast.audio_url },
        { shouldPlay: true }
      );

      setSelectedPodcast(podcast);
      setPlaybackModalVisible(true);
      setCurrentSound(sound);
      setIsPlaying(true);
      setPositionMillis(0);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis);
          setDurationMillis(status.durationMillis || 1);
          setIsPlaying(status.isPlaying);

          // Reset when playback finishes
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPositionMillis(0);
          }
        }
      });
    } catch (error) {
      console.error('Error playing podcast:', error);
      Alert.alert('Playback Error', 'Unable to play the podcast.');
    }
  };

  const handlePauseResume = async () => {
    if (!currentSound) return;
    try {
      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        await currentSound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleSeek = async (value) => {
    if (!currentSound) return;
    try {
      await currentSound.setPositionAsync(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleForward = async () => {
    if (!currentSound) return;
    try {
      let newPos = positionMillis + 10000;
      if (newPos > durationMillis) newPos = durationMillis;
      await currentSound.setPositionAsync(newPos);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const handleBackward = async () => {
    if (!currentSound) return;
    try {
      let newPos = positionMillis - 10000;
      if (newPos < 0) newPos = 0;
      await currentSound.setPositionAsync(newPos);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const handleCloseModal = async () => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }
    } catch (error) {
      console.error('Error closing modal:', error);
    } finally {
      setPlaybackModalVisible(false);
      setCurrentSound(null);
      setSelectedPodcast(null);
      setPositionMillis(0);
      setDurationMillis(1);
      setIsPlaying(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0F',
        }}
      >
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={{ color: '#AAA', marginTop: 12 }}>
          {viewMode === 'recommended'
            ? 'Finding best podcasts for you...'
            : 'Loading podcasts...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      {/* Toggle Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: '#0A0A0F',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#1A1A2E',
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: 'rgba(138, 43, 226, 0.3)',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setGlobalPodcasts([]);
              setLoading(true);
              setViewMode('latest');
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: viewMode === 'latest' ? '#8A2BE2' : 'transparent',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Feather
              name="clock"
              size={16}
              color={viewMode === 'latest' ? '#FFF' : '#AAA'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: viewMode === 'latest' ? '#FFF' : '#AAA',
                fontWeight: viewMode === 'latest' ? '700' : '600',
                fontSize: 15,
              }}
            >
              Latest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setGlobalPodcasts([]);
              setViewMode('recommended');
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor:
                viewMode === 'recommended' ? '#8A2BE2' : 'transparent',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={viewMode === 'recommended' ? '#FFF' : '#AAA'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: viewMode === 'recommended' ? '#FFF' : '#AAA',
                fontWeight: viewMode === 'recommended' ? '700' : '600',
                fontSize: 15,
              }}
            >
              For You
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {!globalPodcasts || globalPodcasts.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons
            name={viewMode === 'recommended' ? 'sparkles' : 'globe'}
            size={60}
            color="#8A2BE2"
          />
          <Text
            style={{
              fontSize: 18,
              color: '#FFF',
              fontWeight: '700',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            {viewMode === 'recommended' ? 'Building Your Feed' : 'No Podcasts Yet'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#AAA',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {viewMode === 'recommended'
              ? 'Like and comment on podcasts to get personalized recommendations!'
              : 'Be the first to share a podcast!'}
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8A2BE2"
              colors={['#8A2BE2']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 32,
          }}
          style={{ flex: 1 }}
        >
          {globalPodcasts.map((podcast) => (
            <GlobalPodcastCard
              key={podcast.id}
              podcast={podcast}
              currentUserId={currentUserId}
              onPlayPodcast={handlePlayPodcast}
            />
          ))}
        </ScrollView>
      )}

      <PlaybackModal
        visible={playbackModalVisible}
        onClose={handleCloseModal}
        podcast={selectedPodcast}
        isPlaying={isPlaying}
        onPauseResume={handlePauseResume}
        onForward={handleForward}
        onBackward={handleBackward}
        positionMillis={positionMillis}
        durationMillis={durationMillis}
        onSeek={handleSeek}
        formatTime={formatTime}
      />
    </View>
  );
};

export default FeedTab; 