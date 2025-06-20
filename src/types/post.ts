export interface Post {
  id: string;
  userId: string;
  username: string;
  userType: 'seeker' | 'employer';
  imageUrl?: string;
  caption: string;
  createdAt: Date;
  likes?: string[];
  comments?: Array<{
    id: string;
    userId: string;
    username: string;
    text: string;
    createdAt: Date;
  }>;
  applicable?: boolean;
  applications?: Array<{
    userId: string;
    username: string;
    appliedAt: Date;
  }>;
} 