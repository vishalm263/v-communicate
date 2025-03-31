import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Bell, Computer, Lock, Moon, Settings, Sun, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser, updatePrivacySettings, isUpdatingPrivacy } = useAuthStore();
  const [hideActiveStatus, setHideActiveStatus] = useState(false);
  
  useEffect(() => {
    if (authUser) {
      setHideActiveStatus(authUser.hideActiveStatus || false);
    }
  }, [authUser]);

  const toggleHideActiveStatus = async () => {
    if (!authUser) return;
    const newStatus = !hideActiveStatus;
    setHideActiveStatus(newStatus);
    await updatePrivacySettings(newStatus);
  };

  const getThemeIcon = (themeValue) => {
    switch (themeValue) {
      case "light":
        return <Sun className="size-5" />;
      case "dark":
        return <Moon className="size-5" />;
      case "system":
        return <Computer className="size-5" />;
      default:
        return null;
    }
  };

  const getThemeName = (themeValue) => {
    switch (themeValue) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return themeValue.charAt(0).toUpperCase() + themeValue.slice(1);
    }
  };

  return (
    <div className="min-h-screen container mx-auto px-4 pt-20 pb-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Settings className="size-6" />
          Settings
        </h1>
        <p className="text-base-content/70">
          Manage your preferences and account settings
        </p>
      </div>
      
      {/* Settings sections */}
      <div className="space-y-8">
        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-base-300 pb-2">
            <Sun className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Appearance</h2>
          </div>
          
          <div className="pl-2">
            <h3 className="text-base font-medium mb-2">Theme</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Choose a theme for your chat interface
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`
                    group flex flex-col items-center gap-2 p-3 rounded-lg transition-colors border
                    ${theme === t 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "border-base-300 hover:bg-base-200"}
                  `}
                  onClick={() => setTheme(t)}
                >
                  {getThemeIcon(t)}
                  <span className="text-sm font-medium">
                    {getThemeName(t)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Privacy Section */}
        {authUser && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-base-300 pb-2">
              <Lock className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Privacy</h2>
            </div>
            
            <div className="pl-2">
              <h3 className="text-base font-medium mb-2">Visibility</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Control who can see your online status
              </p>
              
              <div className="form-control w-full bg-base-100 p-4 rounded-lg border border-base-300">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={hideActiveStatus}
                    onChange={toggleHideActiveStatus}
                    disabled={isUpdatingPrivacy}
                  />
                  <div>
                    <span className="label-text font-medium">Hide online status</span>
                    <p className="text-xs text-base-content/70 mt-1">
                      Others won't be able to see when you're online
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>
        )}
        
        {/* Notifications Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-base-300 pb-2">
            <Bell className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Notifications</h2>
          </div>
          
          <div className="pl-2">
            <p className="text-sm text-base-content/70 mb-4">
              Notification settings will be available in a future update
            </p>
            
            <div className="bg-base-100 p-4 rounded-lg border border-base-300 text-center opacity-70">
              <p className="text-sm">Coming soon</p>
            </div>
          </div>
        </section>
        
        {/* Account Section */}
        {authUser && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-base-300 pb-2">
              <User className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Account</h2>
            </div>
            
            <div className="pl-2">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={authUser.profilePic || "/avatar.png"} 
                  alt={authUser.fullName} 
                  className="size-16 rounded-full object-cover border-2 border-base-300" 
                />
                <div>
                  <h3 className="font-medium">{authUser.fullName}</h3>
                  <p className="text-sm text-base-content/70">@{authUser.username}</p>
                </div>
              </div>
              
              <Link 
                to="/profile" 
                className="btn btn-outline btn-primary w-full"
              >
                Manage Account
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
