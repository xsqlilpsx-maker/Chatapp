import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Video, Users, User as UserIcon } from 'lucide-react-native';

interface Profile {
  username: string;
  avatar_url: string;
  bio: string;
  follower_count: number;
  following_count: number;
}

interface Stream {
  id: string;
  title: string;
  thumbnail_url: string;
  viewer_count: number;
  created_at: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchProfile();
    fetchUserStreams();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchUserStreams = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) {
      setStreams(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSignOut}
        >
          <Settings size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{profile.username}</Text>
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{streams.length}</Text>
            <Text style={styles.statLabel}>Streams</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <UserIcon size={20} color="#007AFF" strokeWidth={2} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.streamsSection}>
        <View style={styles.sectionHeader}>
          <Video size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Your Streams</Text>
        </View>

        {streams.length === 0 ? (
          <View style={styles.emptyState}>
            <Video size={48} color="#333" strokeWidth={2} />
            <Text style={styles.emptyText}>No streams yet</Text>
            <Text style={styles.emptySubtext}>Start your first stream from the Go Live tab</Text>
          </View>
        ) : (
          <View style={styles.streamsGrid}>
            {streams.map((stream) => (
              <TouchableOpacity
                key={stream.id}
                style={styles.streamCard}
                onPress={() => router.push(`/stream/${stream.id}`)}
              >
                <Image
                  source={{ uri: stream.thumbnail_url }}
                  style={styles.streamThumbnail}
                />
                <View style={styles.streamInfo}>
                  <Text style={styles.streamTitle} numberOfLines={2}>
                    {stream.title}
                  </Text>
                  <View style={styles.streamStats}>
                    <Users size={12} color="#999" strokeWidth={2} />
                    <Text style={styles.streamViewers}>{stream.viewer_count} viewers</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  streamsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  streamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  streamCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  streamThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#333',
  },
  streamInfo: {
    padding: 12,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  streamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streamViewers: {
    fontSize: 12,
    color: '#999',
  },
  signOutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
});
