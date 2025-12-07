import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { containerService } from '../services/containerService';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';
import Terminal from '../components/Terminal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TerminalPage = () => {
  const { containerId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [container, setContainer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContainer();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socketService.disconnect();
      }
    };
  }, [containerId]);

  const loadContainer = async () => {
    try {
      const response = await containerService.getContainer(containerId);
      const containerData = response.data.container;

      if (containerData.status !== 'running') {
        toast.error('Container is not running');
        navigate('/dashboard');
        return;
      }

      setContainer(containerData);

      // Connect socket
      const socketConnection = socketService.connect(token);
      setSocket(socketConnection);

      setLoading(false);
    } catch (error) {
      console.error('Error loading container:', error);
      toast.error('Failed to load container');
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading terminal..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="border-l border-gray-700 pl-4">
              <h2 className="text-white font-medium">{container.image}</h2>
              <p className="text-sm text-gray-400">Port: {container.sshPort}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
              {container.status}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-7xl mx-auto">
          {socket && (
            <Terminal 
              socket={socket} 
              sshPort={container.sshPort} 
              containerId={container._id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminalPage;
