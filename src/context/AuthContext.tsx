import React, { createContext, useState, useContext, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { User, RegisterFormData } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (data: RegisterFormData) => Promise<void>;
  signIn: (user: FirebaseUser) => void;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUser({
        uid: firebaseUser.uid,
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        profileImageUrl: userData.profileImageUrl,
        bio: userData.bio,
        location: userData.location,
        phoneNumber: userData.phoneNumber,
        website: userData.website,
        socialLinks: userData.socialLinks,
        skills: userData.skills,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateUser = async (userData: Partial<User>) => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        ...userData,
        updatedAt: new Date(),
      };
      
      console.log('Updating user data:', JSON.stringify(updateData, null, 2));
      await setDoc(userRef, updateData, { merge: true });

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const register = async (data: RegisterFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const userData = {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please use a different email.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    }
  };

  const signIn = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType,
          profileImageUrl: userData.profileImageUrl,
          bio: userData.bio,
          location: userData.location,
          phoneNumber: userData.phoneNumber,
          website: userData.website,
          socialLinks: userData.socialLinks,
          skills: userData.skills,
          followers: userData.followers,
          following: userData.following,
          createdAt: userData.createdAt?.toDate(),
          updatedAt: userData.updatedAt?.toDate(),
        });
      } else {
        await auth.signOut();
        throw new Error('User profile not found. Please contact support.');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message === 'User profile not found. Please contact support.') {
        throw error;
      }
      throw new Error('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 