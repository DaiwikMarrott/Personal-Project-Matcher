/**
 * Chat Screen — Split-screen layout
 * Left panel: full project details (image + info)
 * Right panel: real-time 1-on-1 chat
 *
 * Performance note: ChatInputBar is a separate memo'd component so that
 * typing only re-renders the input bar, NOT the message FlatList.
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
  ScrollView,
} from 'react-native';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getChatMessages, sendChatMessage, ChatMessage, getProject } from '@/services/api';

interface ProjectInfo {
  id: string;
  title: string;
  description: string;
  owner_first_name?: string;
  owner_last_name?: string;
  tags?: string[];
  duration?: string;
  status?: string;
  availability?: string;
  project_image_url?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Isolated input bar — owns its own text state so typing does NOT trigger
// re-renders of the message FlatList above it.
// ─────────────────────────────────────────────────────────────────────────────
const ChatInputBar = memo(function ChatInputBar({
  onSend,
  sending,
}: {
  onSend: (text: string) => void;
  sending: boolean;
}) {
  // Store text in a ref — zero re-renders while the user types.
  // The TextInput is UNCONTROLLED (no value prop), so the native layer
  // handles display entirely. We only read the value on Send.
  const textRef = useRef('');
  const inputRef = useRef<any>(null);

  const handlePress = () => {
    const t = textRef.current.trim();
    if (!t || sending) return;
    textRef.current = '';
    inputRef.current?.clear();   // clears the native input without re-rendering
    onSend(t);
  };

  return (
    <View style={styles.inputBar}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        onChangeText={(t) => { textRef.current = t; }}
        placeholder="Type a message…"
        placeholderTextColor="#a8a29e"
        multiline
        maxLength={1000}
        onSubmitEditing={handlePress}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendButton, sending && styles.sendDisabled]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <IconSymbol size={22} name="paperplane.fill" color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, checkProfileExists } = useAuth();

  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId as string;
  const projectTitle = Array.isArray(params.projectTitle) ? params.projectTitle[0] : params.projectTitle as string;
  const otherName = Array.isArray(params.otherName) ? params.otherName[0] : params.otherName as string;
  const otherProfilePic = Array.isArray(params.otherProfilePic) ? params.otherProfilePic[0] : params.otherProfilePic as string | undefined;
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId as string | undefined;

  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    init();
    return () => {
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

    // Load messages + project info in parallel
    const promises: Promise<any>[] = [loadMessages(profile.id)];
    if (projectId) {
      promises.push(
        getProject(projectId).then((res) => {
          if (res.data) setProjectInfo(res.data as ProjectInfo);
        })
      );
    }
    await Promise.all(promises);
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

  const handleSend = useCallback(async (text: string) => {
    if (!myProfileId || sending) return;
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
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? result.data!.message : m))
      );
    }
    setSending(false);
  }, [myProfileId, sending, chatId]);

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
      <View style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
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

  const displayTitle = projectInfo?.title || projectTitle || 'Project';

  return (
    <View style={styles.root}>
      {/* ── Full-width top header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>{otherName || 'Chat'}</Text>
          {displayTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>re: {displayTitle}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Split body ── */}
      <View style={styles.body}>
        {/* ── LEFT: Project details panel ── */}
        <ScrollView style={styles.projectPanel} contentContainerStyle={styles.projectPanelContent} showsVerticalScrollIndicator={false}>
          {/* Thumbnail image */}
          <View style={styles.imageWrapper}>
            {projectInfo?.project_image_url ? (
              <Image source={{ uri: projectInfo.project_image_url }} style={styles.projectImage} resizeMode="cover" />
            ) : (
              <View style={styles.projectImagePlaceholder}>
                <Text style={styles.projectImagePlaceholderText}>📁</Text>
              </View>
            )}
          </View>

          <View style={styles.projectPanelInner}>
            <Text style={styles.projectPanelHeading}>📋 Project Details</Text>

            <Text style={styles.projectTitle}>{displayTitle}</Text>

            {projectInfo?.status ? (
              <View style={[styles.statusPill, projectInfo.status === 'open' ? styles.statusOpen : styles.statusClosed]}>
                <Text style={styles.statusPillText}>
                  {projectInfo.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                </Text>
              </View>
            ) : null}

            {(projectInfo?.owner_first_name || projectInfo?.owner_last_name) ? (
              <Text style={styles.projectOwner}>
                👤 {projectInfo.owner_first_name} {projectInfo.owner_last_name}
              </Text>
            ) : null}

            {projectInfo?.duration ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>⏱ Duration</Text>
                <Text style={styles.metaValue}>{projectInfo.duration}</Text>
              </View>
            ) : null}

            {projectInfo?.availability ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>📅 Availability</Text>
                <Text style={styles.metaValue}>{projectInfo.availability}</Text>
              </View>
            ) : null}

            {projectInfo?.tags && projectInfo.tags.length > 0 ? (
              <View style={styles.tagsSection}>
                <Text style={styles.metaLabel}>🏷 Tags</Text>
                <View style={styles.tagRow}>
                  {projectInfo.tags.map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {projectInfo?.description ? (
              <View style={styles.descSection}>
                <Text style={styles.metaLabel}>📝 Description</Text>
                <Text style={styles.descText}>{projectInfo.description}</Text>
              </View>
            ) : (
              <View style={styles.noProjectInfo}>
                <Text style={styles.noProjectInfoText}>Project details will appear here once loaded.</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── RIGHT: Chat panel ── */}
        <View style={styles.chatPanel}>
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
                      Discuss the project, expectations, and next steps.
                    </Text>
                  </View>
                }
              />

              {/* Isolated input bar — has its own state so typing won't re-render the FlatList */}
              <ChatInputBar onSend={handleSend} sending={sending} />
            </KeyboardAvoidingView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  flex: { flex: 1 },

  // ── Header ──
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

  // ── Body (split row) ──
  body: { flex: 1, flexDirection: 'row' },

  // ── Left: Project panel ── (50/50)
  projectPanel: {
    flex: 1,
    backgroundColor: '#fff',
  },
  projectPanelContent: { paddingBottom: 32, alignItems: 'center' },

  // Image: centered rounded rectangle, constrained to panel width
  imageWrapper: { width: '100%', paddingHorizontal: 16, paddingTop: 16, alignItems: 'center' },
  projectImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
  },
  projectImagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#a7f3d0',
    borderStyle: 'dashed',
  },
  projectImagePlaceholderText: { fontSize: 44 },

  projectPanelInner: { paddingHorizontal: 14, paddingTop: 12, alignItems: 'center', width: '100%' },
  projectPanelHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 8,
    lineHeight: 21,
    textAlign: 'center',
  },
  statusPill: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusOpen: { backgroundColor: '#d1fae5' },
  statusClosed: { backgroundColor: '#fee2e2' },
  statusPillText: { fontSize: 12, fontWeight: '600', color: '#065f46' },
  projectOwner: { fontSize: 13, color: '#57534e', marginBottom: 10, textAlign: 'center' },

  metaRow: { marginBottom: 8, alignItems: 'center' },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  metaValue: { fontSize: 13, color: '#374151', textAlign: 'center' },

  tagsSection: { marginBottom: 10, alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: 'center' },
  tag: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: '#065f46' },

  descSection: { marginBottom: 10, alignItems: 'center' },
  descText: { fontSize: 13, color: '#374151', lineHeight: 19, marginTop: 4, textAlign: 'center' },
  noProjectInfo: { alignItems: 'center', paddingTop: 20 },
  noProjectInfoText: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  // ── Divider ──
  divider: { width: 1, backgroundColor: '#d1fae5' },

  // ── Right: Chat panel ──
  chatPanel: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  messageList: { padding: 12, paddingBottom: 8, gap: 4 },
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

  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMe: { backgroundColor: '#10B981', borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleTextMe: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTextThem: { color: '#1c1917', fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'right' },
  bubbleTimeThem: { color: '#a8a29e' },

  emptyState: { alignItems: 'center', paddingTop: 50, gap: 8, paddingHorizontal: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917' },
  emptySub: { fontSize: 13, color: '#78716c', textAlign: 'center' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1c1917',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { backgroundColor: '#a7f3d0' },
});

