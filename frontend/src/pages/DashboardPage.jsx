import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { containerService } from '../services/containerService';
import { useContainerStore } from '../store/containerStore';
import ContainerCard from '../components/ContainerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { containers, setContainers, addContainer, loading, setLoading } = useContainerStore();
  const [creating, setCreating] = useState(false);

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
    setCreating(true);
    try {
      const response = await containerService.createContainer();
      addContainer(response.data);
      toast.success('Container created successfully!');
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
            Manage your Linux learning containers
          </p>
        </div>

        <button
          onClick={handleCreateContainer}
          disabled={creating}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span>{creating ? 'Creating...' : 'New Container'}</span>
        </button>
      </div>

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
            <p className="text-xl mb-2">No containers yet</p>
            <p className="text-sm">Create your first container to get started!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
