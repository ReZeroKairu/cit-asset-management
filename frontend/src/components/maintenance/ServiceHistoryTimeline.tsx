import React from "react";
import {
  Wrench,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import type { ServiceLog } from "../../api/maintenance";

interface Props {
  logs: ServiceLog[];
}

const ServiceHistoryTimeline: React.FC<Props> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No service history available yet.
      </div>
    );
  }

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case "REPAIR":
        return <Wrench className="h-5 w-5" />;
      case "REPLACEMENT":
        return <RefreshCw className="h-5 w-5" />;
      case "UPGRADE":
        return <ArrowUpCircle className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const getServiceTypeBadgeColor = (serviceType: string) => {
    switch (serviceType) {
      case "REPAIR":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "REPLACEMENT":
        return "bg-red-100 text-red-700 border-red-300";
      case "UPGRADE":
        return "bg-purple-100 text-purple-700 border-purple-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {logs.map((log, index) => (
        <div key={log.log_id} className="relative">
          {/* Timeline Line */}
          {index !== logs.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
          )}

          {/* Log Card */}
          <div className="flex gap-4">
            {/* Icon Circle */}
            <div
              className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getServiceTypeBadgeColor(
                log.service_type,
              )} border-2`}
            >
              {getServiceTypeIcon(log.service_type)}
            </div>

            {/* Log Content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded border ${getServiceTypeBadgeColor(
                        log.service_type,
                      )}`}
                    >
                      {log.service_type}
                    </span>
                    <span className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(log.service_date)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    Performed by {log.user?.full_name || "Unknown"}
                  </div>
                </div>
              </div>

              {/* Status Change */}
              {log.workstation_status_before &&
                log.workstation_status_after && (
                  <div className="mb-3 p-2 bg-gray-50 rounded flex items-center gap-2 text-sm">
                    <span className="font-medium">Status:</span>
                    <span className="text-gray-600">
                      {log.workstation_status_before}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-green-700">
                      {log.workstation_status_after}
                    </span>
                  </div>
                )}

              {/* Asset Actions */}
              {log.asset_actions && log.asset_actions.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Component Actions:
                  </h4>
                  <ul className="space-y-1.5">
                    {log.asset_actions.map((action) => (
                      <li
                        key={action.id}
                        className="text-sm text-gray-700 flex items-start"
                      >
                        <span className="mr-2">•</span>
                        <div className="flex-1">
                          <span className="font-medium">{action.action}</span>
                          {" - "}
                          <span>
                            {action.asset?.units?.unit_name || "Unknown"}{" "}
                          </span>
                          {action.old_property_tag &&
                            action.new_property_tag && (
                              <span className="text-gray-600">
                                ({action.old_property_tag} →{" "}
                                {action.new_property_tag})
                              </span>
                            )}
                          {action.old_property_tag &&
                            !action.new_property_tag && (
                              <span className="text-gray-600">
                                ({action.old_property_tag})
                              </span>
                            )}
                          {action.status_before && action.status_after && (
                            <span className="text-gray-600">
                              {" "}
                              - {action.status_before} → {action.status_after}
                            </span>
                          )}
                          {action.remarks && (
                            <div className="text-xs text-gray-500 mt-0.5 ml-2">
                              Note: {action.remarks}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Procedures Performed */}
              {log.log_procedures && log.log_procedures.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Procedures Performed:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {log.log_procedures.map((proc) => (
                      <span
                        key={proc.id}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300"
                      >
                        {proc.procedure?.procedure_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {log.remarks && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Remarks:</span> {log.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceHistoryTimeline;
