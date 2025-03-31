import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="px-3 sm:px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-base sm:text-lg font-bold">V-Communicate</h1>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to={"/settings"}
              className="btn btn-sm btn-ghost p-1 sm:p-2"
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only sm:not-sr-only sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="btn btn-sm btn-ghost p-1 sm:p-2">
                  <User className="w-5 h-5" />
                  <span className="sr-only sm:not-sr-only sm:inline">Profile</span>
                </Link>

                <button className="btn btn-sm btn-ghost p-1 sm:p-2" onClick={logout}>
                  <LogOut className="w-5 h-5" />
                  <span className="sr-only sm:not-sr-only sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
