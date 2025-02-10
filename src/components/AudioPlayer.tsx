import { useEffect, useRef, useState } from 'react';
import { ChevronDown, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { API_CONFIG } from '../config/api';

interface AudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  generatedTime: string;
  tracks: any;
}

interface Topic {
  id: number;
  title: string;
  topic_discovery_id: number;
}

export function AudioPlayer({
  isOpen,
  onClose,
  title,
  generatedTime,
  tracks,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const discoverTopics = useSelector(
    (state: RootState) => state.commonState.discoverTopics
  );
  const [audioTracks, setAudioTracks]: any = useState({});
  const [generatedAudioTracks, setGeneratedAudioTracks] = useState([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef: any = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showGeneratingAudioMessage, setShowGeneratingAudioMessage] =
    useState(false);

  // Reset state when component closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      generateAudio();
    }
  }, [isOpen]);

  // Auto-play when audio URL is generated
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(console.error);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioTracks?.status === 'processing') {
      const interval = setInterval(() => {
        checkIfAudioFilesGenerated(audioTracks?.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [audioTracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Set new audio source and load it
    audio.src = audioUrl;
    audio.load();

    // Only autoplay if the player is open
    if (isOpen && isPlaying) {
      audio.play().catch(console.error);
    }

    // Update progress bar as audio plays
    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    // Set duration when audio metadata is loaded
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    // Handle audio ending
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    // Attach event listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, isOpen, isPlaying]);

  const generateAudio = async () => {
    try {
      const discoveredTopicIds = discoverTopics.map(
        (topic: Topic) => topic?.id
      );
      const topicDiscoveryId: any = discoverTopics.find(
        (topic: Topic) => topic.topic_discovery_id
      );
      let body = {
        duration: 30,
        selected_topic_ids: discoveredTopicIds,
        style: 'narrative',
        topic_discovery_id: topicDiscoveryId?.topic_discovery_id,
      };
      setShowGeneratingAudioMessage(true);
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_AUDIO_BYTE}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${API_CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch generate error');
      }

      const finalResponse = await response?.json();
      checkIfAudioFilesGenerated(finalResponse?.data?.id);
    } catch (error) {
      console.error('Error generating audio:', error);
      setShowGeneratingAudioMessage(false);
    }
  };

  const checkIfAudioFilesGenerated = async (audioByteId: number) => {
    try {
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_AUDIO_BYTE}${audioByteId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${API_CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch generate error');
      }
      const finalResponse = await response?.json();
      setGeneratedAudioTracks(finalResponse?.audio_byte?.selected_topics);
      setAudioTracks(finalResponse?.audio_byte);
      if (finalResponse?.audio_byte?.status === 'done') {
        streamAudioFunctionality(finalResponse?.audio_byte?.id);
      }
    } catch {}
  };

  const streamAudioFunctionality = async (audioByteId: number) => {
    try {
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STREAM_AUDIO}${audioByteId}/stream`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${API_CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to stream audio');
      }
      const audioBlob = await response.blob();
      const audioObjectUrl = URL.createObjectURL(audioBlob);
      if (audioObjectUrl) {
        setShowGeneratingAudioMessage(false);
      }
      setAudioUrl(audioObjectUrl);
    } catch {}
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } bg-black`}
        style={{ height: 'calc(100% - 4rem)' }}
      >
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <div className="flex-none p-4 border-b border-zinc-800">
            <button onClick={onClose} className="mb-6">
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="mb-4">
              <h2 className="text-zinc-500 text-xl mb-2">Listening to</h2>
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <p className="text-zinc-500 text-sm">
                generated in {generatedTime}
              </p>
            </div>
          </div>

          {/* Scrollable Tracks Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {generatedAudioTracks.map((track: any, index) => (
                <button
                  key={track.id}
                  onClick={() => setCurrentTrackIndex(index)}
                  className={`w-full flex justify-between items-center p-4 rounded-lg transition-colors ${
                    index === currentTrackIndex
                      ? 'bg-zinc-800'
                      : 'bg-zinc-800/30 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="text-white">{track.title}</span>
                  <span className="text-zinc-500">
                    {audioTracks?.status === 'done' ? (
                      track.duration?.toFixed(2)
                    ) : (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Controls Section - Fixed at bottom */}
          <div className="flex-none p-4 border-t border-zinc-800">
            {/* Progress Bar */}
            {showGeneratingAudioMessage && (
              <p className="text-center mb-4 text-lg">
                Generating Audio Files. Please wait...
              </p>
            )}
            <div className="space-y-2 mb-4">
              <div
                className="relative w-full bg-zinc-800 rounded-full h-2 cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>
                  {new Date(currentTime * 1000).toISOString().substring(14, 19)}
                </span>
                <span>
                  -
                  {new Date((duration - currentTime) * 1000)
                    .toISOString()
                    .substring(14, 19)}
                </span>
              </div>
            </div>

            <audio
              ref={audioRef}
              preload="auto"
              hidden
            />

            {/* Controls */}
            <div className="flex items-center justify-center gap-8 mb-4">
              <button
                className="p-2"
                onClick={() =>
                  setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1))
                }
              >
                <SkipBack className="w-8 h-8" />
              </button>
              <button
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
                onClick={togglePlayPause}
                disabled={!audioUrl}
              >
                {isPlaying ? (
                  <Pause className={`w-8 h-8 text-black ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} />
                ) : (
                  <Play className={`w-8 h-8 text-black ml-1 ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} />
                )}
              </button>
              <button
                className="p-2"
                onClick={() =>
                  setCurrentTrackIndex(
                    Math.min(tracks.length - 1, currentTrackIndex + 1)
                  )
                }
              >
                <SkipForward className="w-8 h-8" />
              </button>
            </div>

            {/* Bottom Indicator */}
            <div className="flex justify-center">
              <div className="w-32 h-1 bg-zinc-800 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-40" onClick={onClose} />
      )}
    </>
  );
}