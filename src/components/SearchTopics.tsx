import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTopics } from '../store/topicsSlice';
import { setDiscoverTopics } from '../store/commonSlice';

interface SearchTopicsProps {
  onOpenTopics: () => void;
}

export function SearchTopics({ onOpenTopics }: SearchTopicsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.topics);
  const [loader, setLoader] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setErrorMessage('Search query cannot be empty.');
      return;
    }
    if (searchQuery.trim().length < 10) {
      setErrorMessage('Search query must be at least 10 characters.');
      return;
    }

    setErrorMessage(''); // Clear previous errors
    try {
      setLoader(true);
      const fetchedTopics = await dispatch(fetchTopics(searchQuery)).unwrap();
      if (fetchedTopics?.topics) {
        dispatch(setDiscoverTopics(fetchedTopics.topics));
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error('Search error:', error);
      setErrorMessage('An error occurred while searching.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search or use suggested prompts"
          className="w-full bg-zinc-800/30 backdrop-blur-lg rounded-t-lg p-4 pr-10 text-white placeholder-zinc-400 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
        >
          {loader ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search
              className={`w-5 h-5 text-zinc-400 ${
                loading ? 'opacity-50' : 'hover:text-white'
              }`}
            />
          )}
        </button>
      </div>
      {errorMessage && (
        <p className="text-red-500 text-sm ml-5 mb-12">{errorMessage}</p>
      )}
      {error && <p className="text-red-500 text-sm ml-5 mb-12">{error}</p>}
      <button
        onClick={onOpenTopics}
        className="w-full bg-zinc-800/30 backdrop-blur-lg rounded-b-lg p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-white">Discover topics</span>
        </div>
        <span className="text-zinc-400">↓</span>
      </button>
    </div>
  );
}