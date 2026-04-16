import { Card, CardContent } from "../ui/card";
import { useEffect } from "react";
import { 
  Users, 
  User, 
  MapPin, 
  FileText,
  X
} from "lucide-react";

interface CITLabUsersLog {
  log_id: number;
  date: string;
  time_in: string;
  time_out: string | null;
  usage_type: string;
  faculty_student_name: string;
  user_type: string;
  year_level: string | null;
  laboratory: string;
  ws_number: string | null;
  purpose: string;
  monitored_by: string | null;
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
  
  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
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
                        <p className="font-medium text-gray-900">{log.year_level.replace(' Year', '')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
              </div>
            </CardContent>
          </Card>

          {/* Timestamp Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Reservation Date</p>
              <p className="font-medium text-gray-900">
                {new Date(log.date).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Time In</p>
              <p className="font-medium text-gray-900 font-mono">
                {log.time_in}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Time Out</p>
              <p className="font-medium text-gray-900 font-mono">
                {log.time_out || 'Not logged out'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Logged Date & Time</p>
              <p className="font-medium text-gray-900">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CITLabUsersDetailsModal;
