import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, UserPlus, Users, X } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    searchUsers,
    clearUserSearch,
    users,
    searchedUsers,
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    isSearchingUsers,
    typingUsers,
    unreadCounts 
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    // Handle search term changes with a small delay
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchUsers(searchTerm.trim());
        setIsSearchMode(true);
      } else if (searchTerm.trim().length === 0) {
        clearUserSearch();
        setIsSearchMode(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, searchUsers, clearUserSearch]);

  // Determine which users to display
  const displayedUsers = isSearchMode ? searchedUsers : users;
  
  // Filter by online status if needed
  const filteredUsers = displayedUsers.filter(user => 
    !showOnlineOnly || onlineUsers.includes(user._id)
  );
  
  // Sort users: first by unread count, then by typing status, then by online status
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // First sort by unread messages (descending)
    const unreadA = unreadCounts[a._id] || 0;
    const unreadB = unreadCounts[b._id] || 0;
    if (unreadB !== unreadA) return unreadB - unreadA;
    
    // Then sort by typing status
    const isTypingA = typingUsers[a._id] || false;
    const isTypingB = typingUsers[b._id] || false;
    if (isTypingA !== isTypingB) return isTypingB ? 1 : -1;
    
    // Then sort by online status
    const isOnlineA = onlineUsers.includes(a._id);
    const isOnlineB = onlineUsers.includes(b._id);
    if (isOnlineA !== isOnlineB) return isOnlineB ? 1 : -1;
    
    // Finally, sort alphabetically by name
    return a.fullName.localeCompare(b.fullName);
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  const clearSearch = () => {
    setSearchTerm("");
    setIsSearchMode(false);
    clearUserSearch();
  };

  return (
    <aside className="flex-shrink-0 w-full lg:w-80 border-r border-base-300 flex flex-col bg-base-100 h-full">
      <div className="border-b border-base-300 w-full p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSearchMode ? (
              <UserPlus className="size-5" />
            ) : (
              <Users className="size-5" />
            )}
            <span className="font-medium">
              {isSearchMode ? "Find People" : "Contacts"}
            </span>
          </div>
        </div>
        
        {/* Search box */}
        <div className={`mt-3 relative ${searchFocused ? 'ring-2 ring-primary rounded-lg' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-base-content/40" />
          </div>
          <input
            type="text"
            placeholder={isSearchMode ? "Search by name or username" : "Search contacts or find new people"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="input input-sm input-bordered w-full pl-9"
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="size-4 text-base-content/40" />
            </button>
          )}
        </div>
        
        {/* Online filter toggle */}
        <div className="mt-3 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.filter(id => id !== authUser?._id).length} online)
          </span>
        </div>

        {/* Search info text */}
        {isSearchMode && searchTerm.length > 0 && searchTerm.length < 2 && (
          <div className="text-xs text-base-content/60 mt-2">
            Type at least 2 characters to search
          </div>
        )}
        
        {/* Loading indicator for search */}
        {isSearchingUsers && (
          <div className="text-xs text-base-content/60 mt-2 animate-pulse">
            Searching...
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3 flex-1">
        {/* Main users list */}
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => (
            <UserItem 
              key={user._id}
              user={user}
              isSelected={selectedUser?._id === user._id}
              onSelect={() => setSelectedUser(user)}
              isOnline={onlineUsers.includes(user._id)}
              isTyping={typingUsers[user._id] || false}
              unreadCount={unreadCounts[user._id] || 0}
              isNewContact={isSearchMode && !users.some(u => u._id === user._id)}
            />
          ))
        ) : (
          <div className="text-center text-zinc-500 py-4">
            {searchTerm && isSearchMode
              ? "No users match your search" 
              : showOnlineOnly 
                ? "No online contacts" 
                : "No contacts found"}
            
            {!searchTerm && !isSearchMode && users.length === 0 && (
              <div className="pt-2 px-4">
                <p className="text-sm">Start a conversation by searching for users</p>
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setIsSearchMode(true);
                  }}
                  className="btn btn-sm btn-primary mt-2"
                >
                  <UserPlus className="size-4" />
                  Find people
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

// User item component (extracted for cleaner code)
const UserItem = ({ 
  user, 
  isSelected, 
  onSelect, 
  isOnline, 
  isTyping, 
  unreadCount, 
  isNewContact = false 
}) => {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-3 flex items-center gap-3
        hover:bg-base-300 transition-colors
        ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
      `}
    >
      <div className="relative">
        <img
          src={user.profilePic || "/avatar.png"}
          alt={user.fullName}
          className="size-12 object-cover rounded-full"
        />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 size-3 bg-green-500 
            rounded-full ring-2 ring-base-100"
          />
        )}
      </div>

      {/* User info */}
      <div className="text-left min-w-0 flex-1">
        <div className="font-medium truncate flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {user.fullName}
            {isNewContact && (
              <span className="badge badge-sm badge-primary">New</span>
            )}
          </span>
          {unreadCount > 0 && (
            <span className="badge badge-primary badge-sm">{unreadCount}</span>
          )}
        </div>
        <div className="text-sm text-zinc-400 flex items-center">
          {isTyping ? (
            <span className="text-primary">typing...</span>
          ) : (
            <span>@{user.username || user.fullName.toLowerCase().replace(/\s+/g, '')}</span>
          )}
        </div>
      </div>
    </button>
  );
};

export default Sidebar;
