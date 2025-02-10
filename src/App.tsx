import { useState } from 'react';
import { Menu, Wand2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { BottomSheet } from './components/BottomSheet';
import { AuthBottomSheet } from './components/AuthBottomSheet';
import { AudioPlayer } from './components/AudioPlayer';
import { Dropdown } from './components/Dropdown';
import { SearchTopics } from './components/SearchTopics';
import { Story, AudioTrack } from './types';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [duration, setDuration] = useState('10 Min');
  const [style, setStyle] = useState('Narrative');
  const discoverTopics = useSelector(
    (state: RootState) => state.commonState.discoverTopics
  );
  const [noAudioFileGeneratedMessage, setShowNoAudioFileGenratedMessage] =
    useState(false);

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

  const handleAudioPlayerOpen = () => {
    console.log('discoverTopics----', discoverTopics);
    if (discoverTopics.length <= 0) {
      setShowNoAudioFileGenratedMessage(true);
    } else {
      setShowNoAudioFileGenratedMessage(false);
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
            className="p-2 hover:bg-zinc-800/50 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button className="bg-purple-900/50 px-4 py-1.5 rounded-full text-sm flex items-center gap-2">
            <span className="text-purple-200">5</span>
            <span>Credits</span>
          </button>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main className="absolute inset-0 pt-20 px-4 pb-24 overflow-y-auto">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-zinc-400 text-xl mb-2">Lisn to</h2>
          <h1 className="text-3xl font-bold mb-4">
            Sachin Tendulkar Life's Story
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
            options={['5 Min', '10 Min', '15 Min', '20 Min']}
            onChange={setDuration}
          />
          <Dropdown
            label="Style"
            value={style}
            options={['Raw', 'Narrative', 'Deep dive']}
            onChange={setStyle}
          />
        </div>

        {/* Search and Topics */}
        <div className="mb-8">
          <SearchTopics
            onOpenTopics={() => {
              setIsBottomSheetOpen(true);
            }}
          />
        </div>

        {/* Create Button */}
        <div className="fixed bottom-8 left-4 right-4">
          <button
            onClick={() => handleAudioPlayerOpen()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg py-3 flex items-center justify-center gap-2"
          >
            <Wand2 className="w-5 h-5" />
            <span>Create audiobyte</span>
          </button>
          {noAudioFileGeneratedMessage && (
            <p className="text-red-500 text-sm text-center w-full mt-2">
              No audio file generated, please generate one.
            </p>
          )}
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
      />

      <AuthBottomSheet
        isOpen={isAuthSheetOpen}
        onClose={() => setIsAuthSheetOpen(false)}
      />

      <AudioPlayer
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
        title="Sachin Tendulkar Life's Story"
        generatedTime="2 minutes"
        tracks={audioTracks}
      />
    </div>
  );
}

export default App;
