import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Video, Camera } from 'lucide-react-native';

export default function GoLiveScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const startStream = async () => {
    if (!title.trim()) {
      setError('Please enter a stream title');
      return;
    }

    setLoading(true);
    setError('');

    const { data: existingStream } = await supabase
      .from('streams')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_live', true)
      .maybeSingle();

    if (existingStream) {
      setError('You already have an active stream');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('streams')
      .insert({
        user_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        is_live: true,
        viewer_count: 0,
        thumbnail_url: 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=800',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (data) {
      router.push(`/stream/${data.id}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Go Live</Text>
        <Text style={styles.headerSubtitle}>Start streaming to your audience</Text>
      </View>

      <View style={styles.previewContainer}>
        <View style={styles.preview}>
          <Camera size={64} color="#333" strokeWidth={2} />
          <Text style={styles.previewText}>Camera Preview</Text>
        </View>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Stream Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you streaming?"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell viewers what your stream is about..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.goLiveButton, loading && styles.buttonDisabled]}
          onPress={startStream}
          disabled={loading}
        >
          <Video size={24} color="#fff" strokeWidth={2} />
          <Text style={styles.goLiveText}>
            {loading ? 'Starting Stream...' : 'Go Live'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Streaming Tips</Text>
          <View style={styles.tip}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>Choose a catchy title to attract viewers</Text>
          </View>
          <View style={styles.tip}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>Make sure you have a stable internet connection</Text>
          </View>
          <View style={styles.tip}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>Interact with your chat to keep viewers engaged</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  previewContainer: {
    marginBottom: 24,
  },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  previewText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  form: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: '#ff3b3033',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  goLiveButton: {
    flexDirection: 'row',
    backgroundColor: '#ff3b30',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  goLiveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  tips: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
});
