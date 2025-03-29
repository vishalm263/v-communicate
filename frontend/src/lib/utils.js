// Format message time in a user-friendly way
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // If the message was sent today, show only the time (HH:MM)
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If message was sent yesterday, show "Yesterday, HH:MM"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If message was sent this year, show "MMM DD, HH:MM"
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    }) + ', ' + messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Otherwise, show "MMM DD, YYYY, HH:MM"
  return messageDate.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }) + ', ' + messageDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Format last seen timestamp in a user-friendly way
export const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Offline";
  
  const lastSeen = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInMinutes < 48 * 60) {
    return "Yesterday";
  } else if (diffInMinutes < 7 * 24 * 60) {
    const days = Math.floor(diffInMinutes / (24 * 60));
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return lastSeen.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: lastSeen.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};
