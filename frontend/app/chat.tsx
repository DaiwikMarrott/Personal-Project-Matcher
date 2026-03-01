/**
 * Chat Screen
 * Real-time 1-on-1 chat between a project owner and a collaborator.
 * Uses Supabase Realtime for live message delivery.
 */
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getChatMessages, sendChatMessage, ChatMessage } from '@/services/api';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, checkProfileExists } = useAuth();

  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId as string;
  const projectTitle = Array.isArray(params.projectTitle) ? params.projectTitle[0] : params.projectTitle as string;
  const otherName = Array.isArray(params.otherName) ? params.otherName[0] : params.otherName as string;
  const otherProfilePic = Array.isArray(params.otherProfilePic) ? params.otherProfilePic[0] : params.otherProfilePic as string | undefined;

  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    init();
    return () => {
      // Unsubscribe on unmount
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const init = async () => {
    if (!user) return;
    const { profile } = await checkProfileExists(user.id);
    if (!profile) return;
    setMyProfileId(profile.id);
    await loadMessages(profile.id);
    subscribeToMessages();
  };

  const loadMessages = async (profileId: string) => {
    const result = await getChatMessages(chatId, profileId);
    if (result.data) {
      setMessages(result.data.messages);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // avoid duplicates
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();
    channelRef.current = channel;
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !myProfileId || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic insert
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      chat_id: chatId,
      sender_id: myProfileId,
      content: text,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendChatMessage(chatId, myProfileId, text);
    if (result.data) {
      // Replace optimistic message with real one from server
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? result.data!.message : m))
      );
    }
    setSending(false);
  };

  const scrollToBottom = () => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.sender_id === myProfileId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isMe && (prevMsg?.sender_id !== item.sender_id || !prevMsg);

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {!isMe && (
          <View style={[styles.msgAvatarSlot, !showAvatar && { opacity: 0 }]}>
            {otherProfilePic ? (
              <Image source={{ uri: otherProfilePic }} style={styles.msgAvatar} />
            ) : (
              <View style={styles.msgAvatarPlaceholder}>
                <Text style={styles.msgAvatarText}>{otherName?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.content}</Text>
          <Text style={[styles.bubbleTime, !isMe && styles.bubbleTimeThem]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>{otherName || 'Chat'}</Text>
          {projectTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>re: {projectTitle}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Start the conversation!</Text>
                <Text style={styles.emptySub}>
                  Discuss the project details, expectations, and next steps.
                </Text>
              </View>
            }
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message…"
              placeholderTextColor="#a8a29e"
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendDisabled]}
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol size={22} name="paperplane.fill" color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },

  messageList: { padding: 16, paddingBottom: 8, gap: 4 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  messageRowRight: { justifyContent: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },

  msgAvatarSlot: { marginRight: 6, width: 28, height: 28 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  msgAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: '#065f46' },

  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleTextMe: { color: '#fff', fontSize: 15, lineHeight: 21 },
  bubbleTextThem: { color: '#1c1917', fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3, textAlign: 'right' },
  bubbleTimeThem: { color: '#a8a29e' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  emptySub: { fontSize: 14, color: '#78716c', textAlign: 'center', paddingHorizontal: 24 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1c1917',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { backgroundColor: '#a7f3d0' },
});
