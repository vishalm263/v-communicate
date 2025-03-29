import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Computer, Moon, Send, Settings, Sun } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useState, useEffect } from "react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

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
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
        </div>

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

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {authUser && (
          <div className="space-y-3 pt-4 border-t border-base-content/10">
            <h2 className="text-lg font-medium">Privacy</h2>
            <p className="text-sm text-base-content/70">Control your visibility and privacy settings</p>

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
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
