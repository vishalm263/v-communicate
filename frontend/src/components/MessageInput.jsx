import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Edit, Image, Reply, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  
  const { 
    sendMessage, 
    selectedUser, 
    replyingTo, 
    cancelReply,
    messageBeingEdited,
    cancelEditingMessage,
    editMessage,
    isSendingMessage 
  } = useChatStore();
  const { socket } = useAuthStore();

  // Set initial text if editing a message
  useEffect(() => {
    if (messageBeingEdited) {
      setText(messageBeingEdited.text || "");
      inputRef.current?.focus();
    }
  }, [messageBeingEdited]);

  // Handle typing events
  useEffect(() => {
    if (!selectedUser || !socket) return;
    
    return () => {
      // Make sure we stop typing indicator when unmounting
      if (isTyping) {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }
    };
  }, [selectedUser, socket, isTyping]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Handle typing indicator
    if (socket && selectedUser) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing", { receiverId: selectedUser._id });
      }
      
      // Clear existing timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      
      // Set new timeout
      const timeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isSendingMessage) return;
    
    if (messageBeingEdited) {
      handleEditMessage();
      return;
    }
    
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        replyToId: replyingTo?._id
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Stop typing indicator
      if (isTyping && socket) {
        setIsTyping(false);
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  const handleEditMessage = async () => {
    if (!messageBeingEdited || !text.trim()) return;
    
    try {
      await editMessage(messageBeingEdited._id, text.trim());
      setText("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const cancelEditing = () => {
    cancelEditingMessage();
    setText("");
  };

  return (
    <div className="p-2 sm:p-4 w-full border-t border-base-200">
      {replyingTo && (
        <div className="mb-2 p-2 bg-base-200 rounded-lg flex items-start gap-2">
          <Reply className="size-4 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary">
              Replying to {replyingTo.senderId === selectedUser._id ? selectedUser.fullName : "yourself"}
            </div>
            <div className="text-sm truncate">
              {replyingTo.text || (replyingTo.image ? "Image" : "")}
            </div>
          </div>
          <button 
            onClick={cancelReply} 
            className="text-base-content/50 hover:text-base-content p-1 rounded-full hover:bg-base-300"
            aria-label="Cancel reply"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      
      {messageBeingEdited && (
        <div className="mb-2 p-2 bg-base-200 rounded-lg flex items-start gap-2">
          <Edit className="size-4 text-amber-500 shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-amber-500">
              Editing message
            </div>
          </div>
          <button 
            onClick={cancelEditing} 
            className="text-base-content/50 hover:text-base-content p-1 rounded-full hover:bg-base-300"
            aria-label="Cancel editing"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg h-11"
            placeholder={messageBeingEdited ? "Edit your message..." : "Type a message..."}
            value={text}
            onChange={handleTextChange}
            ref={inputRef}
            disabled={isSendingMessage}
          />
          
          {!messageBeingEdited && (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
                disabled={isSendingMessage}
              />

              <button
                type="button"
                className="btn btn-circle h-11 w-11 btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSendingMessage}
                aria-label="Attach image"
              >
                <Image className="size-5 text-base-content/60" />
              </button>
            </>
          )}
        </div>
        
        <button
          type="submit"
          className="btn btn-circle btn-primary h-11 w-11"
          disabled={(!text.trim() && !imagePreview) || isSendingMessage}
          aria-label="Send message"
        >
          <Send className="size-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
