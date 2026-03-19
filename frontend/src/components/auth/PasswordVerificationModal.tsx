import { useState } from "react";
import { verifyUserPassword } from "../../api/auth";

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
}

const PasswordVerificationModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Verify Your Password",
  message = "Enter your password to continue:",
}: PasswordVerificationModalProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError("Password cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const isValid = await verifyUserPassword(password);
      
      if (isValid) {
        onSuccess();
        handleClose();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      setError("Failed to verify password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/20 z-40 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm w-full border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100/50 cursor-pointer"
              onClick={handleClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-5 leading-relaxed">{message}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-transparent pr-10 transition-all duration-200"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div className="mt-2 bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100/50 text-gray-600 rounded-lg hover:bg-gray-200/50 transition-all duration-200 cursor-pointer font-medium text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium text-sm shadow-lg shadow-gray-800/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordVerificationModal;
