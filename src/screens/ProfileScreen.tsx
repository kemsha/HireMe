import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserPosts } from '../services/userService';
import { User } from '../types/user';

const { width } = Dimensions.get('window');
const numColumns = 3;
const tileSize = width / numColumns;

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('grid');
  const [profileData, setProfileData] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        console.log('No user ID available');
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching profile for user:', user.uid);
        
        // Fetch profile first
        const userProfile = await getUserProfile(user.uid);
        console.log('Fetched profile data:', JSON.stringify(userProfile, null, 2));
        
        if (!userProfile) {
          console.log('No profile found for user:', user.uid);
          Alert.alert('Error', 'User profile not found');
          return;
        }

        setProfileData(userProfile);

        // Then try to fetch posts
        try {
          const userPosts = await getUserPosts(user.uid);
        setPosts(userPosts);
        } catch (postError) {
          console.error('Error fetching posts:', postError);
          // Don't show error to user, just set empty posts
          setPosts([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postTile}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/300' }} 
        style={styles.postImage} 
      />
    </TouchableOpacity>
  );

  const renderMenu = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={menuVisible}
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              handleLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.menuItemText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderProfileInfo = () => {
    if (!profileData) return null;
    
    console.log('Profile image URL:', profileData.profileImageUrl);
    
    return (
      <View style={styles.profileInfo}>
        <View style={styles.profileImageContainer}>
          {profileData.profileImageUrl ? (
            <Image
              source={{ uri: profileData.profileImageUrl }}
              style={styles.profileImage}
              onError={(e) => console.error('Error loading profile image:', e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBio = () => {
    if (!profileData) return null;
    
    return (
      <View style={styles.bioContainer}>
        <Text style={styles.name}>{profileData.firstName} {profileData.lastName}</Text>
        <Text style={styles.userType}>{profileData.userType}</Text>
        {profileData.bio && <Text style={styles.bio}>{profileData.bio}</Text>}
        
        <View style={styles.infoSection}>
          {profileData.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{profileData.location}</Text>
            </View>
          )}
          {profileData.phoneNumber && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{profileData.phoneNumber}</Text>
            </View>
          )}
          {profileData.website && (
            <View style={styles.infoRow}>
              <Ionicons name="globe-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{profileData.website}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSocialLinks = () => {
    if (!profileData?.socialLinks) return null;
    
    return (
      <View style={styles.socialLinksContainer}>
        <Text style={styles.sectionTitle}>Social Links</Text>
        <View style={styles.socialLinksGrid}>
          {profileData.socialLinks.linkedin && (
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
              <Text style={styles.socialLinkText}>LinkedIn</Text>
            </TouchableOpacity>
          )}
          {profileData.socialLinks.github && (
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="logo-github" size={24} color="#333" />
              <Text style={styles.socialLinkText}>GitHub</Text>
            </TouchableOpacity>
          )}
          {profileData.socialLinks.twitter && (
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
              <Text style={styles.socialLinkText}>Twitter</Text>
            </TouchableOpacity>
          )}
          {profileData.socialLinks.instagram && (
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="logo-instagram" size={24} color="#E1306C" />
              <Text style={styles.socialLinkText}>Instagram</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSkills = () => {
    if (!profileData?.skills?.length) return null;

    return (
      <View style={styles.skillsContainer}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsList}>
          {profileData.skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{profileData.username}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="add-circle-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {renderMenu()}

      <ScrollView>
        {renderProfileInfo()}
        {renderBio()}
        {renderSocialLinks()}
        {renderSkills()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons
              name="grid-outline"
              size={24}
              color={activeTab === 'grid' ? '#000' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons
              name="play-circle-outline"
              size={24}
              color={activeTab === 'reels' ? '#000' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={activeTab === 'tagged' ? '#000' : '#666'}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyPostsContainer}>
              <Text style={styles.emptyPostsText}>No posts yet</Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
  },
  bioContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  bio: {
    color: '#666',
    marginBottom: 4,
  },
  userType: {
    color: '#007AFF',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 8,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  postTile: {
    width: tileSize,
    height: tileSize,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyPostsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPostsText: {
    color: '#666',
    fontSize: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, // Extra padding for bottom safe area
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FF3B30',
  },
  infoSection: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  socialLinksContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  socialLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  socialLinkText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  skillsContainer: {
    padding: 15,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#333',
  },
}); 