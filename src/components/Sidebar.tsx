// import React from 'react';
import { X, Home, Settings, CreditCard, HelpCircle } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export function Sidebar({ isOpen, onClose, onLoginClick }: SidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full w-64 bg-zinc-900">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-zinc-800 rounded-lg">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-zinc-800 rounded-lg">
              <CreditCard className="w-5 h-5" />
              <span>Credits</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-zinc-800 rounded-lg">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-zinc-800 rounded-lg">
              <HelpCircle className="w-5 h-5" />
              <span>Help</span>
            </button>
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg py-2 text-sm font-medium"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}