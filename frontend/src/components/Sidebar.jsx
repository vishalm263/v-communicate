import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Menu, Search, Users, X } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    typingUsers,
    unreadCounts 
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Filter users based on search term and online status
  const filteredUsers = users
    .filter(user => 
      // Apply search filter if there's a search term
      searchTerm 
        ? (user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true
    )
    .filter(user => 
      // Apply online only filter if enabled
      showOnlineOnly ? onlineUsers.includes(user._id) : true
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

  return (
    <aside className="flex-shrink-0 w-full lg:w-80 border-r border-base-300 flex flex-col bg-base-100 h-full">
      <div className="border-b border-base-300 w-full p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5" />
            <span className="font-medium">Contacts</span>
          </div>
        </div>
        
        {/* Search box */}
        <div className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-base-content/40" />
          </div>
          <input
            type="text"
            placeholder="Search by name or username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-9"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
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
      </div>

      <div className="overflow-y-auto w-full py-3 flex-1">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
              </div>

              {/* User info */}
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium truncate flex items-center justify-between">
                  <span>{user.fullName}</span>
                  {unreadCounts[user._id] > 0 && (
                    <span className="badge badge-primary badge-sm">{unreadCounts[user._id]}</span>
                  )}
                </div>
                <div className="text-sm text-zinc-400 flex items-center">
                  {typingUsers[user._id] ? (
                    <span className="text-primary">typing...</span>
                  ) : (
                    <span>@{user.username || user.fullName.toLowerCase().replace(/\s+/g, '')}</span>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center text-zinc-500 py-4">
            {searchTerm 
              ? "No users match your search" 
              : showOnlineOnly 
                ? "No online users" 
                : "No contacts found"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
