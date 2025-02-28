import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { discoverTopics, resetTopicDiscovery } from '../store/topicsSlice';
import { setSearchedTopicString, resetCommonState } from '../store/commonSlice';

interface SearchTopicsProps {
  onOpenTopics: () => void;
  glowEffect?: boolean;
  disabled?: boolean;
  onOpenAuthSheet: () => void;
}

export function SearchTopics({
  onOpenTopics,
  glowEffect,
  disabled,
  onOpenAuthSheet,
}: SearchTopicsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [previousQuery, setPreviousQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useAppDispatch();
  const { loading: isLoading, error } = useAppSelector((state) => state.topics);
  const selectedTopicIds = useAppSelector(
    (state) => state.commonState.selectedTopicIds
  );
  const { isAuthenticated, token } = useAuth();
  const { topics } = useAppSelector((state) => state.topics);

  // Reset topic discovery when search query changes significantly
  useEffect(() => {
    // Only reset if the query has changed significantly (more than just whitespace or case)
    if (searchQuery.trim().toLowerCase() !== previousQuery.trim().toLowerCase() && previousQuery) {
      dispatch(resetTopicDiscovery());
      dispatch(resetCommonState());
    }
  }, [searchQuery, previousQuery, dispatch]);

  // Clear error message when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      setErrorMessage('');
    }
  }, [isAuthenticated]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setErrorMessage('Search query cannot be empty.');
      return;
    }
    
    if (searchQuery.trim().length < 10) {
      setErrorMessage('Search query must be at least 10 characters.');
      return;
    }
    
    // Check current authentication state directly from localStorage as well
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) {
      // Just open auth sheet without error message
      onOpenAuthSheet();
      return;
    }
    
    setErrorMessage(''); // Clear previous errors
    dispatch(setSearchedTopicString(searchQuery));
    
    try {
      // Store the current query for comparison
      setPreviousQuery(searchQuery);
      
      // Use the token from auth hook or from localStorage if available
      await dispatch(discoverTopics({ query: searchQuery, token: currentToken })).unwrap();
      onOpenTopics();
    } catch (err: any) {
      console.error('Search error:', err);
      if (err === 'Authentication required') {
        // Just open auth sheet without error message
        onOpenAuthSheet();
      } else {
        setErrorMessage('An error occurred while searching.');
      }
    }
  };

  const isSearchEnabled = searchQuery.trim().length >= 10;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search or use suggested prompts"
          className={`w-full bg-zinc-800/30 backdrop-blur-lg rounded-t-lg p-4 pr-10 text-white placeholder-zinc-400 focus:outline-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isSearchEnabled && !disabled) {
              handleSearch();
            }
          }}
          disabled={disabled}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !isSearchEnabled || disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search
              className={`w-5 h-5 ${
                isSearchEnabled && !disabled
                  ? 'text-white cursor-pointer'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
            />
          )}
        </button>
      </div>
      {(errorMessage || error) && (
        <p className="text-red-500 text-sm ml-5 mb-12">{errorMessage || error}</p>
      )}
      <button
        onClick={handleSearch}
        disabled={!isSearchEnabled || isLoading || disabled}
        className={`w-full bg-zinc-800/30 backdrop-blur-lg rounded-lg p-4 flex items-center justify-between text-left transition-all ${
          isSearchEnabled && !isLoading && !disabled
            ? 'cursor-pointer hover:bg-zinc-700/30'
            : 'cursor-not-allowed opacity-50'
        } ${
          glowEffect
            ? 'animate-pulse ring-2 ring-purple-500 ring-opacity-50'
            : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-white">
            Discover topics{' '}
            {selectedTopicIds.length > 0 && topics.length > 0 &&
              `(${selectedTopicIds.length}/${topics.length})`}
          </span>
        </div>
        <span className="text-zinc-400">↓</span>
      </button>
    </div>
  );
}