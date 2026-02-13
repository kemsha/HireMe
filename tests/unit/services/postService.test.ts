import { 
  createPost, 
  fetchPosts, 
  likePost, 
  applyToPost, 
  fetchApplicationsForEmployer 
} from '../../../src/services/postService';
import { collection, addDoc, getDocs, query, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';

// Mock Firebase Firestore
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

jest.mock('../../../src/config/firebase', () => ({
  db: {},
}));

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post with correct structure', async () => {
      const mockPostId = 'post123';
      const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
      mockAddDoc.mockResolvedValue({ id: mockPostId } as any);

      const postData = {
        userId: 'user123',
        username: 'testuser',
        userType: 'seeker' as const,
        caption: 'Test caption',
        imageBase64: 'data:image/jpeg;base64,test',
        applicable: false,
      };

      const result = await createPost(postData);

      expect(result).toBe(mockPostId);
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        userId: postData.userId,
        username: postData.username,
        userType: postData.userType,
        caption: postData.caption,
        imageUrl: postData.imageBase64,
        likes: [],
        comments: [],
        applications: [],
        applicable: false,
      });
      expect(callArgs[1].createdAt).toBeInstanceOf(Date);
      expect(mockAddDoc.mock.calls[0][1].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('fetchPosts', () => {
    it('should fetch and transform posts correctly', async () => {
      const mockPosts = [
        {
          id: 'post1',
          data: () => ({
            userId: 'user1',
            username: 'user1',
            userType: 'seeker',
            caption: 'Post 1',
            imageUrl: 'image1',
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
            imageUrl: 'image2',
            createdAt: { toDate: () => new Date('2024-01-02') },
            likes: [],
            comments: [{ id: 'c1', userId: 'user1', username: 'user1', text: 'Comment', createdAt: new Date() }],
            applicable: true,
            applications: [],
          }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        docs: mockPosts as any,
      } as any);

      const result = await fetchPosts();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('post1');
      expect(result[0].likes).toEqual(['user2']);
      expect(result[1].id).toBe('post2');
      expect(result[1].comments).toHaveLength(1);
      expect(result[1].applicable).toBe(true);
    });

    it('should handle posts with missing optional fields', async () => {
      const mockPosts = [
        {
          id: 'post1',
          data: () => ({
            userId: 'user1',
            username: 'user1',
            userType: 'seeker',
            caption: 'Post 1',
            createdAt: new Date(),
          }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        docs: mockPosts as any,
      } as any);

      const result = await fetchPosts();

      expect(result[0].likes).toEqual([]);
      expect(result[0].comments).toEqual([]);
      expect(result[0].applications).toEqual([]);
    });
  });

  describe('likePost', () => {
    it('should add user to likes array when not already liked', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const currentLikes: string[] = [];

      const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
      mockUpdateDoc.mockResolvedValue(undefined);

      await likePost(postId, userId, currentLikes);

      expect(mockUpdateDoc).toHaveBeenCalled();
      const callArgs = mockUpdateDoc.mock.calls[0];
      expect(callArgs[1]).toEqual({ likes: [userId] });
    });

    it('should remove user from likes array when already liked', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const currentLikes = ['user123', 'user456'];

      const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
      mockUpdateDoc.mockResolvedValue(undefined);

      await likePost(postId, userId, currentLikes);

      expect(mockUpdateDoc).toHaveBeenCalled();
      const callArgs = mockUpdateDoc.mock.calls[0];
      expect(callArgs[1]).toEqual({ likes: ['user456'] });
    });
  });

  describe('applyToPost', () => {
    it('should add application to post', async () => {
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
  });

  describe('fetchApplicationsForEmployer', () => {
    it('should fetch and aggregate applications for employer posts', async () => {
      const employerId = 'employer123';
      const mockPosts = [
        {
          id: 'post1',
          data: () => ({
            userId: employerId,
            caption: 'Job Post 1',
            applications: [
              { userId: 'user1', username: 'user1', appliedAt: { toDate: () => new Date('2024-01-01') } },
            ],
          }),
        },
        {
          id: 'post2',
          data: () => ({
            userId: employerId,
            caption: 'Job Post 2',
            applications: [
              { userId: 'user2', username: 'user2', appliedAt: { toDate: () => new Date('2024-01-02') } },
              { userId: 'user3', username: 'user3', appliedAt: { toDate: () => new Date('2024-01-03') } },
            ],
          }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockPosts.forEach(callback),
      } as any);

      const result = await fetchApplicationsForEmployer(employerId);

      expect(result).toHaveLength(3);
      expect(result[0].postId).toBe('post1');
      expect(result[0].postCaption).toBe('Job Post 1');
      expect(result[0].userId).toBe('user1');
      expect(result[1].userId).toBe('user2');
      expect(result[2].userId).toBe('user3');
    });

    it('should handle posts with no applications', async () => {
      const employerId = 'employer123';
      const mockPosts = [
        {
          id: 'post1',
          data: () => ({
            userId: employerId,
            caption: 'Job Post 1',
            applications: [],
          }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockPosts.forEach(callback),
      } as any);

      const result = await fetchApplicationsForEmployer(employerId);

      expect(result).toHaveLength(0);
    });
  });
});
