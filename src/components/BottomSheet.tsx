import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useDispatch } from 'react-redux';
import { setDiscoverTopics } from '../store/commonSlice';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TopicProps {
  id: number;
  title: string;
  topic_discovery_id: number;
}

export function BottomSheet({ isOpen, onClose }: BottomSheetProps) {
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const { topics }: any = useAppSelector((state) => state.topics);
  const dispatch = useDispatch();

  // Set all topics as selected when the sheet opens or topics change
  useEffect(() => {
    if (topics?.topics?.length) {
      const allTopicIds = topics.topics.map((topic: TopicProps) => topic.id);
      setSelectedTopics(allTopicIds);
    }
  }, [topics, isOpen]);

  const toggleTopic = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId].slice(0, 8)
    );
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = topics?.topics?.filter((topic: TopicProps) =>
      selectedTopics.includes(topic.id)
    );
    console.log('Selected topics:', selected);
    dispatch(setDiscoverTopics(selected));
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-zinc-900 rounded-t-2xl max-h-[85vh] overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold">Craft your audiobyte</h2>
              <button onClick={onClose}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-zinc-400">select upto 8 topics</p>
          </div>

          <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {topics?.topics?.map((topic: TopicProps) => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className="w-full bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-800"
              >
                <span>{topic.title}</span>
                <div
                  className={`w-5 h-5 rounded border ${
                    selectedTopics.includes(topic.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-zinc-600'
                  }`}
                >
                  {selectedTopics.includes(topic.id) && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-5 h-5 text-white"
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
            ))}
          </div>

          <div className="p-4 flex gap-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-lg bg-blue-600 font-medium"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-30" onClick={onClose} />
      )}
    </>
  );
}
