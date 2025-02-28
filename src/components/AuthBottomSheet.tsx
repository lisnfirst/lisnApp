import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthBottomSheet({ isOpen, onClose }: AuthBottomSheetProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
    } catch (err) {
      // Error is handled by the hook
      console.error('Auth error:', err);
    }
  };

  const handleModeSwitch = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      clearError();
      setIsAnimating(false);
    }, 300);
  };

  return (
    <>
      <div 
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-black rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
            <button onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm text-zinc-400 mb-2">
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm text-zinc-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-800 rounded-lg pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg py-3 text-sm font-medium mt-8 relative"
                >
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : isLogin ? 'Login' : 'Register'}
                </button>
              </div>
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}