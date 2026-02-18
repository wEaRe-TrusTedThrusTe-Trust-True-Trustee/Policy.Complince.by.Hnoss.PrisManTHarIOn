// src/services/commentService.ts
// 🛡️ Ghost-Proof Comment Service - Repository Pattern

import { supabase, isUserBanned } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { 
  UrlComment, 
  NewUrlComment, 
  CommentWithProfile 
} from '@/types/supabase';

/**
 * Comment Service - Clean Code Architecture
 * All comment-related operations go through this service
 */
export const commentService = {
  /**
   * Get all comments for a specific URL with user profiles
   */
  async getCommentsByUrl(urlId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('url_comments')
      .select(`
        *,
        user_profiles (
          id,
          display_name,
          avatar_url,
          reputation_score,
          is_verified,
          is_moderator
        )
      `)
      .eq('url_id', urlId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🚨 Error fetching comments:', error.message);
      throw new Error(`Failed to load comments: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get comment thread (parent + replies)
   */
  async getCommentThread(parentCommentId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('url_comments')
      .select(`
        *,
        user_profiles (
          id,
          display_name,
          avatar_url,
          reputation_score,
          is_verified,
          is_moderator
        )
      `)
      .eq('parent_comment_id', parentCommentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('🚨 Error fetching replies:', error.message);
      throw new Error(`Failed to load replies: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Create a new comment
   * @throws Error if user is banned or validation fails
   */
  async createComment(comment: NewUrlComment): Promise<UrlComment> {
    // Ghost-Buster: Validate user is not banned
    const isBanned = await isUserBanned(comment.user_id);
    if (isBanned) {
      throw new Error('❌ You are banned from commenting');
    }

    // Ghost-Buster: Validate comment text
    const text = comment.comment_text.trim();
    if (text.length === 0) {
      throw new Error('❌ Comment cannot be empty');
    }
    if (text.length > 2000) {
      throw new Error('❌ Comment exceeds maximum length (2000 characters)');
    }

    // Ghost-Buster: Check for spam patterns
    const spamPatterns = [
      /viagra/i,
      /cryptocurrency/i,
      /click here/i,
      /buy now/i
    ];

    if (spamPatterns.some(pattern => pattern.test(text))) {
      throw new Error('❌ Comment contains spam patterns');
    }

    // Insert comment with explicit typing
    type CommentInsert = Database['public']['Tables']['url_comments']['Insert'];
    const commentData: CommentInsert = {
      ...comment,
      comment_text: text
    };
    
    const { data, error } = await supabase
      .from('url_comments')
      .insert(commentData as Database['public']['Tables']['url_comments']['Insert'])
      .select()
      .single();

    if (error) {
      console.error('🚨 Error creating comment:', error.message);
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    // Update URL metadata
    await this.updateUrlMetadata(comment.url_id);

    return data;
  },

  /**
   * Update existing comment (within 15 minute edit window)
   */
  async updateComment(
    commentId: string, 
    userId: string, 
    newText: string
  ): Promise<UrlComment> {
    // Ghost-Buster: Validate text
    const text = newText.trim();
    if (text.length === 0 || text.length > 2000) {
      throw new Error('❌ Invalid comment text');
    }

    // Transform: Explicit typing for update
    type CommentUpdate = Database['public']['Tables']['url_comments']['Update'];
    const updateData: CommentUpdate = {
      comment_text: text,
      is_edited: true
    };
    
    const { data, error } = await supabase
      .from('url_comments')
      // @ts-expect-error: Supabase type inference limitation - type is correct at runtime
      .update(updateData as Database['public']['Tables']['url_comments']['Update'])
      .eq('id', commentId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('❌ Comment not found or edit window expired (15 minutes)');
      }
      console.error('🚨 Error updating comment:', error.message);
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    return data;
  },

  /**
   * Soft-delete comment (user can delete own comment)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Transform: Explicit typing for soft-delete
    type CommentUpdate = Database['public']['Tables']['url_comments']['Update'];
    const deleteData: CommentUpdate = {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      comment_text: '[Deleted]'
    };
    
    const { error } = await supabase
      .from('url_comments')
      // @ts-expect-error: Supabase type inference limitation - type is correct at runtime
      .update(deleteData as Database['public']['Tables']['url_comments']['Update'])
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('🚨 Error deleting comment:', error.message);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  },

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    // Transform: Explicit typing for like insert
    type LikeInsert = Database['public']['Tables']['comment_likes']['Insert'];
    const likeData: LikeInsert = {
      comment_id: commentId,
      user_id: userId
    };
    
    const { error } = await supabase
      .from('comment_likes')
      .insert(likeData as Database['public']['Tables']['comment_likes']['Insert']);

    if (error) {
      if (error.code === '23505') {
        // Duplicate key - already liked
        throw new Error('❌ You already liked this comment');
      }
      console.error('🚨 Error liking comment:', error.message);
      throw new Error(`Failed to like comment: ${error.message}`);
    }
  },

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('🚨 Error unliking comment:', error.message);
      throw new Error(`Failed to unlike comment: ${error.message}`);
    }
  },

  /**
   * Check if user liked a comment
   */
  async hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('🚨 Error checking like status:', error.message);
      return false;
    }

    return !!data;
  },

  /**
   * Get comment like count
   */
  async getCommentLikeCount(commentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (error) {
      console.error('🚨 Error getting like count:', error.message);
      return 0;
    }

    return count || 0;
  },

  /**
   * Update URL metadata after comment activity
   */
  async updateUrlMetadata(urlId: string): Promise<void> {
    const { count } = await supabase
      .from('url_comments')
      .select('*', { count: 'exact', head: true })
      .eq('url_id', urlId)
      .eq('is_deleted', false);

    // Transform: Explicit typing for metadata upsert
    type MetadataInsert = Database['public']['Tables']['url_metadata']['Insert'];
    const metadataData: MetadataInsert = {
      url_id: urlId,
      total_comments: count || 0,
      last_activity: new Date().toISOString()
    };
    
    await supabase
      .from('url_metadata')
      .upsert(metadataData as Database['public']['Tables']['url_metadata']['Insert']);
  },

  /**
   * Subscribe to realtime comment updates
   */
  subscribeToComments(
    urlId: string,
    onNewComment: (comment: UrlComment) => void,
    onCommentUpdate: (comment: UrlComment) => void,
    onCommentDelete: (commentId: string) => void
  ) {
    const channel = supabase
      .channel(`comments:${urlId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'url_comments',
          filter: `url_id=eq.${urlId}`
        },
        (payload) => {
          onNewComment(payload.new as UrlComment);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'url_comments',
          filter: `url_id=eq.${urlId}`
        },
        (payload) => {
          onCommentUpdate(payload.new as UrlComment);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'url_comments',
          filter: `url_id=eq.${urlId}`
        },
        (payload) => {
          onCommentDelete(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
