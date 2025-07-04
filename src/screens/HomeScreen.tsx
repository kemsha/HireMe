import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPosts, applyToPost, likePost } from '../services/postService';
import { Post } from '../types/post';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';


interface PostWithLikeUI extends Post {
  likedByCurrentUser: boolean;
}

const PostItem = ({ post, onLike, onCommentPress, onApply, canApply, applying }: { post: PostWithLikeUI; onLike: () => void; onCommentPress: () => void; onApply?: () => void; canApply?: boolean; applying?: boolean }) => (
  <View style={styles.postContainer}>
    <View style={styles.postHeader}>
      <Text style={styles.username}>
        {post.username} <Text style={styles.userType}>({post.userType})</Text>
      </Text>
    </View>
    {post.imageUrl ? (
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
    ) : null}
    <View style={styles.postInfo}>
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
          <Ionicons name={post.likedByCurrentUser ? 'heart' : 'heart-outline'} size={24} color={post.likedByCurrentUser ? 'red' : 'black'} />
        </TouchableOpacity>
        <Text style={styles.likesText}>{post.likes?.length || 0} likes</Text>
        <TouchableOpacity onPress={onCommentPress} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.commentsText}>{post.comments?.length || 0} comments</Text>
      </View>
      <Text style={styles.caption}>{post.caption}</Text>

      {canApply && (
        <TouchableOpacity style={styles.applyButton} onPress={onApply} disabled={applying}>
          <Text style={styles.applyButtonText}>{applying ? 'Applying...' : 'Apply'}</Text>
        </TouchableOpacity>
      )}
      {post.comments && post.comments.length > 2 && (
        <TouchableOpacity onPress={onCommentPress}>
          <Text style={styles.viewAllCommentsText}>
            View all {post.comments.length} comments
          </Text>
        </TouchableOpacity>
      )}
      {post.comments && post.comments.length > 0 && (
        post.comments.slice(-2).map((comment, idx) => (
          <View key={comment.id} style={styles.inlineComment}>
            <Text style={styles.commentUserInline}>{comment.username}:</Text>
            <Text style={styles.commentTextInline}>{comment.text}</Text>
          </View>
        ))
      )}
      <Text style={styles.date}>{post.createdAt.toLocaleString()}</Text>
    </View>
  </View>
);

export default function HomeScreen() {
  const [posts, setPosts] = useState<PostWithLikeUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostWithLikeUI | null>(null);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const [applyingPostId, setApplyingPostId] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();
      const postsWithLike: PostWithLikeUI[] = data.map(post => ({
        ...post,
        likedByCurrentUser: !!(user && post.likes?.includes(user.uid)),
      }));
      setPosts(postsWithLike);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (post: PostWithLikeUI) => {
    if (!user) return;
    await likePost(post.id, user.uid, post.likes || []);
    loadPosts();
  };

  const handleCommentPress = (post: PostWithLikeUI) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!user || !selectedPost || !commentText.trim()) return;
    const postRef = doc(db, 'posts', selectedPost.id);
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      username: user.username,
      text: commentText.trim(),
      createdAt: new Date(),
    };
    const updatedComments = [...(selectedPost.comments || []), newComment];
    await updateDoc(postRef, { comments: updatedComments });
    setCommentText('');
    setCommentModalVisible(false);
    loadPosts();
  };

  const handleApply = async (post: PostWithLikeUI) => {
    if (!user) return;
    setApplyingPostId(post.id);
    try {
      await applyToPost(post.id, user.uid, user.username);
      await loadPosts();
    } catch (e) {
    } finally {
      setApplyingPostId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HireMe</Text>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostItem
              post={item}
              onLike={() => handleLike(item)}
              onCommentPress={() => handleCommentPress(item)}
              canApply={
                !!user &&
                user.userType === 'seeker' &&
                item.applicable === true &&
                !(item.applications || []).some(app => app.userId === user.uid)
              }
              onApply={() => handleApply(item)}
              applying={applyingPostId === item.id}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>No posts yet.</Text>}
        />
      )}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comments</Text>
            <FlatList
              data={selectedPost?.comments || []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentUser}>{item.username}:</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <Text style={styles.commentDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center' }}>No comments yet.</Text>}
            />
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
                <Ionicons name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setCommentModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  postContainer: {
    marginBottom: 20,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    marginHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    width: 350,
    alignSelf: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  userType: {
    fontWeight: 'normal',
    color: '#007AFF',
    fontSize: 14,
  },
  postImage: {
    width: 350,
    height: 350,
    backgroundColor: '#eee',
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  postInfo: {
    padding: 10,
  },
  caption: {
    marginBottom: 5,
    fontSize: 16,
  },
  date: {
    color: '#888',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButton: {
    marginRight: 10,
  },
  likesText: {
    marginRight: 15,
    fontWeight: 'bold',
  },
  commentsText: {
    marginRight: 10,
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  commentItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  commentUser: {
    fontWeight: 'bold',
  },
  commentText: {
    marginLeft: 5,
  },
  commentDate: {
    color: '#888',
    fontSize: 10,
    marginLeft: 5,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  sendButton: {
    marginLeft: 8,
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inlineComment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  commentUserInline: {
    fontWeight: 'bold',
    marginRight: 4,
    color: '#333',
  },
  commentTextInline: {
    color: '#222',
  },
  viewAllCommentsText: {
    color: '#888',
    marginBottom: 2,
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 