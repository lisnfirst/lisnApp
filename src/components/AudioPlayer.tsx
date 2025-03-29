import { useEffect, useRef, useState } from 'react';
import { ChevronDown, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG } from '../config/api';
import { Topic } from '../services/api/topics';
import { AudioTrack } from '../types/index';
import Typewriter from 'typewriter-effect';
import ReactAudioPlayer from 'react-audio-player';
import { audioByteApi } from '../services/api/audioByte';

interface AudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  generatedTime: string;
  tracks: AudioTrack[];
  audioByte: any;
}

interface AudioByteData {
  id: number;
  status: string;
  selected_topics: Topic[];
  title?: string;
  audio_file?: string;
}

// Circular progress component
const CircularProgress = ({ progress = 0, size = 40, strokeWidth = 4, color = '#2563eb' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#27272a"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  );
};

export function AudioPlayer({
  isOpen,
  onClose,
  title,
  generatedTime,
  tracks,
  audioByte,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [audioByteData, setAudioByteData] = useState<AudioByteData | null>(null);
  const [generatedAudioTracks, setGeneratedAudioTracks] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [topicProgress, setTopicProgress] = useState<Record<number, number>>({});
  const [audioByteProgress, setAudioByteProgress] = useState(0);
  const [audioByteStatus, setAudioByteStatus] = useState<string>('processing');
  const [audioByteTitle, setAudioByteTitle] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastPlayedTimeRef = useRef<number>(0);
  const { token } = useAuth();
  const [generatedTimeText, setGeneratedTimeText] = useState('');
  const audioByteIdRef = useRef<number | null>(null);
  const statusChangeTimeoutRef = useRef<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<ReactAudioPlayer>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const progressHandleRef = useRef<HTMLDivElement>(null);

  // Initialize state from audioByte when it changes
  useEffect(() => {
    if (audioByte) {
      // Ensure topics are sorted correctly before setting state
      const orderedTopics = [...(audioByte.selected_topics || [])].sort(
        (a, b) => a.id - b.id // Sorting based on id instead of index
      );

      setAudioByteData(audioByte);
      setGeneratedAudioTracks(orderedTopics);
      setAudioByteStatus(audioByte.status);
      setAudioByteTitle(audioByte.title || null);
      audioByteIdRef.current = audioByte.id;

      if (audioByte.status === "done") {
        fetchAudioByteData(audioByte.id);
      } else if (audioByte.status === "processing") {
        startProgressTracking(audioByte.id);
      }
    }
  }, [audioByte]);

  // Fetch audio byte data
  const fetchAudioByteData = async (audioByteId: number) => {
    const currentToken = token || localStorage.getItem("auth_token");
    if (!currentToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_AUDIO_BYTE}${audioByteId}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audio byte data");
      }

      const data = await response.json();

      setAudioByteData(data.audio_byte);

      // Ensure topics are sorted correctly before setting state
      const orderedTopics = [...(data.audio_byte.selected_topics || [])].sort(
        (a, b) => a.id - b.id // Sorting based on id instead of index
      );

      setGeneratedAudioTracks(orderedTopics);
      setAudioByteTitle(data.audio_byte.title || null);

      if (data.audio_byte.status === "done") {
        try {
          const audioFileResponse = await audioByteApi.getAudioFile(audioByteId, currentToken);
          if (audioFileResponse.success && audioFileResponse.url) {
            setAudioUrl(audioFileResponse.url);

            // Delay auto-play slightly to ensure proper loading
            setTimeout(() => {
              if (audioPlayerRef.current?.audioEl.current) {
                audioPlayerRef.current.audioEl.current
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch((err) => console.error("Auto-play failed:", err));
              }
            }, 500);
          } else {
            throw new Error("Failed to get audio file URL");
          }
        } catch (error) {
          console.error("Error fetching audio file URL:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (data.audio_byte.status === "processing") {
        startProgressTracking(audioByteId);
      }
    } catch (error) {
      console.error("Error fetching audio byte data:", error);
      setIsLoading(false);
    }
  };

  // Calculate topic start times and durations
  const getTopicTimings = () => {
    let currentTime = 0;
  
    // Ensure correct order
    return generatedAudioTracks.map((track, index) => {
      const startTime = currentTime;
      const duration = track.duration || 0;
      if (typeof duration === 'number') {
        currentTime += duration;
      }
      return { index, startTime, endTime: currentTime };
    });
  };
  

  // Format time for display
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse SSE data string to JSON
  const parseProgressData = (dataString: string) => {
    try {
      // Replace single quotes with double quotes and ensure property names are quoted
      const jsonString = dataString
        .replace(/'/g, '"')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing progress data:', error);
      throw error;
    }
  };

  // Start progress tracking using SSE
  const startProgressTracking = (audioByteId: number) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const startTime = Date.now();

    const eventSource = new EventSource(
      `${API_CONFIG.BASE_URL}/audio-bytes/${audioByteId}/progress`
    );

    const logDuration = () => {
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const durationSec = durationMs / 1000; // Convert to seconds
      const durationMin = durationMs / 60000; // Convert to minutes

      if (durationSec < 60) {
        setGeneratedTimeText(`${Math.round(durationSec)} seconds`);
      } else {
        setGeneratedTimeText(`${Math.round(durationMin)} minutes`);
      }
    };

    eventSource.addEventListener('progress', (event) => {
      try {
        const data = parseProgressData(event.data);
        setTopicProgress(data.topic_progress || {});
        setAudioByteProgress(data.audio_byte_progress || 0);
        
        // Update title if available
        if (data.audio_byte_title !== undefined && data.audio_byte_title !== null) {
          // Remove quotes if they exist
          const cleanTitle = data.audio_byte_title.replace(/^"|"$/g, '');
          setAudioByteTitle(cleanTitle);
        }
        
        // Update status
        if (data.audio_byte_status !== audioByteStatus) {
          setAudioByteStatus(data.audio_byte_status);
          
          // If status changed to 'done', log duration, close event source, and fetch data
          if (data.audio_byte_status === 'done') {
            logDuration();
            eventSource.close();
            
            // Add a small delay before fetching to ensure backend processing is complete
            if (statusChangeTimeoutRef.current) {
              clearTimeout(statusChangeTimeoutRef.current);
            }
            
            statusChangeTimeoutRef.current = setTimeout(() => {
              if (audioByteId) {
                fetchAudioByteData(audioByteId);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error handling progress event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      
      // If we were tracking a processing audio byte and lost connection,
      // try to fetch the data directly in case it completed
      if (audioByteStatus === 'processing' && audioByteId) {
        fetchAudioByteData(audioByteId);
      }
    };

    eventSourceRef.current = eventSource;
  };

  // Cleanup on unmount or when component closes
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (statusChangeTimeoutRef.current) {
        clearTimeout(statusChangeTimeoutRef.current);
      }
      
      // Save the current time before unmounting
      if (audioPlayerRef.current && audioPlayerRef.current.audioEl.current) {
        lastPlayedTimeRef.current = audioPlayerRef.current.audioEl.current.currentTime;
      }
    };
  }, []);

  // Re-check audio byte status when component becomes visible
  useEffect(() => {
    if (isOpen && audioByteIdRef.current && audioByteStatus === 'processing') {
      // Re-fetch status when player is opened
      startProgressTracking(audioByteIdRef.current);
    }
  }, [isOpen, audioByteStatus]);

  // Handle audio events
  const handleLoadedMetadata = () => {
    if (audioPlayerRef.current && audioPlayerRef.current.audioEl.current) {
      const audio = audioPlayerRef.current.audioEl.current;
      setDuration(audio.duration || 0);
      
      // Restore last played position if available
      if (lastPlayedTimeRef.current > 0) {
        audio.currentTime = lastPlayedTimeRef.current;
        setCurrentTime(lastPlayedTimeRef.current);
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioPlayerRef.current && audioPlayerRef.current.audioEl.current) {
      const audio = audioPlayerRef.current.audioEl.current;
      const currentTime = audio.currentTime;
      setCurrentTime(currentTime);
      setProgress((currentTime / (audio.duration || 1)) * 100);
      
      // Update current track based on current time
      const topicTimings = getTopicTimings();
      const currentIndex = topicTimings.findIndex(
        ({ startTime, endTime }) =>
          currentTime >= startTime && currentTime < endTime
      );

      if (currentIndex !== -1 && currentIndex !== currentTrackIndex) {
        setCurrentTrackIndex(currentIndex);
      }
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    lastPlayedTimeRef.current = 0;
    
    if (audioPlayerRef.current && audioPlayerRef.current.audioEl.current) {
      audioPlayerRef.current.audioEl.current.currentTime = 0;
    }
  };

  const handleTopicClick = (index: number) => {
    if (!audioPlayerRef.current?.audioEl.current || audioByteStatus !== 'done') return;
  
    const topicTimings = getTopicTimings();
    
    // Ensure correct start time lookup
    if (index < 0 || index >= topicTimings.length) return;
  
    const startTime = topicTimings[index].startTime;
  
    audioPlayerRef.current.audioEl.current.currentTime = startTime;
    lastPlayedTimeRef.current = startTime;
    setCurrentTime(startTime);
    setProgress((startTime / (audioPlayerRef.current.audioEl.current.duration || 1)) * 100);
  
    if (!isPlaying) {
      audioPlayerRef.current.audioEl.current.play().catch(console.error);
      setIsPlaying(true);
    }
  
    setCurrentTrackIndex(index);
  };
  

  // Handle progress bar interactions
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioPlayerRef.current || !audioPlayerRef.current.audioEl.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioPlayerRef.current.audioEl.current.duration;
    
    audioPlayerRef.current.audioEl.current.currentTime = newTime;
    lastPlayedTimeRef.current = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  // Mouse and touch event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!audioPlayerRef.current || !audioPlayerRef.current.audioEl.current) return;
    
    isDraggingRef.current = true;
    
    // Add event listeners for mouse move and mouse up
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Prevent text selection during drag
    e.preventDefault();

    // Initial seek
    handleMouseMove(e);
  };

  const handleMouseMove = (e: MouseEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !progressBarRef.current || !audioPlayerRef.current?.audioEl.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * audioPlayerRef.current.audioEl.current.duration;

    // Update audio time and UI
    audioPlayerRef.current.audioEl.current.currentTime = newTime;
    lastPlayedTimeRef.current = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    
    // Remove event listeners after interaction ends
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!audioPlayerRef.current || !audioPlayerRef.current.audioEl.current) return;

    isDraggingRef.current = true;

    // Add event listeners for touch move and touch end
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Initial seek to avoid delay
    handleTouchMove(e);
  };

  const handleTouchMove = (e: TouchEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || !progressBarRef.current || !audioPlayerRef.current?.audioEl.current) return;

    

    const touch = "touches" in e ? e.touches[0] : (e as TouchEvent).touches[0]; // Ensure touch event is properly handled
    const rect = progressBarRef.current.getBoundingClientRect();
    
    // Calculate the new position within bounds
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * audioPlayerRef.current.audioEl.current.duration;

    // Update audio time and UI
    audioPlayerRef.current.audioEl.current.currentTime = newTime;
    lastPlayedTimeRef.current = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  // Handle touch end event
  const handleTouchEnd = () => {
    isDraggingRef.current = false;

    // Remove event listeners after interaction ends
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  };


  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Playback controls
  const togglePlayPause = () => {
    if (!audioPlayerRef.current || !audioPlayerRef.current.audioEl.current) return;
    
    const audio = audioPlayerRef.current.audioEl.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSkipBackward = () => {
    if (!audioPlayerRef.current || !audioPlayerRef.current.audioEl.current) return;
    
    const audio = audioPlayerRef.current.audioEl.current;
    const newTime = Math.max(audio.currentTime - 15, 0);
    audio.currentTime = newTime;
    lastPlayedTimeRef.current = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / (audio.duration || 1)) * 100);
  };
  
  const handleSkipForward = () => {
    if (!audioPlayerRef.current || !audioPlayerRef.current.audioEl.current) return;
    
    const audio = audioPlayerRef.current.audioEl.current;
    const newTime = Math.min(audio.currentTime + 15, audio.duration || 0);
    audio.currentTime = newTime;
    lastPlayedTimeRef.current = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / (audio.duration || 1)) * 100);
  };

  // Calculate remaining time properly
  const remainingTime = duration && isFinite(duration) ? Math.max(0, duration - currentTime) : 0;
  const topicTimings = getTopicTimings();

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } bg-black border-t border-b border-zinc-800`}
        style={{ height: 'calc(100% - 4rem)' }}
      > 
       <div className="h-full flex flex-col rounded-t-lg border-t border-gray-200/50">
        {/* Header Section */}
        <div className="flex-none p-4 border-b border-zinc-800">
          <button onClick={onClose} className="mb-6 bg-zinc-800/30 rounded-full p-2 hover:bg-zinc-700/30 transition-all border border-zinc-600">
            <ChevronDown className="w-6 h-6 text-white" />
          </button>

          {/* Listening Section with full-width border */}
          <div className="-mx-4 rounded-t-lg pt-4 px-4">
            <h2 className="text-zinc-500 text-xl mb-2">Listening to</h2>
              <h1 className="text-2xl font-bold mb-2">
                {audioByteStatus === 'processing' ? (
                  <div className="h-8">
                    {audioByteTitle ? (
                      <Typewriter
                        options={{
                          strings: [audioByteTitle],
                          autoStart: true,
                          loop: false,
                          deleteSpeed: Infinity,
                          cursor: '|',
                          delay: 50,
                        }}
                      />
                    ) : (
                      <span className="animate-pulse">|</span>
                    )}
                  </div>
                ) : (
                  audioByteTitle || title
                )}
              </h1>
              {generatedTimeText !== '' && (
                <p className="text-zinc-500 text-sm">
                  generated in {generatedTimeText}
                </p>
              )}
            </div>
          </div>

          {/* Scrollable Tracks Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {generatedAudioTracks.map((track: Topic, index) => (
                <button
                  key={track.id}
                  onClick={() => handleTopicClick(index)}
                  className={`w-full flex justify-between items-center p-4 rounded-lg transition-colors ${
                    index === currentTrackIndex
                      ? 'bg-zinc-800'
                      : 'bg-zinc-800/30 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex-1 text-left pr-4">
                    <span className="text-white">{track.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {audioByteStatus === 'processing' ? (
                      <div className="w-5 h-5 relative">
                        <CircularProgress 
                          progress={topicProgress[track.id] || 0} 
                          size={20} 
                          strokeWidth={2} 
                          color="#2563eb" 
                        />
                      </div>
                    ) : (
                      <span className="text-zinc-500">
                        {formatTime(topicTimings[index].startTime)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Controls Section */}
          <div className="flex-none p-4 border-t border-zinc-800">
            {audioByteStatus === 'processing' ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 mb-4 flex items-center justify-center">
                  <CircularProgress progress={audioByteProgress} size={64} strokeWidth={4} color="#2563eb" />
                </div>
                <p className="text-zinc-400">Generating audio... {Math.round(audioByteProgress)}%</p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-zinc-400">Loading audio...</p>
              </div>
            ) : audioUrl ? (
              <div className="audio-player-container">
                {/* Custom Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div
                    ref={progressBarRef}
                    className="relative w-full bg-zinc-800 rounded-full h-2 cursor-pointer"
                    onClick={handleSeek}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                  >
                    <div
                      className="bg-purple-600 h-2 rounded-full relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div
                        ref={progressHandleRef}
                        className="absolute top-1/2 right-0 w-3 h-3 bg-white rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}  
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(remainingTime)}</span>
                  </div>
                </div>

                {/* Custom Controls */}
                <div className="flex items-center justify-center gap-8 mb-4">
                  <button onClick={handleSkipBackward} className="p-2">
                    <SkipBack className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={togglePlayPause}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-black" />
                    ) : (
                      <Play className="w-8 h-8 text-black ml-1" />
                    )}
                  </button>
                  <button onClick={handleSkipForward} className="p-2">
                    <SkipForward className="w-8 h-8" />
                  </button>
                </div>
                
                {/* Hidden ReactAudioPlayer */}
                <ReactAudioPlayer
                  ref={audioPlayerRef}
                  src={audioUrl}
                  autoPlay={false}
                  controls={false}
                  listenInterval={100}
                  onLoadedMetadata={handleLoadedMetadata}
                  onListen={handleTimeUpdate}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  style={{ display: 'none' }}
                />
              </div>
            ) : null}

            {/* Bottom Indicator */}
            <div className="flex justify-center mt-4">
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