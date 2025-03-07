import { useState, useRef, useEffect } from 'react';
import { Menu, Wand2, RefreshCw, PlayCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { BottomSheet } from './components/BottomSheet';
import { AuthBottomSheet } from './components/AuthBottomSheet';
import { AudioPlayer } from './components/AudioPlayer';
import { Dropdown } from './components/Dropdown';
import { SearchTopics } from './components/SearchTopics';
import { CreditsDisplay } from './components/CreditsDisplay';
import { Story, AudioTrack } from './types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store/store';
import { useAuth } from './hooks/useAuth';
import { audioByteApi } from './services/api/audioByte';
import logo from '../public/Lisn_Logomark_white.svg';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [duration, setDuration] = useState('3 minutes');
  const [style, setStyle] = useState('narrative');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showDiscoverGlow, setShowDiscoverGlow] = useState(false);
  const [audioByteData, setAudioByteData] = useState<any>(null);
  const [isAudioGenerated, setIsAudioGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const discoverButtonRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const { token, isAuthenticated } = useAuth();
  const { topics } = useSelector((state: RootState) => state.topics);
  const selectedTopicIds = useSelector(
    (state: RootState) => state.commonState.selectedTopicIds
  );
  const searchTopic = useSelector(
    (state: RootState) => state.commonState.searchedTopicString
  );
  const [searchedTopic, setSearchedTopic] = useState('');

  // Sample audio tracks data
  const audioTracks: AudioTrack[] = [
    { id: '1', title: 'Chapter 1: Early Life', duration: '5:30' },
    { id: '2', title: 'Chapter 2: Cricket Journey', duration: '4:45' },
    { id: '3', title: 'Chapter 3: Achievements', duration: '6:15' },
  ];

  // Sample suggested stories
  const suggestedStories: Story[] = [
    {
      id: '1',
      title: "Sachin Tendulkar's",
      subtitle: '99 drought',
      type: 'Raw',
      duration: '~5 min',
    },
    {
      id: '2',
      title: "Marie Curie's",
      subtitle: 'Discoveries',
      type: 'Narrative',
      duration: '~5 min',
    },
    {
      id: '3',
      title: "Nelson Mandela's",
      subtitle: 'leadership',
      type: 'Deep dive',
      duration: '~10 min',
    },
  ];
  
  const capitalizeAllWords = (str: string) => {
    return str
      .split(' ') // Split the string into words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' '); // Join the words back into a string
  };

  useEffect(() => {
    const result = capitalizeAllWords(searchTopic);
    setSearchedTopic(result);
  }, [searchTopic]);
  
  // Reset glow effect after animation
  useEffect(() => {
    if (showDiscoverGlow) {
      const timer = setTimeout(() => {
        setShowDiscoverGlow(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showDiscoverGlow]);

  // Clear error message when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      setErrorMessage(null);
    }
  }, [isAuthenticated]);

  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length <= maxLength
      ? text
      : text.substring(0, maxLength) + '...';
  };

  // Convert duration string to seconds
  const getDurationInSeconds = (durationStr: string): number => {
    const minutes = parseInt(durationStr.split(' ')[0], 10);
    return minutes * 60;
  };

  const handleCreateAudioByte = async () => {
    if (isAudioGenerated) {
      // Reset all states for new audio byte and refresh the page
      window.location.reload();
      return;
    }

    if (selectedTopicIds.length === 0) {
      setShowDiscoverGlow(true);
      discoverButtonRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Check for authentication using both the hook and localStorage
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) {
      // Just open auth sheet without error message
      setIsAuthSheetOpen(true);
      return;
    }

    try {
      setIsGeneratingAudio(true);
      setErrorMessage(null);
      const topicDiscoveryId = topics[0]?.topic_discovery_id;

      if (!topicDiscoveryId) {
        throw new Error('Missing required data for audio generation');
      }

      // Convert duration to seconds
      const durationInSeconds = getDurationInSeconds(duration);

      const response = await audioByteApi.generate(
        topicDiscoveryId,
        selectedTopicIds,
        currentToken,
        durationInSeconds,
        style
      );

      // Set the initial audio byte data with 'processing' status
      setAudioByteData({
        ...response.data,
        status: 'processing',
        selected_topics: topics.filter((topic) =>
          selectedTopicIds.includes(topic.id)
        ),
      });
      setIsAudioPlayerOpen(true);
      setIsAudioGenerated(true);
    } catch (error: any) {
      console.error('Failed to generate audio byte:', error);
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('Authentication required') || error.message.includes('401'))) {
        // Try to refresh the page once to reload authentication state
        window.location.reload();
      } else {
        setErrorMessage('Failed to generate audio. Please try again.');
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleReopenAudioPlayer = () => {
    if (audioByteData) {
      setIsAudioPlayerOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-zinc-800/50 rounded-lg z-10"
        >
          <Menu className="w-6 h-6" />
        </button>
          {/* Logo - Absolutely Centered */}
          <div className="absolute inset-x-0 flex justify-center top-4">
            <img src={logo} alt="Logo" className="w-10" />
          </div>      
          {isAuthenticated && (
            <div className="ml-auto">
              <CreditsDisplay onAudioGenerated={isAudioGenerated} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="absolute inset-0 pt-20 px-4 pb-24 overflow-y-auto">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-zinc-400 text-xl mb-2"></h2>
          <h1 className="text-3xl font-bold mb-4">
          </h1>
        </div>

        {/* Suggested Stories */}
        <section className="mb-8">
          <h2 className="text-zinc-400 text-xl mb-4">Suggested for you</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {suggestedStories.map((story) => (
              <div
                key={story.id}
                className="bg-zinc-800/30 rounded-xl p-4 min-w-[200px] backdrop-blur-lg"
              >
                <h3 className="font-semibold">{story.title}</h3>
                <p className="text-zinc-400 text-sm">{story.subtitle}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="bg-zinc-700/50 rounded-full px-2 py-0.5 text-xs">
                    {story.type}
                  </span>
                  <span className="text-zinc-400 text-xs">
                    {story.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Duration and Style */}
        <div className="flex items-center gap-4 mb-8">
          <Dropdown
            label="Duration"
            value={duration}
            options={['3 minutes', '5 minutes', '10 minutes']}
            onChange={setDuration}
          />
          <Dropdown
            label="Style"
            value={style}
            options={['narrative', 'story', 'speech', 'conversational']}
            onChange={setStyle}
          />
        </div>

        {/* Search and Topics */}
        <div className="mb-8" ref={discoverButtonRef}>
          <SearchTopics
            onOpenTopics={() => setIsBottomSheetOpen(true)}
            glowEffect={showDiscoverGlow}
            disabled={isAudioGenerated}
            onOpenAuthSheet={() => setIsAuthSheetOpen(true)}
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-500/20 rounded-lg">
            <p className="text-red-500">{errorMessage}</p>
          </div>
        )}

        {/* Create/New Button */}
        <div className="fixed bottom-8 left-4 right-4 space-y-4">
          {isAudioGenerated && !isAudioPlayerOpen && audioByteData && (
            <button
              onClick={handleReopenAudioPlayer}
              className="w-full bg-zinc-800 rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              <span>
                Lisn to {truncateText(audioByteData.title || 'Audio Story', 30)}
              </span>
            </button>
          )}
          <button
            onClick={handleCreateAudioByte}
            disabled={
              (!isAudioGenerated && selectedTopicIds.length === 0) ||
              isGeneratingAudio
            }
            className={`w-full rounded-lg py-3 flex items-center justify-center gap-2 transition-all ${
              !isAudioGenerated && selectedTopicIds.length === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600'
            }`}
          >
            {isGeneratingAudio ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isAudioGenerated ? (
                  <RefreshCw className="w-5 h-5" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                <span>
                  {isAudioGenerated ? 'New Audio Byte' : 'Create Audio Byte'}
                </span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Components */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLoginClick={() => {
          setIsSidebarOpen(false);
          setIsAuthSheetOpen(true);
        }}
      />

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        disabled={isAudioGenerated}
      />

      <AuthBottomSheet
        isOpen={isAuthSheetOpen}
        onClose={() => setIsAuthSheetOpen(false)}
      />

      <AudioPlayer
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
        title={searchedTopic}
        generatedTime="2 minutes"
        tracks={audioTracks}
        audioByte={audioByteData}
      />
    </div>
  );
}

export default App;