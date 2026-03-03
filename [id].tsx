import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, FlatList, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, Send } from 'lucide-react-native';

interface Stream {
  id: string;
  title: string;
  description: string;
  viewer_count: number;
  is_live: boolean;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function StreamViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchStream();
    fetchMessages();

    const streamChannel = supabase
      .channel(`stream_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchStream();
        }
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`chat_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${id}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(streamChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [id]);

  const fetchStream = async () => {
    const { data, error } = await supabase
      .from('streams')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setStream(data as Stream);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('stream_id', id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data as ChatMessage[]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        stream_id: id,
        user_id: user.id,
        message: newMessage.trim(),
      });

    if (!error) {
      setNewMessage('');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageContainer}>
      <Image
        source={{ uri: item.profiles?.avatar_url }}
        style={styles.messageAvatar}
      />
      <View style={styles.messageContent}>
        <Text style={styles.messageUsername}>{item.profiles?.username}</Text>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    </View>
  );

  if (loading || !stream) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading stream...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.viewerBadge}>
            <Eye size={16} color="#fff" strokeWidth={2} />
            <Text style={styles.viewerText}>{stream.viewer_count}</Text>
          </View>
        </View>
      </View>

      <View style={styles.videoContainer}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
          style={styles.video}
        />
        <View style={styles.videoOverlay}>
          <Text style={styles.streamTitle}>{stream.title}</Text>
        </View>
      </View>

      <View style={styles.streamerInfo}>
        <Image
          source={{ uri: stream.profiles?.avatar_url }}
          style={styles.streamerAvatar}
        />
        <View style={styles.streamerDetails}>
          <Text style={styles.streamerName}>{stream.profiles?.username}</Text>
          {stream.description ? (
            <Text style={styles.streamDescription}>{stream.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Live Chat</Text>
          <Text style={styles.chatCount}>{messages.length}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Send a message..."
            placeholderTextColor="#666"
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color={newMessage.trim() ? '#007AFF' : '#666'} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  viewerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  streamerInfo: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  streamerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  streamDescription: {
    fontSize: 14,
    color: '#999',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  chatCount: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  messageContent: {
    flex: 1,
  },
  messageUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
