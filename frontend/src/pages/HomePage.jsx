import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { useEffect, useState } from "react";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Track window size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-16 px-0 sm:pt-20 sm:px-4">
        <div className="bg-base-100 w-full h-[calc(100vh-4rem)] sm:rounded-lg sm:shadow-cl sm:max-w-6xl sm:h-[calc(100vh-8rem)]">
          <div className="flex h-full overflow-hidden sm:rounded-lg">
            {/* On mobile: Show sidebar only when no chat is selected */}
            {(!selectedUser || !isMobile) && (
              <Sidebar />
            )}
            
            {/* On mobile: When no user is selected, hide the right panel 
                On desktop: Always show the right panel */}
            <div className={`flex-1 flex overflow-hidden ${(!selectedUser && isMobile) ? 'hidden' : ''}`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer isMobile={isMobile} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
