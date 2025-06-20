import { db } from '../config/firebase';
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc, arrayUnion, where } from 'firebase/firestore';
import { Post } from '../types/post';

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'> & { imageBase64: string }) => {
  const docRef = await addDoc(collection(db, 'posts'), {
    ...post,
    imageUrl: post.imageBase64, 
    createdAt: new Date(),
    likes: [],
    comments: [],
    applications: [],
  });
  return docRef.id;
};

export const fetchPosts = async (): Promise<Post[]> => {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(postsQuery);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      username: data.username,
      userType: data.userType,
      imageUrl: data.imageUrl,
      caption: data.caption,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      likes: data.likes || [],
      comments: data.comments || [],
      applicable: data.applicable,
      applications: data.applications || [],
    };
  });
};
export const likePost = async (postId: string, userId: string, currentLikes: string[]) => {
  let newLikes;
  if (currentLikes.includes(userId)) {
    newLikes = currentLikes.filter(uid => uid !== userId);
  } else {
    newLikes = [...currentLikes, userId];
  }
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { likes: newLikes });
};


export const applyToPost = async (postId: string, userId: string, username: string) => {
  const postRef = doc(db, 'posts', postId);
  const application = {
    userId,
    username,
    appliedAt: new Date(),
  };
  await updateDoc(postRef, {
    applications: arrayUnion(application),
  });
};

export const fetchApplicationsForEmployer = async (employerId: string) => {
  const postsQuery = query(collection(db, 'posts'), where('userId', '==', employerId));
  const querySnapshot = await getDocs(postsQuery);
  const applications: Array<{
    userId: string;
    username: string;
    appliedAt: Date;
    postId: string;
    postCaption: string;
  }> = [];
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.applications && Array.isArray(data.applications)) {
      data.applications.forEach((app: any) => {
        applications.push({
          userId: app.userId,
          username: app.username,
          appliedAt: app.appliedAt?.toDate ? app.appliedAt.toDate() : app.appliedAt,
          postId: docSnap.id,
          postCaption: data.caption,
        });
      });
    }
  });
  return applications;
}; 