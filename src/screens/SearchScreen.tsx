import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { searchUsersByUsername, getUserPosts, getUserProfile } from '../services/userService';
import { User } from '../types/user';

const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const users = await searchUsersByUsername(query.trim());
      setResults(users);
    } catch (e) {
      setError('Error searching users.');
    }
    setLoading(false);
  };

  const handleUserPress = async (user: User) => {
    setProfileLoading(true);
    setSelectedUser(user);
    try {
      const userProfile = await getUserProfile(user.uid);
      setSelectedUser(userProfile || user);
      const posts = await getUserPosts(user.uid);
      setSelectedUserPosts(posts);
    } catch (e) {
      setSelectedUserPosts([]);
    }
    setProfileLoading(false);
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item)}>
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
      </View>
    </TouchableOpacity>
  );

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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search by username"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        onSubmitEditing={handleSearch}
      />
      <Button title="Search" onPress={handleSearch} disabled={loading || !query.trim()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={item => item.uid}
        renderItem={renderItem}
        ListEmptyComponent={!loading && query ? <Text style={styles.empty}>No users found.</Text> : null}
        style={{ marginTop: 16 }}
      />
      {renderSelectedUserProfile()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccc',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  name: {
    color: '#666',
  },
  error: {
    color: 'red',
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
  profileContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eee',
  },
  profileAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ccc',
  },
  profileUsername: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileName: {
    color: '#666',
    fontSize: 16,
  },
  profileBio: {
    marginTop: 4,
    color: '#444',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  profileStat: {
    fontWeight: 'bold',
    color: '#333',
  },
  profilePostImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  profileNoPosts: {
    color: '#888',
    marginTop: 12,
  },
  closeProfileBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeProfileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SearchScreen; 