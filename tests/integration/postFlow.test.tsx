/**
 * Integration tests for post creation and interaction flow
 * Tests creating posts, liking, commenting, and applying
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../src/context/AuthContext';
import { createPost, likePost, applyToPost, fetchPosts } from '../../src/services/postService';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

// Mock Firebase
jest.mock('../../src/config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn((item) => item),
  where: jest.fn(),
}));

jest.mock('../../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: {
      uid: 'user123',
      username: 'testuser',
      userType: 'seeker',
    },
    loading: false,
  }),
}));

describe('Post Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a post and fetch it in feed', async () => {
    const mockPostId = 'post123';
    const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
    mockAddDoc.mockResolvedValue({ id: mockPostId } as any);

    // Create post
    const postData = {
      userId: 'user123',
      username: 'testuser',
      userType: 'seeker' as const,
      caption: 'Test post caption',
      imageBase64: 'data:image/jpeg;base64,testimage',
      applicable: false,
    };

    const createdPostId = await createPost(postData);
    expect(createdPostId).toBe(mockPostId);
    expect(mockAddDoc).toHaveBeenCalled();
    const callArgs = mockAddDoc.mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      userId: postData.userId,
      username: postData.username,
      userType: postData.userType,
      caption: postData.caption,
      likes: [],
      comments: [],
      applications: [],
    });

    // Mock fetching posts
    const mockPosts = [
      {
        id: mockPostId,
        data: () => ({
          userId: postData.userId,
          username: postData.username,
          userType: postData.userType,
          caption: postData.caption,
          imageUrl: postData.imageBase64,
          createdAt: { toDate: () => new Date() },
          likes: [],
          comments: [],
          applicable: false,
          applications: [],
        }),
      },
    ];

    const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
    mockGetDocs.mockResolvedValue({
      docs: mockPosts as any,
    } as any);

    // Fetch posts
    const posts = await fetchPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe(mockPostId);
    expect(posts[0].caption).toBe(postData.caption);
  });

  it('should like and unlike a post', async () => {
    const postId = 'post123';
    const userId = 'user123';
    const initialLikes: string[] = [];

    const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
    mockUpdateDoc.mockResolvedValue(undefined);

    // Like post
    await likePost(postId, userId, initialLikes);
    expect(mockUpdateDoc).toHaveBeenCalled();
    const callArgs = mockUpdateDoc.mock.calls[0];
    expect(callArgs[1]).toEqual({ likes: [userId] });

    // Unlike post
    await likePost(postId, userId, [userId]);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(2); // Called twice (like + unlike)
    const unlikeCallArgs = mockUpdateDoc.mock.calls[1]; // Second call (after the like)
    expect(unlikeCallArgs[1]).toEqual({ likes: [] });
  });

  it('should apply to a job post', async () => {
    const postId = 'post123';
    const userId = 'user123';
    const username = 'testuser';

    const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
    mockUpdateDoc.mockResolvedValue(undefined);

    await applyToPost(postId, userId, username);

    const callArgs = mockUpdateDoc.mock.calls[0];
    expect(callArgs[1].applications).toMatchObject({
      userId,
      username,
    });
    expect(mockUpdateDoc.mock.calls[0][1].applications.appliedAt).toBeInstanceOf(Date);
  });

  it('should handle complete post interaction flow', async () => {
    // 1. Create a post
    const mockPostId = 'post456';
    const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
    mockAddDoc.mockResolvedValue({ id: mockPostId } as any);

    const postData = {
      userId: 'employer123',
      username: 'employer',
      userType: 'employer' as const,
      caption: 'Looking for a developer',
      imageBase64: 'data:image/jpeg;base64,test',
      applicable: true,
    };

    await createPost(postData);

    // 2. Fetch posts
    const mockPosts = [
      {
        id: mockPostId,
        data: () => ({
          ...postData,
          imageUrl: postData.imageBase64,
          createdAt: { toDate: () => new Date() },
          likes: [],
          comments: [],
          applications: [],
        }),
      },
    ];

    const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
    mockGetDocs.mockResolvedValue({
      docs: mockPosts as any,
    } as any);

    const posts = await fetchPosts();
    expect(posts[0].applicable).toBe(true);

    // 3. Like the post
    const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
    mockUpdateDoc.mockResolvedValue(undefined);

    await likePost(mockPostId, 'seeker123', []);

    // 4. Apply to the post
    await applyToPost(mockPostId, 'seeker123', 'seekeruser');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2); // Once for like, once for apply
  });

  it('should handle post feed with multiple posts', async () => {
    const mockPosts = [
      {
        id: 'post1',
        data: () => ({
          userId: 'user1',
          username: 'user1',
          userType: 'seeker',
          caption: 'Post 1',
          createdAt: { toDate: () => new Date('2024-01-01') },
          likes: ['user2'],
          comments: [],
          applicable: false,
          applications: [],
        }),
      },
      {
        id: 'post2',
        data: () => ({
          userId: 'user2',
          username: 'user2',
          userType: 'employer',
          caption: 'Post 2',
          createdAt: { toDate: () => new Date('2024-01-02') },
          likes: [],
          comments: [],
          applicable: true,
          applications: [],
        }),
      },
    ];

    const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
    mockGetDocs.mockResolvedValue({
      docs: mockPosts as any,
    } as any);

    const posts = await fetchPosts();

    expect(posts).toHaveLength(2);
    expect(posts[0].id).toBe('post1');
    expect(posts[1].id).toBe('post2');
    expect(posts[0].likes).toHaveLength(1);
    expect(posts[1].applicable).toBe(true);
  });
});
