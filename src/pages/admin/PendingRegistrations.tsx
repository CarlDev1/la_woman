import { usePendingUsers } from '@/hooks/usePendingUsers';
import AdminLayout from '@/components/admin/AdminLayout';
import ParticipantCard from '@/components/admin/ParticipantCard';
import { Loader2, UserCheck } from 'lucide-react';

const PendingRegistrations = () => {
  const { users, loading, error, handleValidate, handleReject } = usePendingUsers();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-600 p-8">
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inscriptions en attente</h1>
          <p className="text-gray-600 mt-2">
            {users.length} inscription{users.length !== 1 ? 's' : ''} en attente de validation
          </p>
        </div>

        {/* Content */}
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune inscription en attente
            </h3>
            <p className="text-gray-600">
              Toutes les inscriptions ont été traitées.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <ParticipantCard
                key={user.id}
                participant={user}
                onValidate={handleValidate}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingRegistrations;
