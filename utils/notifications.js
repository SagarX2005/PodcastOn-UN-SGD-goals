import { supabase } from '../supabase';

export const createNotification = async (
  user_id,
  sender_id,
  type,
  related_podcast_id = null,
  related_global_podcast_id = null,
  metadata = {}
) => {
  try {
    // Don't create notification for self-actions (except achievements)
    if (user_id === sender_id && type !== 'achievement_unlocked') {
      return;
    }

    // Fetch sender's full name
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sender_id)
      .single();

    if (senderError) {
      console.error('Error fetching sender profile:', senderError);
      return;
    }

    const senderName = senderProfile?.full_name || 'Someone';

    // Generate message based on type
    let message = '';
    let title = '';

    switch (type) {
      case 'global_podcast_like':
      case 'podcast_like':
        title = metadata.podcast_title || 'your podcast';
        message = `${senderName} liked your podcast "${title}"`;
        break;
      case 'global_podcast_comment':
      case 'podcast_comment':
        const commentPreview = metadata.comment_text
          ? metadata.comment_text.substring(0, 50) + (metadata.comment_text.length > 50 ? '...' : '')
          : 'your podcast';
        message = `${senderName} commented: "${commentPreview}"`;
        break;
      case 'achievement_unlocked':
        message = `🎉 Achievement Unlocked: ${metadata.achievement_name}!`;
        break;
      default:
        message = 'You have a new notification';
    }

    // Insert notification
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        sender_id,
        type,
        message,
        related_podcast_id,
        related_global_podcast_id,
        related_achievement_id: metadata.achievement_id || null,
        metadata: metadata,
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating notification:', insertError);
    } else {
      console.log('Notification created successfully:', type);
    }
  } catch (error) {
    console.error('Error in createNotification:', error);
  }
};
