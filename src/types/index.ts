export interface Story {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  duration: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  duration: string;
  url?: string;
}

export interface Topic {
  id: number;
  title: string;
  topic_discovery_id: number;
  duration: string | null;
  audio_byte_id: string | null;
  content: string | null;
}

export interface TopicResponse {
  data: {
    user_id: string;
    user_query: string;
    id: number;
    topics: Topic[];
  };
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTrackIndex: number;
}
