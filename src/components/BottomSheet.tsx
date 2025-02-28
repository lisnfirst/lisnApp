import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setDiscoverTopics, setSelectedTopicIds } from '../store/commonSlice';
import { RootState } from '../store/store';
import { Topic } from '../services/api/topics';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG } from '../config/api';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
}

export function BottomSheet({ isOpen, onClose, disabled }: BottomSheetProps) {
  const dispatch = useDispatch();
  const { topics } = useSelector((state: RootState) => state.topics);
  const selectedTopicIds = useSelector((state: RootState) => state.commonState.selectedTopicIds);
  const searchedTopicString = useSelector((state: RootState) => state.commonState.searchedTopicString);
  const [localSelectedTopicIds, setLocalSelectedTopicIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { token } = useAuth();

  // Initialize local state when the sheet opens or topics change
  useEffect(() => {
    if (topics?.length && isOpen) {
      // If we already have selections, use them
      if (selectedTopicIds.length > 0) {
        setLocalSelectedTopicIds(selectedTopicIds);
        setAllSelected(selectedTopicIds.length === topics.length);
      } else {
        // Otherwise select all topics by default
        const allTopicIds = topics.map((topic: Topic) => topic.id);
        setLocalSelectedTopicIds(allTopicIds);
        setAllSelected(true);
        dispatch(setSelectedTopicIds(allTopicIds));
      }
    }
  }, [topics, isOpen, dispatch, selectedTopicIds]);

  const toggleTopic = (topicId: number) => {
    if (disabled) return;
    
    const newSelectedTopics = localSelectedTopicIds.includes(topicId)
      ? localSelectedTopicIds.filter(id => id !== topicId)
      : [...localSelectedTopicIds, topicId].slice(0, 8);
    
    setLocalSelectedTopicIds(newSelectedTopics);
    setAllSelected(newSelectedTopics.length === topics.length);
  };

  const toggleSelectAll = () => {
    if (disabled) return;
    
    if (allSelected) {
      // Deselect all
      setLocalSelectedTopicIds([]);
      setAllSelected(false);
    } else {
      // Select all (up to 8)
      const allTopicIds = topics.slice(0, 8).map((topic: Topic) => topic.id);
      setLocalSelectedTopicIds(allTopicIds);
      setAllSelected(true);
    }
  };

  const handleRegenerateTopics = async () => {
    if (disabled || !searchedTopicString || isRegenerating) return;
    
    try {
      setIsRegenerating(true);
      const currentToken = token || localStorage.getItem('auth_token');
      
      if (!currentToken) {
        console.error('Authentication required to regenerate topics');
        return;
      }
      
      // Use the direct API endpoint to regenerate topics
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/topics/discover?user_query=${encodeURIComponent(searchedTopicString)}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to regenerate topics');
      }
      
      const data = await response.json();
      
      // Get all topic IDs from the new topics
      const allTopicIds = data.data.topics.map((topic: Topic) => topic.id);
      
      // Update the topics in the store
      dispatch(setDiscoverTopics(data.data.topics || []));
      
      // After regeneration, select all new topics by default
      setLocalSelectedTopicIds(allTopicIds);
      setAllSelected(true);
      
      // Update the global selected topic IDs
      dispatch(setSelectedTopicIds(allTopicIds));
      
    } catch (error) {
      console.error('Failed to regenerate topics:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    // Update the global state with local selections
    dispatch(setSelectedTopicIds(localSelectedTopicIds));
    
    const selectedTopics = topics?.filter((topic: Topic) =>
      localSelectedTopicIds.includes(topic.id)
    );
    dispatch(setDiscoverTopics(selectedTopics || []));
    onClose();
  };

  const handleCancel = () => {
    // Reset local selections to match global state
    setLocalSelectedTopicIds(selectedTopicIds);
    setAllSelected(selectedTopicIds.length === topics.length);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-zinc-900 rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold">Craft your audiobyte</h2>
              <button onClick={handleCancel}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-zinc-400">
              select up to 8 topics ({localSelectedTopicIds.length}/8)
            </p>
          </div>

          {/* Regenerate and Select/Unselect All Buttons */}
          <div className="p-4 border-b border-zinc-800 flex gap-4">
            {/* <button
              onClick={handleRegenerateTopics}
              disabled={disabled || !searchedTopicString || isRegenerating}
              className={`flex-1 bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between text-left transition-colors ${
                disabled || !searchedTopicString || isRegenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800'
              }`}
            >
              <div className="flex-1 mr-4 flex items-center gap-2">
                {isRegenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-left block">Regenerating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-left block">Regenerate</span>
                  </>
                )}
              </div>
            </button> */}
            
            <button
              onClick={toggleSelectAll}
              disabled={disabled || topics.length === 0}
              className={`flex-1 bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between text-left transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800'
              }`}
            >
              <div className="flex-1 mr-4">
                <span className="text-left block">{allSelected ? 'Unselect All' : 'Select All'}</span>
              </div>
              <div
                className={`flex-none w-5 h-5 flex items-center justify-center border-2 ${
                  allSelected
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-zinc-600'
                }`}
                style={{ borderRadius: '2px' }}
              >
                {allSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4 h-4 text-white"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Scrollable Topics Area */}
          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            {isRegenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-400">Generating new topics...</p>
              </div>
            ) : topics?.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                No topics found. Try a different search query.
              </div>
            ) : (
              topics?.map((topic: Topic) => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`w-full bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between text-left transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' :
                    localSelectedTopicIds.length >= 8 && !localSelectedTopicIds.includes(topic.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-zinc-800'
                  }`}
                  disabled={disabled || (localSelectedTopicIds.length >= 8 && !localSelectedTopicIds.includes(topic.id))}
                >
                  <div className="flex-1 mr-4">
                    <span className="text-left block">{topic.title}</span>
                  </div>
                  <div
                    className={`flex-none w-5 h-5 flex items-center justify-center border-2 ${
                      localSelectedTopicIds.includes(topic.id)
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-zinc-600'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {localSelectedTopicIds.includes(topic.id) && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-4 h-4 text-white"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Fixed Button Area */}
          <div className="p-4 flex gap-4 border-t border-zinc-800 bg-zinc-900">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={localSelectedTopicIds.length === 0 || disabled || isRegenerating}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                localSelectedTopicIds.length === 0 || disabled || isRegenerating
                  ? 'bg-blue-600/50 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              Confirm ({localSelectedTopicIds.length})
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-30" onClick={handleCancel} />
      )}
    </>
  );
}