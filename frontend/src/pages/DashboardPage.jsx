import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { containerService } from '../services/containerService';
import { useContainerStore } from '../store/containerStore';
import ContainerCard from '../components/ContainerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { containers, setContainers, addContainer, loading, setLoading } = useContainerStore();
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [instanceName, setInstanceName] = useState('');

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const response = await containerService.getContainers();
      setContainers(response.data.containers);
    } catch (error) {
      console.error('Error fetching containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContainer = async () => {
    if (!instanceName.trim()) {
      toast.error('Please enter an instance name');
      return;
    }

    setCreating(true);
    try {
      const response = await containerService.createContainer(instanceName);
      addContainer(response.data);
      toast.success('Container created successfully!');
      setInstanceName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating container:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage your Linux learning instances
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          disabled={creating}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span>New Instance</span>
        </button>
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create New Instance</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setInstanceName('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instance Name
              </label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateContainer();
                  }
                }}
                placeholder="e.g., My Learning Lab"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setInstanceName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContainer}
                disabled={creating || !instanceName.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Containers grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading containers..." />
        </div>
      ) : containers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {containers.map((container) => (
            <ContainerCard key={container._id} container={container} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400">
            <p className="text-xl mb-2">No instances yet</p>
            <p className="text-sm">Create your first instance to get started!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
