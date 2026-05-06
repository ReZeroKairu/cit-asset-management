import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { useEffect } from "react";
import {
  MessageSquare,
  User,
  MapPin,
  Package,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Save,
  X,
} from "lucide-react";
import type { Complaint } from "../../api/complaints";

interface EnhancedComplaintDetailsModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  onSave?: (remarks: string, completionDate: string) => void;
  isUpdating?: boolean;
  remarksText?: string;
  setRemarksText?: (text: string) => void;
  completionDate?: string;
  setCompletionDate?: (date: string) => void;
}

const EnhancedComplaintDetailsModal = ({
  complaint,
  isOpen,
  onClose,
  isEditing = false,
  onEditToggle,
  onSave,
  isUpdating = false,
  remarksText = "",
  setRemarksText,
  completionDate = "",
  setCompletionDate,
}: EnhancedComplaintDetailsModalProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="w-4 h-4" />;
      case "In_Progress":
        return <AlertTriangle className="w-4 h-4" />;
      case "Resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "Denied":
        return <XCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In_Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Denied":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Complaint Details</h2>
                <p className="text-blue-100 text-sm">
                  #{complaint.complaint_id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Status Badge */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Badge
                className={`flex items-center gap-2 px-3 py-2 border ${getStatusColor(
                  complaint.status
                )}`}
              >
                {getStatusIcon(complaint.status)}
                <span className="font-medium">
                  {complaint.status.replace("_", " ")}
                </span>
              </Badge>
              <span className="text-sm text-gray-500">
                Submitted on{" "}
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* User Information Card */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    User Information
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">
                      {complaint.faculty_student_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User Type</p>
                    <p className="font-medium text-gray-900">
                      {complaint.user_type}
                    </p>
                  </div>
                  {complaint.year_level && (
                    <div>
                      <p className="text-sm text-gray-500">Year Level</p>
                      <p className="font-medium text-gray-900">
                        Year {complaint.year_level}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Information Card */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Location</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Laboratory</p>
                    <p className="font-medium text-gray-900">
                      {complaint.laboratories?.lab_name ||
                        `Lab ${complaint.lab_id}`}
                    </p>
                  </div>
                  {complaint.workstations && (
                    <div>
                      <p className="text-sm text-gray-500">Workstation</p>
                      <p className="font-medium text-gray-900">
                        {complaint.workstations.workstation_name}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Asset Information */}
          {complaint.asset_info && (
            <Card className="border-gray-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    Asset Information
                  </h3>
                </div>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {complaint.asset_info}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Issue Description */}
          <Card className="border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">
                  Issue Description
                </h3>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed">
                  {complaint.issue_description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Custodian Remarks */}
          <Card className="border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">
                  Custodian Remarks
                </h3>
              </div>

              {isEditing && onSave ? (
                <div className="space-y-4">
                  <Textarea
                    value={remarksText}
                    onChange={(e) => setRemarksText?.(e.target.value)}
                    placeholder="Add your remarks about this complaint..."
                    rows={4}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Completion Date
                    </Label>
                    <Input
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate?.(e.target.value)}
                      className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onSave(remarksText, completionDate)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={onEditToggle}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[80px]">
                    <p className="text-gray-900">
                      {complaint.remarks || "No remarks added yet"}
                    </p>
                  </div>
                  {complaint.resolved_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Completed:{" "}
                        {new Date(complaint.resolved_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Submitted Date & Time</p>
              <p className="font-medium text-gray-900">
                {new Date(complaint.created_at).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Monitored By</p>
              <p className="font-medium text-gray-900">
                {complaint.monitored_by || "Not assigned"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedComplaintDetailsModal;
