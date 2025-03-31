import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

const ConfirmationModal = ({ 
  isOpen,
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to perform this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon = <AlertTriangle className="size-5 text-warning" />,
  isDestructive = false
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Handle keypress events (Escape to close)
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close if clicked outside the modal
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
         onClick={handleOutsideClick}>
      <div 
        ref={modalRef} 
        className="w-full max-w-md bg-base-100 rounded-lg shadow-xl animate-scaleIn"
      >
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-4" />
          </button>
        </div>
        
        <div className="p-4 pt-3">
          <p className="text-base-content/80">{message}</p>
        </div>
        
        <div className="flex justify-end gap-2 p-4 pt-0">
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-ghost"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn btn-sm ${isDestructive ? 'btn-error' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 