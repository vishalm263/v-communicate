import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Edit, MoreVertical, Reply, Smile, Trash, X } from "lucide-react";

// Available emoji reactions
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setReplyTo,
    startEditingMessage,
    deleteMessage,
    reactToMessage,
    typingUsers,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleReplyToMessage = (message) => {
    setReplyTo(message);
    setShowActionsMenu(null);
  };

  const handleEditMessage = (message) => {
    startEditingMessage(message);
    setShowActionsMenu(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
    }
    setShowActionsMenu(null);
  };

  const handleReaction = (messageId, emoji) => {
    reactToMessage(messageId, emoji);
    setShowEmojiPicker(null); // Close emoji picker after selecting
  };

  const toggleEmojiPicker = (messageId) => {
    setShowEmojiPicker(showEmojiPicker === messageId ? null : messageId);
    // Close action menu when opening emoji picker
    setShowActionsMenu(null);
  };

  const toggleActionsMenu = (messageId) => {
    setShowActionsMenu(showActionsMenu === messageId ? null : messageId);
    // Close emoji picker when opening actions menu
    setShowEmojiPicker(null);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const isUserTyping = typingUsers[selectedUser._id] || false;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            <div className="text-center">
              <span className="text-xs bg-base-300 text-base-content/70 px-2 py-1 rounded-full">
                {date}
              </span>
            </div>
            
            {dateMessages.map((message) => {
              const isMyMessage = message.senderId === authUser._id;
              const hasReactions = message.reactions && message.reactions.length > 0;
              
              return (
                <div
                  key={message._id}
                  className={`chat ${isMyMessage ? "chat-end" : "chat-start"} group relative`}
                >
                  {/* Message actions dropdown button */}
                  <div className={`absolute ${isMyMessage ? 'right-0' : 'left-0'} -top-3 z-10`}>
                    <button
                      onClick={() => toggleActionsMenu(message._id)}
                      className="btn btn-xs btn-ghost btn-circle bg-base-200"
                    >
                      <MoreVertical className="size-3" />
                    </button>
                  </div>
                  
                  {/* Message actions dropdown menu */}
                  {showActionsMenu === message._id && (
                    <div 
                      className={`absolute ${isMyMessage ? 'right-0' : 'left-0'} top-6 z-20
                                  bg-base-200 rounded-lg shadow-lg py-1 w-32`}
                    >
                      <button
                        onClick={() => handleReplyToMessage(message)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-base-300"
                      >
                        <Reply className="size-3.5" />
                        <span>Reply</span>
                      </button>
                      
                      <button
                        onClick={() => toggleEmojiPicker(message._id)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-base-300"
                      >
                        <Smile className="size-3.5" />
                        <span>React</span>
                      </button>
                      
                      {isMyMessage && !message.isDeleted && (
                        <>
                          <button
                            onClick={() => handleEditMessage(message)}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-base-300"
                          >
                            <Edit className="size-3.5" />
                            <span>Edit</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-base-300 text-error"
                          >
                            <Trash className="size-3.5" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Emoji picker */}
                  {showEmojiPicker === message._id && (
                    <div className={`absolute ${isMyMessage ? 'right-0' : 'left-0'} top-6 z-20
                                    bg-base-200 p-1.5 rounded-lg shadow-lg flex gap-1`}>
                      {EMOJI_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message._id, emoji)}
                          className="hover:bg-base-300 p-1 rounded-full transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="chat-image avatar">
                    <div className="size-10 rounded-full border">
                      <img
                        src={
                          isMyMessage
                            ? authUser.profilePic || "/avatar.png"
                            : selectedUser.profilePic || "/avatar.png"
                        }
                        alt="profile pic"
                      />
                    </div>
                  </div>
                  
                  <div className="chat-header mb-1 flex items-center gap-1">
                    <span className="text-xs">{isMyMessage ? "You" : selectedUser.fullName}</span>
                    <time className="text-xs opacity-50">
                      {formatMessageTime(message.createdAt)}
                    </time>
                    {message.lastEdited && (
                      <span className="text-xs opacity-50">(edited)</span>
                    )}
                  </div>
                  
                  <div className={`chat-bubble ${message.isDeleted ? "bg-base-300 text-base-content/60" : ""}`}>
                    {/* Reply reference */}
                    {message.replyTo && (
                      <div className="mb-1 p-1.5 bg-base-300/30 rounded text-sm flex items-start gap-1.5">
                        <Reply className="size-3 mt-0.5 shrink-0" />
                        <div className="truncate flex-1">
                          <div className="font-medium text-xs">
                            {message.replyTo.senderId === authUser._id ? "You" : selectedUser.fullName}
                          </div>
                          <div className="opacity-90 truncate">
                            {message.replyTo.isDeleted 
                              ? "Message deleted" 
                              : (message.replyTo.text || (message.replyTo.image ? "Image" : ""))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Message content */}
                    {message.image && !message.isDeleted && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    
                    {message.isDeleted ? (
                      <p className="italic text-base-content/40 text-sm">Message deleted</p>
                    ) : (
                      message.text && <p>{message.text}</p>
                    )}
                  </div>
                  
                  {/* Message reactions */}
                  {hasReactions && (
                    <div className={`flex gap-1 mt-1 ${isMyMessage ? "justify-end" : "justify-start"}`}>
                      {message.reactions.map((reaction, index) => (
                        <span key={index} className="bg-base-200 px-1.5 py-0.5 rounded-full text-sm">
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Message seen status - only show for my messages */}
                  {isMyMessage && (
                    <div className="chat-footer opacity-70 flex justify-end mt-1">
                      {message.seen ? (
                        <div className="flex items-center text-xs gap-1">
                          <CheckCheck className="size-3 text-primary" />
                          <span>Seen</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs gap-1">
                          <Check className="size-3" />
                          <span>Sent</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isUserTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>
            <div className="chat-bubble min-h-0 bg-base-300">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
