import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchApplicationsForEmployer } from '../services/postService';

const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
          renderItem={({ item }) => (
            <View style={styles.appItem}>
              <Text style={styles.applicant}><Text style={{ fontWeight: 'bold' }}>{item.username}</Text> applied to:</Text>
              <Text style={styles.postCaption}>{item.postCaption}</Text>
              <Text style={styles.appliedAt}>{new Date(item.appliedAt).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
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
  }
});

export default NotificationsScreen;