export type UserType = 'seeker' | 'employer';

export interface User {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
  };
  skills?: string[];
  experience?: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
  education?: {
    school: string;
    degree: string;
    field: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
  followers?: string[];
  following?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
  };
  skills?: string[];
} 