import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [], // Users with previous interactions
  searchedUsers: [], // Users found via search
  selectedUser: null,
  replyingTo: null,
  typingUsers: {},
  unreadCounts: {},
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  isReactingToMessage: false,
  isDeletingMessage: false,
  isEditingMessage: false,
  isSearchingUsers: false,
  messageBeingEdited: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      
      // Just store the users from the backend, which are already filtered
      // to only include users with previous interactions
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUsers: async (query) => {
    if (!query || query.length < 2) {
      set({ searchedUsers: [] });
      return;
    }
    
    set({ isSearchingUsers: true });
    try {
      const res = await axiosInstance.get(`/users/search?query=${encodeURIComponent(query)}`);
      const searchResults = res.data;
      
      // Don't include the current user in search results
      const myId = useAuthStore.getState().authUser?._id;
      const filteredResults = searchResults.filter(user => user._id !== myId);
      
      set({ searchedUsers: filteredResults });
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
      set({ searchedUsers: [] });
    } finally {
      set({ isSearchingUsers: false });
    }
  },

  // Reset search
  clearUserSearch: () => {
    set({ searchedUsers: [] });
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      
      // Mark messages as seen
      const myId = useAuthStore.getState().authUser?._id;
      const unseenMessages = res.data.filter(
        message => message.senderId === userId && !message.seen && message.receiverId === myId
      );
      
      for (const message of unseenMessages) {
        await axiosInstance.put(`/messages/seen/${message._id}`);
      }
      
      // Update unread counts
      get().updateUnreadCounts();
      
      // Make sure to update our user list since a new interaction might have been recorded
      get().getUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    set({ isSendingMessage: true });
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ 
        messages: [...messages, res.data],
        replyingTo: null // Clear reply after sending
      });
      
      // Since we sent a message, update the users list to ensure this user is included
      get().getUsers();
      
      // If we had unread messages from this user, reset the count
      get().updateUnreadCounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      set({ isSendingMessage: false });
    }
  },

  setSelectedUser: (user) => {
    set({ 
      selectedUser: user,
      replyingTo: null,
      messageBeingEdited: null
    });
    
    if (user) {
      // When we select a user, clear their unread count
      set(state => {
        const newUnreadCounts = { ...state.unreadCounts };
        delete newUnreadCounts[user._id];
        return { unreadCounts: newUnreadCounts };
      });
    }
  },

  deleteMessage: async (messageId) => {
    set({ isDeletingMessage: true });
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Update the message in the local state
      set(state => ({
        messages: state.messages.map(message => 
          message._id === messageId 
            ? { ...message, isDeleted: true, text: "", image: null }
            : message
        )
      }));
      
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  deleteConversation: async (userId) => {
    set({ isDeletingMessage: true });
    try {
      await axiosInstance.delete(`/messages/conversation/${userId}`);
      
      // Update all messages in the conversation as deleted
      set(state => ({
        messages: state.messages.map(message => ({
          ...message,
          isDeleted: true,
          text: "",
          image: null
        }))
      }));
      
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete conversation");
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  reactToMessage: async (messageId, emoji) => {
    set({ isReactingToMessage: true });
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      
      // Update the message in the local state
      set(state => ({
        messages: state.messages.map(message => 
          message._id === messageId ? res.data : message
        )
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react to message");
    } finally {
      set({ isReactingToMessage: false });
    }
  },

  startEditingMessage: (message) => {
    set({ 
      messageBeingEdited: message 
    });
  },

  cancelEditingMessage: () => {
    set({ messageBeingEdited: null });
  },

  editMessage: async (messageId, text) => {
    set({ isEditingMessage: true });
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      
      // Update the message in the local state
      set(state => ({
        messages: state.messages.map(message => 
          message._id === messageId ? res.data : message
        ),
        messageBeingEdited: null
      }));
      
      toast.success("Message updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    } finally {
      set({ isEditingMessage: false });
    }
  },

  setReplyTo: (message) => {
    set({ replyingTo: message });
  },

  cancelReply: () => {
    set({ replyingTo: null });
  },

  userStartedTyping: (userId) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: true
      }
    }));
  },

  userStoppedTyping: (userId) => {
    set(state => {
      const newTypingUsers = { ...state.typingUsers };
      delete newTypingUsers[userId];
      return { typingUsers: newTypingUsers };
    });
  },

  updateUnreadCounts: async () => {
    try {
      const myId = useAuthStore.getState().authUser?._id;
      if (!myId) return;
      
      const users = get().users;
      const counts = {};
      
      for (const user of users) {
        const res = await axiosInstance.get(`/messages/${user._id}`);
        const unseenCount = res.data.filter(
          message => message.senderId === user._id && !message.seen && message.receiverId === myId
        ).length;
        
        if (unseenCount > 0) {
          counts[user._id] = unseenCount;
        }
      }
      
      set({ unreadCounts: counts });
    } catch (error) {
      console.error("Failed to update unread counts:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const isMessageFromSelectedUser = 
        newMessage.senderId === selectedUser?._id || 
        newMessage.receiverId === selectedUser?._id;
        
      if (isMessageFromSelectedUser) {
        // Add message to current chat
        set(state => ({
          messages: [...state.messages, newMessage]
        }));
        
        // Mark message as seen immediately if it's from current chat
        if (
          newMessage.senderId === selectedUser?._id && 
          newMessage.receiverId === useAuthStore.getState().authUser?._id
        ) {
          axiosInstance.put(`/messages/seen/${newMessage._id}`);
        }
      }
      
      // Move this user to top of list if not already selected
      if (newMessage.senderId !== useAuthStore.getState().authUser?._id) {
        get().updateUnreadCounts();
      }
    });

    socket.on("messageSeen", (messageId) => {
      set(state => ({
        messages: state.messages.map(message => 
          message._id === messageId ? { ...message, seen: true } : message
        )
      }));
    });

    socket.on("messageDeleted", (messageId) => {
      set(state => ({
        messages: state.messages.map(message => 
          message._id === messageId 
            ? { ...message, isDeleted: true, text: "", image: null }
            : message
        )
      }));
    });

    socket.on("messageReaction", ({ messageId, userId, emoji }) => {
      // Find the message and update its reactions
      set(state => {
        const message = state.messages.find(msg => msg._id === messageId);
        if (!message) return state;
        
        let updatedReactions = [...(message.reactions || [])];
        const existingReactionIndex = updatedReactions.findIndex(
          r => r.userId === userId
        );
        
        if (existingReactionIndex !== -1) {
          // If same emoji, remove it
          if (updatedReactions[existingReactionIndex].emoji === emoji) {
            updatedReactions.splice(existingReactionIndex, 1);
          } else {
            // If different emoji, update it
            updatedReactions[existingReactionIndex] = { userId, emoji };
          }
        } else {
          // Add new reaction
          updatedReactions.push({ userId, emoji });
        }
        
        return {
          messages: state.messages.map(msg => 
            msg._id === messageId 
              ? { ...msg, reactions: updatedReactions }
              : msg
          )
        };
      });
    });

    socket.on("messageEdited", (updatedMessage) => {
      set(state => ({
        messages: state.messages.map(message => 
          message._id === updatedMessage._id ? updatedMessage : message
        )
      }));
    });

    socket.on("userTyping", ({ userId }) => {
      get().userStartedTyping(userId);
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      get().userStoppedTyping(userId);
    });

    socket.on("conversationDeleted", (senderUserId) => {
      const { selectedUser } = get();
      
      // If this is the conversation we're currently viewing, update all messages
      if (selectedUser && selectedUser._id === senderUserId) {
        set(state => ({
          messages: state.messages.map(message => ({
            ...message,
            isDeleted: true,
            text: "",
            image: null
          }))
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("newMessage");
    socket.off("messageSeen");
    socket.off("messageDeleted");
    socket.off("messageReaction");
    socket.off("messageEdited");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("conversationDeleted");
  },
}));
