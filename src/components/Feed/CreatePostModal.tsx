import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { createCommunityPost } from '../../database/queries';
import { communityAPI } from '../../api/cloudAPI'; // 👈 Add cloud API import

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal = ({ visible, onClose, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handlePickMedia = async (type: 'photo' | 'video') => {
    const result = await launchImageLibrary({
      mediaType: type,
      selectionLimit: 1,
    });
    
    if (result.assets && result.assets.length > 0) {
      setMediaUri(result.assets[0].uri || null);
      setMediaType(type);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaUri) return;
    setIsPosting(true);
    
    try {
      const type = mediaType === 'video' ? 'video' : (mediaType === 'photo' ? 'photo' : 'text');
      const imageUri = mediaType === 'photo' ? (mediaUri || '') : '';
      const videoUri = mediaType === 'video' ? (mediaUri || '') : '';
      
      // Create post locally first
      await createCommunityPost(
        user?.username || 'unknown',
        content,
        type,
        imageUri,
        videoUri,
      );

      // Try to sync to cloud (don't fail if cloud is unavailable)
      try {
        await communityAPI.createPost({
          username: user?.username || 'unknown',
          content,
          type,
          imageUri,
          videoUri,
        });
      } catch (cloudError) {
        console.log('Cloud sync failed, post saved locally only:', cloudError);
      }
      
      setContent('');
      setMediaUri(null);
      setMediaType(null);
      onPostCreated();
      onClose();
    } catch (e) {
      console.error('Failed to create post', e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Post</Text>
          <TouchableOpacity 
            onPress={handlePost} 
            style={[styles.postBtn, (!content.trim() && !mediaUri) && styles.postBtnDisabled]}
            disabled={(!content.trim() && !mediaUri) || isPosting}
          >
            {isPosting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.postText}>Post</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.contentArea}>
          <TextInput
            style={styles.input}
            placeholder="Share an update, beta, or achievement..."
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus={true}
            value={content}
            onChangeText={setContent}
          />
          
          {mediaUri && (
            <View style={styles.mediaPreviewContainer}>
              {mediaType === 'photo' ? (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              ) : (
                <View style={[styles.mediaPreview, styles.videoPreviewPlaceholder]}>
                  <Ionicons name="play-circle" size={48} color="#FFF" />
                  <Text style={{color: '#FFF', fontSize: 12}}>Video Selected</Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => { setMediaUri(null); setMediaType(null); }}>
                <Ionicons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={() => handlePickMedia('photo')}>
            <Ionicons name="image-outline" size={24} color={Colors.primary} />
            <Text style={styles.toolText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => handlePickMedia('video')}>
            <Ionicons name="videocam-outline" size={24} color={Colors.primary} />
            <Text style={styles.toolText}>Video</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border 
  },
  headerBtn: { padding: Spacing.sm },
  cancelText: { fontSize: FontSize.md, color: Colors.textSecondary },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postBtnDisabled: { opacity: 0.5 },
  postText: { fontSize: FontSize.md, fontWeight: '700', color: '#FFF' },
  contentArea: { flex: 1, padding: Spacing.lg },
  input: { fontSize: FontSize.lg, color: Colors.text, textAlignVertical: 'top', minHeight: 120 },
  mediaPreviewContainer: { marginTop: Spacing.lg, position: 'relative', alignSelf: 'flex-start' },
  mediaPreview: { width: 200, height: 260, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
  videoPreviewPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  removeMediaBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: Colors.background, borderRadius: 12, overflow: 'hidden' },
  toolbar: { 
    flexDirection: 'row', padding: Spacing.base, borderTopWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card, gap: Spacing.lg 
  },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolText: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600' }
});

export default CreatePostModal;
