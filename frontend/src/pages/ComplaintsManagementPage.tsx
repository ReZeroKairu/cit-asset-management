import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  MessageSquare, 
  Edit, 
  Clock, 
  AlertTriangle
} from "lucide-react";
import { 
  getComplaints, 
  updateComplaintStatus, 
  updateComplaintRemarks,
  type Complaint 
} from "../api/complaints";
import { useAuth } from "../context/AuthContext";
import EnhancedComplaintDetailsModal from "../components/complaints/EnhancedComplaintDetailsModal";

const ComplaintsManagementPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [labFilter, setLabFilter] = useState("all");
  const [workstationFilter, setWorkstationFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [remarksText, setRemarksText] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // Status options - only unfinished statuses for management
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "In_Progress", label: "In Progress" }
  ];

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
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getComplaints();
      setComplaints(data);
    } catch (err) {
      setError("Failed to fetch complaints");
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId: number, newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateComplaintStatus(complaintId, newStatus);
      
      // Update local state
      setComplaints(prev => 
        prev.map(c => 
          c.complaint_id === complaintId 
            ? { ...c, status: newStatus }
            : c
        )
      );
      
      setSuccess("Complaint status updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update complaint status");
      console.error("Error updating complaint status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptComplaint = async (complaintId: number) => {
    await handleStatusUpdate(complaintId, "In_Progress");
  };

  const handleDenyComplaint = async (complaintId: number) => {
    await handleStatusUpdate(complaintId, "Denied");
  };

  const handleRemarksUpdate = async () => {
    if (!selectedComplaint) return;

    try {
      setIsUpdating(true);
      await updateComplaintRemarks(selectedComplaint.complaint_id, remarksText);
      
      // Update local state with remarks and completion date
      setComplaints(prev => 
        prev.map(c => 
          c.complaint_id === selectedComplaint.complaint_id 
            ? { ...c, remarks: remarksText, resolved_at: completionDate || undefined }
            : c
        )
      );
      
      setSelectedComplaint({ ...selectedComplaint, remarks: remarksText, resolved_at: completionDate || undefined });
      setIsEditingRemarks(false);
      setSuccess("Remarks updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update remarks");
      console.error("Error updating remarks:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    
    // Only show unfinished statuses in complaints management
    const unfinishedStatuses = ["Open", "In_Progress"];
    const isUnfinished = unfinishedStatuses.includes(complaint.status);
    
    // For custodians, only show complaints from their assigned lab
    const matchesLab = isAdmin 
      ? (labFilter === "all" || complaint.lab_id.toString() === labFilter)
      : (user?.lab_id ? complaint.lab_id === user.lab_id : true);
    
    const matchesWorkstation = workstationFilter === "all" || complaint.workstation_id?.toString() === workstationFilter;
    
    return isUnfinished && matchesStatus && matchesLab && matchesWorkstation;
  });

  // Get unique labs from complaints
  const uniqueLabs = Array.from(new Set(complaints.map(c => c.lab_id)))
    .map(labId => {
      const complaint = complaints.find(c => c.lab_id === labId);
      return {
        lab_id: labId,
        lab_name: complaint?.laboratories?.lab_name || `Lab ${labId}`
      };
    })
    .sort((a, b) => a.lab_name.localeCompare(b.lab_name));

  // Get unique workstations from filtered complaints
  const uniqueWorkstations = Array.from(new Set(
    complaints
      .filter(c => labFilter === "all" || c.lab_id.toString() === labFilter)
      .map(c => c.workstation_id)
      .filter(Boolean)
  ))
    .map(workstationId => {
      const complaint = complaints.find(c => c.workstation_id === workstationId);
      return {
        workstation_id: workstationId!,
        workstation_name: complaint?.workstations?.workstation_name || `Workstation ${workstationId}`
      };
    })
    .sort((a, b) => a.workstation_name.localeCompare(b.workstation_name));

  const openComplaints = complaints.filter(c => c.status === "Open").length;
  const inProgressComplaints = complaints.filter(c => c.status === "In_Progress").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-orange-600" />
          Complaints Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage and respond to submitted complaints from students and faculty
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{filteredComplaints.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-yellow-600">{openComplaints}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressComplaints}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Lab Filter - Only for Admins */}
            {isAdmin && (
              <div className="w-full md:w-48">
                <Select value={labFilter} onValueChange={(value) => {
                  setLabFilter(value);
                  setWorkstationFilter("all"); // Reset workstation filter when lab changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by lab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labs</SelectItem>
                    {uniqueLabs.map(lab => (
                      <SelectItem key={lab.lab_id} value={lab.lab_id.toString()}>
                        {lab.lab_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Workstation Filter */}
            <div className="w-full md:w-48">
              <Select value={workstationFilter} onValueChange={setWorkstationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by workstation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workstations</SelectItem>
                  {uniqueWorkstations.map(workstation => (
                    <SelectItem key={workstation.workstation_id} value={workstation.workstation_id.toString()}>
                      {workstation.workstation_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-500">
                {labFilter !== "all" || workstationFilter !== "all" || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "No complaints have been submitted yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Complaint Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr 
                    key={complaint.complaint_id} 
                    className="hover:bg-blue-50 cursor-pointer transition-colors" 
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setRemarksText(complaint.remarks || "");
                      setIsEditingRemarks(false); // Open modal in read-only mode
                    }}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {complaint.faculty_student_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {complaint.user_type}
                        {complaint.year_level && ` • Year ${complaint.year_level}`}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {complaint.laboratories?.lab_name || `Lab ${complaint.lab_id}`}
                      </div>
                      {complaint.workstations && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {complaint.workstations.workstation_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(complaint.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Show Accept/Deny buttons for Open complaints - but not for admins */}
                        {complaint.status === "Open" && !isAdmin && (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptComplaint(complaint.complaint_id);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                              disabled={isUpdating}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDenyComplaint(complaint.complaint_id);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              disabled={isUpdating}
                            >
                              Deny
                            </Button>
                          </>
                        )}
                        
                        {/* Show Edit button and status dropdown for In_Progress complaints - but not for admins */}
                        {complaint.status === "In_Progress" && !isAdmin && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(complaint);
                                setRemarksText(complaint.remarks || "");
                                setIsEditingRemarks(true); // Open modal in edit mode
                              }}
                              className="p-2 h-8 w-8 text-blue-600 hover:bg-gray-200 hover:text-blue-700 cursor-pointer rounded-md"
                              title="Edit Remarks"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={complaint.status}
                                onValueChange={(value) => handleStatusUpdate(complaint.complaint_id, value)}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="In_Progress">In Progress</SelectItem>
                                  <SelectItem value="Resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
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
        isEditing={isEditingRemarks}
        onEditToggle={() => setIsEditingRemarks(!isEditingRemarks)}
        onSave={handleRemarksUpdate}
        isUpdating={isUpdating}
        remarksText={remarksText}
        setRemarksText={setRemarksText}
        completionDate={completionDate}
        setCompletionDate={setCompletionDate}
      />
    </div>
  );
};

export default ComplaintsManagementPage;
