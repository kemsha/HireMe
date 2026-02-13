import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext';
import { auth, db } from '../../../src/config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// Mock Firebase
jest.mock('../../../src/config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
  },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, register, signIn, signOut, updateUser } = useAuth();
  return (
    <>
      {loading ? <Text>Loading...</Text> : null}
      {user ? <Text>User: {user.username}</Text> : <Text>No user</Text>}
      <TouchableOpacity
        testID="register-btn"
        onPress={() =>
          register({
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            userType: 'seeker',
          })
        }
      >
        <Text>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="signout-btn" onPress={signOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide auth context to children', () => {
      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByText('No user')).toBeTruthy();
    });

    it('should handle loading state initially', async () => {
      const mockOnAuthStateChanged = auth.onAuthStateChanged as jest.MockedFunction<
        typeof auth.onAuthStateChanged
      >;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        // Simulate async auth check
        setTimeout(() => callback(null), 0);
        return jest.fn(); // unsubscribe function
      });

      const { queryByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });
    });

    it('should load user data when authenticated', async () => {
      const mockFirebaseUser = {
        uid: 'user123',
        email: 'test@example.com',
      } as FirebaseUser;

      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        userType: 'seeker',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const mockOnAuthStateChanged = auth.onAuthStateChanged as jest.MockedFunction<
        typeof auth.onAuthStateChanged
      >;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(mockFirebaseUser), 0);
        return jest.fn();
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByText('User: testuser')).toBeTruthy();
      });
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUserCredential = {
        user: {
          uid: 'user123',
          email: 'test@example.com',
        },
      };

      const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<
        typeof createUserWithEmailAndPassword
      >;
      mockCreateUser.mockResolvedValue(mockUserCredential as any);

      const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
      mockSetDoc.mockResolvedValue(undefined);

      const mockOnAuthStateChanged = auth.onAuthStateChanged as jest.MockedFunction<
        typeof auth.onAuthStateChanged
      >;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const TestRegister = () => {
        const { register } = useAuth();
        React.useEffect(() => {
          register({
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            userType: 'seeker',
          }).catch(console.error);
        }, [register]);
        return null;
      };

      render(
        <AuthProvider>
          <TestRegister />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        );
        expect(mockSetDoc).toHaveBeenCalled();
        const callArgs = mockSetDoc.mock.calls[0];
        expect(callArgs[1]).toMatchObject({
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          userType: 'seeker',
        });
        expect(callArgs[1].createdAt).toBeInstanceOf(Date);
        expect(callArgs[1].updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should handle registration errors correctly', async () => {
      const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<
        typeof createUserWithEmailAndPassword
      >;
      mockCreateUser.mockRejectedValue({ code: 'auth/email-already-in-use' });

      const mockOnAuthStateChanged = auth.onAuthStateChanged as jest.MockedFunction<
        typeof auth.onAuthStateChanged
      >;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const TestRegister = () => {
        const { register } = useAuth();
        const [error, setError] = React.useState<string | null>(null);

        React.useEffect(() => {
          register({
            email: 'existing@example.com',
            username: 'testuser',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            userType: 'seeker',
          }).catch((err) => setError(err.message));
        }, [register]);

        return error ? <Text>{error}</Text> : null;
      };

      const { getByText } = render(
        <AuthProvider>
          <TestRegister />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByText(/already registered/i)).toBeTruthy();
      });
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      const mockSignOut = auth.signOut as jest.MockedFunction<typeof auth.signOut>;
      mockSignOut.mockResolvedValue(undefined);

      const mockOnAuthStateChanged = auth.onAuthStateChanged as jest.MockedFunction<
        typeof auth.onAuthStateChanged
      >;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const TestSignOut = () => {
        const { signOut } = useAuth();
        React.useEffect(() => {
          signOut().catch(console.error);
        }, [signOut]);
        return null;
      };

      render(
        <AuthProvider>
          <TestSignOut />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});
