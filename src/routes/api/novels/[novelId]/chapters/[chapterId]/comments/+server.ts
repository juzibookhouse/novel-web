import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';

export async function GET({ params }) {
  try {
    const { chapterId } = params;

    // Fetch comments with user profile information and nested replies
    const { data: comments, error } = await supabase
      .from('chapter_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user_id,
        user_profiles!inner (
          user_name
        )
      `)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Organize comments into a nested structure
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create all comment objects
    comments.forEach(comment => {
      const commentObj = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        parent_id: comment.parent_id,
        user_id: comment.user_id,
        user_name: comment.user_profiles.user_name,
        replies: []
      };
      commentMap.set(comment.id, commentObj);
    });

    // Second pass: organize into nested structure
    comments.forEach(comment => {
      const commentObj = commentMap.get(comment.id);
      if (comment.parent_id) {
        // This is a reply
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(commentObj);
        }
      } else {
        // This is a root comment
        rootComments.push(commentObj);
      }
    });

    return json({ comments: rootComments });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request, params, locals }) {
  try {
    const { chapterId } = params;
    const {user_id} = await getAuthUser(request);
    const { content, parent_id } = await request.json();

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.trim().length > 1000) {
      return json({ error: 'Comment content too long (max 1000 characters)' }, { status: 400 });
    }

    // Check if user is authenticated
    if (!user_id) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify chapter exists
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return json({ error: 'Chapter not found' }, { status: 404 });
    }

    // If this is a reply, verify parent comment exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('chapter_comments')
        .select('id')
        .eq('id', parent_id)
        .eq('chapter_id', chapterId)
        .single();

      if (parentError || !parentComment) {
        return json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Create the comment
    const { data: newComment, error: insertError } = await supabase
      .from('chapter_comments')
      .insert({
        chapter_id: chapterId,
        user_id,
        content: content.trim(),
        parent_id: parent_id || null
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user_id,
        user_profiles!inner (
          user_name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Format the response
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      parent_id: newComment.parent_id,
      user_id: newComment.user_id,
      user_name: newComment.user_profiles.user_name,
      replies: []
    };

    return json({ comment: formattedComment }, { status: 201 });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}