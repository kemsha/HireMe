import { 
  getUserProfile, 
  getUserPosts, 
  searchUsersByUsername 
} from '../../../src/services/userService';
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  collection: jest.fn(),
}));

jest.mock('../../../src/config/firebase', () => ({
  db: {},
}));

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch and transform user profile correctly', async () => {
      const userId = 'user123';
      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        userType: 'seeker',
        profileImageUrl: 'image.jpg',
        bio: 'Test bio',
        location: 'Test City',
        phoneNumber: '1234567890',
        website: 'https://test.com',
        socialLinks: {
          linkedin: 'linkedin.com/in/test',
          github: 'github.com/test',
        },
        skills: ['JavaScript', 'TypeScript'],
        followers: ['user2'],
        following: ['user3'],
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      };

      const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const result = await getUserProfile(userId);

      expect(result).not.toBeNull();
      expect(result?.uid).toBe(userId);
      expect(result?.email).toBe(mockUserData.email);
      expect(result?.username).toBe(mockUserData.username);
      expect(result?.skills).toEqual(mockUserData.skills);
      expect(result?.followers).toEqual(mockUserData.followers);
    });

    it('should return null when user does not exist', async () => {
      const userId = 'nonexistent';

      const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      } as any);

      const result = await getUserProfile(userId);

      expect(result).toBeNull();
    });

    it('should handle missing optional fields with defaults', async () => {
      const userId = 'user123';
      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        userType: 'seeker',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const result = await getUserProfile(userId);

      expect(result?.socialLinks).toEqual({
        linkedin: '',
        github: '',
        twitter: '',
        instagram: '',
      });
      expect(result?.skills).toEqual([]);
      expect(result?.followers).toEqual([]);
    });

    it('should throw error on fetch failure', async () => {
      const userId = 'user123';
      const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
      mockGetDoc.mockRejectedValue(new Error('Network error'));

      await expect(getUserProfile(userId)).rejects.toThrow('Network error');
    });
  });

  describe('getUserPosts', () => {
    it('should fetch user posts correctly', async () => {
      const userId = 'user123';
      const mockPosts = [
        {
          id: 'post1',
          data: () => ({ caption: 'Post 1', userId }),
        },
        {
          id: 'post2',
          data: () => ({ caption: 'Post 2', userId }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        docs: mockPosts as any,
      } as any);

      const result = await getUserPosts(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('post1');
      expect(result[1].id).toBe('post2');
    });

    it('should return empty array on error', async () => {
      const userId = 'user123';
      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockRejectedValue(new Error('Network error'));

      const result = await getUserPosts(userId);

      expect(result).toEqual([]);
    });
  });

  describe('searchUsersByUsername', () => {
    it('should search users by username prefix', async () => {
      const searchTerm = 'test';
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            email: 'test1@example.com',
            username: 'testuser1',
            firstName: 'Test',
            lastName: 'User1',
            userType: 'seeker',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        {
          id: 'user2',
          data: () => ({
            email: 'test2@example.com',
            username: 'testuser2',
            firstName: 'Test',
            lastName: 'User2',
            userType: 'employer',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        docs: mockUsers as any,
      } as any);

      const result = await searchUsersByUsername(searchTerm);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('testuser1');
      expect(result[1].username).toBe('testuser2');
    });

    it('should return empty array when no users found', async () => {
      const searchTerm = 'nonexistent';
      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        docs: [],
      } as any);

      const result = await searchUsersByUsername(searchTerm);

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      const searchTerm = 'test';
      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockRejectedValue(new Error('Network error'));

      const result = await searchUsersByUsername(searchTerm);

      expect(result).toEqual([]);
    });

    it('should handle users with missing optional fields', async () => {
      const searchTerm = 'test';
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            email: 'test@example.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            userType: 'seeker',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
      mockGetDocs.mockResolvedValue({
        docs: mockUsers as any,
      } as any);

      const result = await searchUsersByUsername(searchTerm);

      expect(result[0].socialLinks).toEqual({
        linkedin: '',
        github: '',
        twitter: '',
        instagram: '',
      });
      expect(result[0].skills).toEqual([]);
    });
  });
});
