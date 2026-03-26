import { useNavigate } from 'react-router-dom';
import { Play, Square, Trash2, Activity, RotateCw } from 'lucide-react';
import { containerService } from '../services/containerService';
import { useContainerStore } from '../store/containerStore';
import toast from 'react-hot-toast';

const ContainerCard = ({ container }) => {
  const navigate = useNavigate();
  const { updateContainer, removeContainer } = useContainerStore();

  const handleOpenTerminal = () => {
    navigate(`/terminal/${container._id}`);
  };

  const handleStop = async () => {
    try {
      await containerService.stopContainer(container._id);
      updateContainer(container._id, { status: 'stopped' });
      toast.success('Container stopped successfully');
    } catch (error) {
      console.error('Error stopping container:', error);
      toast.error('Failed to stop container');
    }
  };

  const handleRestart = async () => {
    try {
      await containerService.restartContainer(container._id);
      updateContainer(container._id, { status: 'running' });
      toast.success('Container restarted successfully');
    } catch (error) {
      console.error('Error restarting container:', error);
      toast.error('Failed to restart container');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this container?')) {
      return;
    }

    try {
      await containerService.deleteContainer(container._id);
      removeContainer(container._id);
      toast.success('Container deleted successfully');
    } catch (error) {
      console.error('Error deleting container:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-500';
      case 'stopped':
        return 'text-yellow-500';
      case 'exited':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {container.instanceName}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Port: {container.sshPort}
          </p>
        </div>
        <span className={`text-sm font-medium ${getStatusColor(container.status)}`}>
          {container.status}
        </span>
      </div>

      <div className="text-sm text-gray-400 space-y-1 mb-4">
        <p>Started: {new Date(container.startedAt).toLocaleString()}</p>
        <p>ID: {container.containerId.substring(0, 12)}</p>
      </div>

      <div className="flex space-x-2">
        {container.status === 'running' && (
          <>
            <button
              onClick={handleOpenTerminal}
              className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition"
            >
              <Play className="w-4 h-4" />
              <span>Open Terminal</span>
            </button>
            <button
              onClick={handleStop}
              className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded transition"
              title="Stop container"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}

        {container.status === 'stopped' && (
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition"
          >
            <RotateCw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        )}

        <button
          onClick={handleDelete}
          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded transition"
          title="Permanently delete container"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ContainerCard;
