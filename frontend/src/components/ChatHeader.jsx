import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { ChevronLeft, MoreVertical, Trash } from "lucide-react";
import { formatLastSeen } from "../lib/utils";
import { useState } from "react";

const ChatHeader = ({ isMobile, onBackClick }) => {
  const { selectedUser, typingUsers, deleteConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const isOnline = onlineUsers.includes(selectedUser?._id);
  const isTyping = typingUsers[selectedUser?._id] || false;
  
  const handleDeleteConversation = async () => {
    if (window.confirm("Are you sure you want to delete this entire conversation?")) {
      await deleteConversation(selectedUser._id);
    }
    setShowDropdown(false);
  };

  return (
    <div className="border-b border-base-300 p-3 sm:p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button 
            onClick={onBackClick}
            className="mr-1 p-1.5 rounded-full hover:bg-base-200"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="relative">
          <img
            src={selectedUser?.profilePic || "/avatar.png"}
            alt={selectedUser?.fullName}
            className="h-10 w-10 rounded-full object-cover"
          />
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500
              ring-2 ring-base-100"
            />
          )}
        </div>
        <div>
          <h3 className="font-medium">{selectedUser?.fullName}</h3>
          <p className="text-xs text-base-content/60">
            {isTyping ? (
              <span className="text-primary">typing...</span>
            ) : isOnline ? (
              "Online"
            ) : (
              formatLastSeen(selectedUser?.updatedAt)
            )}
          </p>
        </div>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn btn-sm btn-ghost btn-circle"
        >
          <MoreVertical className="size-5" />
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-base-200 z-10">
            <div className="py-1">
              <button
                onClick={handleDeleteConversation}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-base-300 text-error"
              >
                <Trash className="size-4" />
                Delete conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
