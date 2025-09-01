  <script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import Btn from '../common/Btn.svelte';

  export let chapterId: string;
  export let novelId: string;

  interface Comment {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    parent_id: string | null;
    user_id: string;
    user_name: string;
    replies: Comment[];
  }

  let comments: Comment[] = [];
  let loading = false;
  let error: string | null = null;
  let newComment = '';
  let submitting = false;
  let replyingTo: string | null = null;
  let replyContent = '';
  let editingComment: string | null = null;
  let editContent = '';

  onMount(() => {
    loadComments();
  });

  async function loadComments() {
    try {
      loading = true;
      error = null;

      const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/comments`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load comments');
      }

      comments = data.comments || [];
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function submitComment() {
    if (!$user) {
      error = '请先登录后再发表评论';
      return;
    }

    if (!newComment.trim()) {
      error = '评论内容不能为空';
      return;
    }

    try {
      submitting = true;
      error = null;

      const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      newComment = '';
      await loadComments();
    } catch (err: any) {
      error = err.message;
    } finally {
      submitting = false;
    }
  }

  async function submitReply(parentId: string) {
    if (!$user) {
      error = '请先登录后再回复';
      return;
    }

    if (!replyContent.trim()) {
      error = '回复内容不能为空';
      return;
    }

    try {
      submitting = true;
      error = null;

      const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reply');
      }

      replyContent = '';
      replyingTo = null;
      await loadComments();
    } catch (err: any) {
      error = err.message;
    } finally {
      submitting = false;
    }
  }

  async function updateComment(commentId: string) {
    if (!editContent.trim()) {
      error = '评论内容不能为空';
      return;
    }

    try {
      submitting = true;
      error = null;

      const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          content: editContent.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update comment');
      }

      editingComment = null;
      editContent = '';
      await loadComments();
    } catch (err: any) {
      error = err.message;
    } finally {
      submitting = false;
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      return;
    }

    try {
      submitting = true;
      error = null;

      const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/comments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      await loadComments();
    } catch (err: any) {
      error = err.message;
    } finally {
      submitting = false;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function startReply(commentId: string) {
    replyingTo = commentId;
    replyContent = '';
    editingComment = null;
  }

  function startEdit(comment: Comment) {
    editingComment = comment.id;
    editContent = comment.content;
    replyingTo = null;
  }

  function cancelReply() {
    replyingTo = null;
    replyContent = '';
  }

  function cancelEdit() {
    editingComment = null;
    editContent = '';
  }
</script>

<div class="border-t-2 border-gray-400 p-6">
  <h3 class="text-xl font-medium text-gray-900 mb-6">评论区</h3>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}

  <!-- Comment Form -->
  {#if $user}
    <div class="mb-8">
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span class="text-sm font-medium text-gray-700">
              {$user.profile?.user_name?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
        <div class="flex-grow">
          <textarea
            bind:value={newComment}
            placeholder="写下您的评论..."
            rows="3"
            class="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500 resize-none"
            maxlength="1000"
          ></textarea>
          <div class="flex justify-between items-center mt-2">
            <span class="text-xs text-gray-500">{newComment.length}/1000</span>
            <Btn
              handleClick={submitComment}
              disabled={submitting || !newComment.trim()}
              title={submitting ? '发布中...' : '发布评论'}
              cssClass="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="mb-8 text-center py-6 bg-gray-50 rounded-lg">
      <p class="text-gray-600 mb-4">请登录后发表评论</p>
      <a
        href="/user/login"
        class="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        立即登录
      </a>
    </div>
  {/if}

  <!-- Comments List -->
  {#if loading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
    </div>
  {:else if comments.length === 0}
    <div class="text-center py-8 text-gray-500">
      <p>暂无评论，快来发表第一条评论吧！</p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each comments as comment}
        <div class="border-l-4 border-gray-200 pl-4">
          <!-- Main Comment -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-xs font-medium text-gray-700">
                    {comment.user_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <span class="font-medium text-gray-900">{comment.user_name}</span>
                  <span class="text-xs text-gray-500 ml-2">{formatDate(comment.created_at)}</span>
                  {#if comment.updated_at !== comment.created_at}
                    <span class="text-xs text-gray-400 ml-1">(已编辑)</span>
                  {/if}
                </div>
              </div>
              
              {#if $user?.id === comment.user_id}
                <div class="flex space-x-2">
                  <button
                    on:click={() => startEdit(comment)}
                    class="text-xs text-gray-500 hover:text-gray-700"
                  >
                    编辑
                  </button>
                  <button
                    on:click={() => deleteComment(comment.id)}
                    class="text-xs text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              {/if}
            </div>

            {#if editingComment === comment.id}
              <!-- Edit Form -->
              <div class="mt-3">
                <textarea
                  bind:value={editContent}
                  rows="3"
                  class="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500 resize-none"
                  maxlength="1000"
                ></textarea>
                <div class="flex justify-end space-x-2 mt-2">
                  <button
                    on:click={cancelEdit}
                    class="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                  <Btn
                    handleClick={() => updateComment(comment.id)}
                    disabled={submitting || !editContent.trim()}
                    title={submitting ? '更新中...' : '更新'}
                    cssClass="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  />
                </div>
              </div>
            {:else}
              <!-- Comment Content -->
              <p class="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
              
              {#if $user}
                <div class="mt-3">
                  <button
                    on:click={() => startReply(comment.id)}
                    class="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    回复
                  </button>
                </div>
              {/if}
            {/if}

            <!-- Reply Form -->
            {#if replyingTo === comment.id}
              <div class="mt-4 pl-4 border-l-2 border-gray-300">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span class="text-xs font-medium text-gray-700">
                        {$user?.profile?.user_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div class="flex-grow">
                    <textarea
                      bind:value={replyContent}
                      placeholder="写下您的回复..."
                      rows="2"
                      class="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500 resize-none"
                      maxlength="1000"
                    ></textarea>
                    <div class="flex justify-end space-x-2 mt-2">
                      <button
                        on:click={cancelReply}
                        class="text-sm text-gray-500 hover:text-gray-700"
                      >
                        取消
                      </button>
                      <Btn
                        handleClick={() => submitReply(comment.id)}
                        disabled={submitting || !replyContent.trim()}
                        title={submitting ? '回复中...' : '回复'}
                        cssClass="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Replies -->
          {#if comment.replies && comment.replies.length > 0}
            <div class="ml-8 mt-4 space-y-3">
              {#each comment.replies as reply}
                <div class="bg-white rounded-lg p-3 border border-gray-200">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-2 mb-2">
                      <div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium text-gray-700">
                          {reply.user_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span class="text-sm font-medium text-gray-900">{reply.user_name}</span>
                      <span class="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                      {#if reply.updated_at !== reply.created_at}
                        <span class="text-xs text-gray-400">(已编辑)</span>
                      {/if}
                    </div>
                    
                    {#if $user?.id === reply.user_id}
                      <div class="flex space-x-2">
                        <button
                          on:click={() => startEdit(reply)}
                          class="text-xs text-gray-500 hover:text-gray-700"
                        >
                          编辑
                        </button>
                        <button
                          on:click={() => deleteComment(reply.id)}
                          class="text-xs text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    {/if}
                  </div>

                  {#if editingComment === reply.id}
                    <!-- Edit Reply Form -->
                    <div class="mt-2">
                      <textarea
                        bind:value={editContent}
                        rows="2"
                        class="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500 resize-none"
                        maxlength="1000"
                      ></textarea>
                      <div class="flex justify-end space-x-2 mt-2">
                        <button
                          on:click={cancelEdit}
                          class="text-sm text-gray-500 hover:text-gray-700"
                        >
                          取消
                        </button>
                        <Btn
                          handleClick={() => updateComment(reply.id)}
                          disabled={submitting || !editContent.trim()}
                          title={submitting ? '更新中...' : '更新'}
                          cssClass="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  {:else}
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>