import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  MessageSquare
} from "lucide-react";
import { 
  getComplaints, 
  type Complaint 
} from "../api/complaints";
import { useAuth } from "../context/AuthContext";
import EnhancedComplaintDetailsModal from "../components/complaints/EnhancedComplaintDetailsModal";

const ArchiveComplaintsPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-yellow-100 text-yellow-800";
      case "In_Progress": return "bg-blue-100 text-blue-800";
      case "Resolved": return "bg-green-100 text-green-800";
      case "Denied": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    fetchArchivedComplaints();
  }, [user]); // Refetch when user changes

  const fetchArchivedComplaints = async () => {
    try {
      setLoading(true);
      const data = await getComplaints();
      
      // Filter for archived complaints (Resolved, Denied)
      let archivedComplaints = data.filter(c => 
        c.status === "Resolved" || 
        c.status === "Denied"
      );
      
      // For custodians, only show complaints from their assigned lab
      if (!isAdmin && user?.lab_id) {
        archivedComplaints = archivedComplaints.filter(c => c.lab_id === user.lab_id);
      }
      
      setComplaints(archivedComplaints);
      setFilteredComplaints(archivedComplaints);
    } catch (err) {
      setError("Failed to fetch archived complaints");
      console.error("Error fetching archived complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filtering
  useEffect(() => {
    let filtered = complaints;

    if (startDate) {
      filtered = filtered.filter(complaint => {
        const complaintDate = new Date(complaint.created_at);
        const start = new Date(startDate + 'T00:00:00');
        return complaintDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter(complaint => {
        const complaintDate = new Date(complaint.created_at);
        const end = new Date(endDate + 'T23:59:59');
        return complaintDate <= end;
      });
    }

    setFilteredComplaints(filtered);
  }, [complaints, startDate, endDate]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archived Complaints</h1>
          <p className="text-gray-600 mt-1">Completed complaints</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Archived Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {complaints.length === 0 ? "No archived complaints found" : "No complaints match the selected filters"}
              </h3>
              <p className="text-gray-500">
                {complaints.length === 0 
                  ? "No complaints have been archived yet" 
                  : "Try adjusting your date filters"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                    Complaint Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Location
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr 
                    key={complaint.complaint_id} 
                    className="hover:bg-blue-50 cursor-pointer transition-colors" 
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Complaint #{complaint.complaint_id}
                      </div>
                      {complaint.asset_info && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          Asset: {complaint.asset_info}
                        </div>
                      )}
                      {complaint.issue_description && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {complaint.issue_description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {complaint.faculty_student_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {complaint.user_type}
                        {complaint.year_level && ` • Year ${complaint.year_level}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {complaint.laboratories?.lab_name || `Lab ${complaint.lab_id}`}
                      </div>
                      {complaint.workstations && (
                        <div className="text-sm text-gray-500">
                          {complaint.workstations.workstation_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {new Date(complaint.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      {/* No actions needed for archived complaints - rows are clickable */}
                      <div className="text-xs text-gray-400">
                        Click row for details
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {complaint.ip_address || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Enhanced Details Modal */}
      <EnhancedComplaintDetailsModal
        complaint={selectedComplaint!}
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
};

export default ArchiveComplaintsPage;
