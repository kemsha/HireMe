import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: userId,
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
        socialLinks: userData.socialLinks || {
          linkedin: '',
          github: '',
          twitter: '',
          instagram: '',
        },
        skills: userData.skills || [],
        followers: userData.followers || [],
        following: userData.following || [],
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
        updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : userData.updatedAt,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getUserPosts = async (userId: string) => {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(postsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

export const searchUsersByUsername = async (username: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    // Firestore does not support case-insensitive or partial match natively, so we use '==' or '>=', '<=' for prefix search
    // For a simple demo, we'll use '==' for exact match. For partial, you need to index usernames in lowercase and use startAt/endAt.
    const q = query(usersRef, where('username', '>=', username), where('username', '<=', username + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        uid: doc.id,
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
        socialLinks: userData.socialLinks || {
          linkedin: '',
          github: '',
          twitter: '',
          instagram: '',
        },
        skills: userData.skills || [],
        followers: userData.followers || [],
        following: userData.following || [],
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
        updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : userData.updatedAt,
      } as User;
    });
  } catch (error) {
    console.error('Error searching users by username:', error);
    return [];
  }
};

export const getUsersByExactUsername = async (username: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        uid: doc.id,
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
        socialLinks: userData.socialLinks || {
          linkedin: '',
          github: '',
          twitter: '',
          instagram: '',
        },
        skills: userData.skills || [],
        followers: userData.followers || [],
        following: userData.following || [],
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
        updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : userData.updatedAt,
      } as User;
    });
  } catch (error) {
    console.error('Error fetching users by exact username:', error);
    return [];
  }
}; 