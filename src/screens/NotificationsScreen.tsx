import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchApplicationsForEmployer } from '../services/postService';
import { getUserProfile, getUserPosts } from '../services/userService';
import { User } from '../types/user';
import { RootStackParamList } from '../types/navigation';

type NotificationNavigationProp = NavigationProp<RootStackParamList>

const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NotificationNavigationProp>();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Profile view state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      if (user && user.userType === 'employer') {
        setLoading(true);
        try {
          const apps = await fetchApplicationsForEmployer(user.uid);
          setApplications(apps);
        } catch (e) {
          setApplications([]);
        } finally {
          setLoading(false);
        }
      }
    };
    loadApplications();
  }, [user]);

  const handleApplicationPress = async (userId: string) => {
    // Check if applicantId exists and is valid
    if (!userId || typeof userId !== 'string') {
      return;
    }

    setProfileLoading(true);
    try {
      // Fetch user profile
      const userProfile = await getUserProfile(userId);
      setSelectedUser(userProfile);
      
      // Fetch user posts
      const posts = await getUserPosts(userId);
      setSelectedUserPosts(posts);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setSelectedUserPosts([]);
    }
    setProfileLoading(false);
  };

  // Inline profile view for selected user
  const renderSelectedUserProfile = () => {
    if (profileLoading) {
      return <Text style={{ textAlign: 'center', marginTop: 24 }}>Loading profile...</Text>;
    }
    if (!selectedUser) return null;
    
    return (
      <View style={styles.profileContainer}>
        <View style={styles.profileHeader}>
          {selectedUser.profileImageUrl ? (
            <Image source={{ uri: selectedUser.profileImageUrl }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder} />
          )}
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.profileUsername}>@{selectedUser.username}</Text>
            <Text style={styles.profileName}>{selectedUser.firstName} {selectedUser.lastName}</Text>
            {selectedUser.bio ? <Text style={styles.profileBio}>{selectedUser.bio}</Text> : null}
          </View>
        </View>
        <View style={styles.profileStats}>
          <Text style={styles.profileStat}>{selectedUserPosts.length} Posts</Text>
          <Text style={styles.profileStat}>{selectedUser.followers?.length || 0} Followers</Text>
          <Text style={styles.profileStat}>{selectedUser.following?.length || 0} Following</Text>
        </View>
        <FlatList
          data={selectedUserPosts}
          keyExtractor={item => item.id}
          horizontal
          renderItem={({ item }) => (
            <Image source={{ uri: item.imageUrl }} style={styles.profilePostImage} />
          )}
          ListEmptyComponent={<Text style={styles.profileNoPosts}>No posts yet</Text>}
          style={{ marginTop: 12 }}
        />
        <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setSelectedUser(null)}>
          <Text style={styles.closeProfileBtnText}>Close Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!user || user.userType !== 'employer') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No notifications yet.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {applications.length === 0 ? (
        <Text style={styles.text}>No applications yet.</Text>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => {
            // Debug log to see the structure of item
            console.log('Application item:', item);
            console.log('Available properties:', Object.keys(item));
            
            return (
              <TouchableOpacity 
                style={styles.appItem}
                onPress={() => handleApplicationPress(item.applicantId)}
              >
                <Text style={styles.applicant}><Text style={{ fontWeight: 'bold' }}>{item.username}</Text> applied to:</Text>
                <Text style={styles.postCaption}>{item.postCaption}</Text>
                <Text style={styles.appliedAt}>{new Date(item.appliedAt).toLocaleString()}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
      {renderSelectedUserProfile()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  text: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  appItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    width: 320,
    maxWidth: '100%',
    alignSelf: 'center',
  },
  applicant: {
    fontSize: 16,
    marginBottom: 4,
  },
  postCaption: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  appliedAt: {
    fontSize: 13,
    color: '#666',
  },
  // Profile styles
  profileContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  profileStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  profilePostImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  profileNoPosts: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  closeProfileBtn: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeProfileBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsScreen;