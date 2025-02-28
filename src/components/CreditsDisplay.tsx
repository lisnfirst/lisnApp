import { useEffect, useState } from 'react';
import { Infinity } from 'lucide-react';
import { useCredits } from '../hooks/useCredits';

interface CreditsDisplayProps {
  onAudioGenerated?: boolean;
}

export function CreditsDisplay({ onAudioGenerated }: CreditsDisplayProps) {
  const { credits, unlimited, isLoading, fetchCredits } = useCredits();
  const [visible, setVisible] = useState(false);

  // Refetch credits when audio is generated
  useEffect(() => {
    if (onAudioGenerated) {
      fetchCredits();
    }
  }, [onAudioGenerated, fetchCredits]);

  // Fetch credits when component mounts if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchCredits().then(() => {
        setVisible(true);
      });
    }
  }, [fetchCredits]);

  // If user is not logged in or credits couldn't be fetched
  if ((credits === null && !unlimited) || !visible) {
    return null;
  }

  return (
    <button className="bg-purple-900/50 px-4 py-1.5 rounded-full text-sm flex items-center gap-2 animate-fadeIn">
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-purple-200 border-t-transparent rounded-full animate-spin"></div>
      ) : unlimited ? (
        <Infinity className="w-4 h-4 text-purple-200" />
      ) : (
        <span className="text-purple-200">{credits}</span>
      )}
      <span>Credits</span>
    </button>
  );
}