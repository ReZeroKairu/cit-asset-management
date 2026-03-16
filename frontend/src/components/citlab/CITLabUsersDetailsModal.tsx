import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  Users, 
  User, 
  MapPin, 
  FileText,
  Clock,
  X,
  Printer,
  Globe
} from "lucide-react";

interface CITLabUsersLog {
  log_id: number;
  usage_type: string;
  faculty_student_name: string;
  user_type: string;
  year_level: string | null;
  laboratory: string;
  printing_pages: string | null;
  ws_number: string | null;
  purpose: string;
  monitored_by: string | null;
  ip_address: string | null;
  created_at: string;
}

interface CITLabUsersDetailsModalProps {
  log: CITLabUsersLog;
  isOpen: boolean;
  onClose: () => void;
}

const CITLabUsersDetailsModal = ({
  log,
  isOpen,
  onClose
}: CITLabUsersDetailsModalProps) => {
  const getUsageTypeIcon = (usageType: string) => {
    switch (usageType) {
      case "set-in-reservation": return <Clock className="w-4 h-4" />;
      case "walk-in": return <Users className="w-4 h-4" />;
      case "printing": return <Printer className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getUsageTypeColor = (usageType: string) => {
    switch (usageType) {
      case "set-in-reservation": return "bg-blue-100 text-blue-800 border-blue-200";
      case "walk-in": return "bg-green-100 text-green-800 border-green-200";
      case "printing": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "Student": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Faculty": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
              <Users className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Lab Usage Details</h2>
                <p className="text-blue-100 text-sm">Log #{log.log_id}</p>
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
          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* User Information Card */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">User Information</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{log.faculty_student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User Type</p>
                    <p className="font-medium text-gray-900">{log.user_type}</p>
                  </div>
                  {log.year_level && (
                    <div>
                      <p className="text-sm text-gray-500">Year Level</p>
                      <p className="font-medium text-gray-900">{log.year_level}</p>
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
                    <p className="font-medium text-gray-900">{log.laboratory}</p>
                  </div>
                  {log.ws_number && (
                    <div>
                      <p className="text-sm text-gray-500">Workstation</p>
                      <p className="font-medium text-gray-900">{log.ws_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Details */}
          <Card className="border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Purpose & Usage</h3>
              </div>
              
              {/* Usage Type Section */}
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  <span className="font-medium text-sm">
                    {log.usage_type === 'set-in-reservation' ? 'Set-in/Reservation' : 
                     log.usage_type === 'printing' ? 'Printing' : 
                     log.usage_type}
                  </span>
                </div>
              </div>
              
              {/* Purpose Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed">{log.purpose}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          {log.printing_pages && (
            <Card className="border-gray-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Printing Details</h3>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-gray-900">Pages: {log.printing_pages}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monitoring Information */}
          <Card className="border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Monitoring Information</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900">
                    Monitored by: {log.monitored_by || 'Not assigned'}
                  </p>
                </div>
                {log.ip_address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span>IP Address: {log.ip_address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamp Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Logged Date & Time</p>
              <p className="font-medium text-gray-900">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Usage Type</p>
              <p className="font-medium text-gray-900 capitalize">
                {log.usage_type.replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CITLabUsersDetailsModal;
