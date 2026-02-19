import React from 'react';
import { type FormSubmission } from '../../types/forms';
import { format } from "date-fns";
import { Eye, Download, User, Clock, Edit } from "lucide-react";
import { generateFormDocument } from "../../utils/formTemplateMapping";
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface FormListProps {
  forms: FormSubmission[];
  loading: boolean;
  onViewDetails: (form: FormSubmission) => void;
  getStatusColor: (status: string) => string;
  getFormTypeLabel: (type: string) => string;
  onUpdateStatus: (id: number, type: string, status: string) => void;
  userRole: string;
  selectedForms?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onBulkApprove?: () => void;
  onEditForm?: (form: FormSubmission) => void; // Add edit form handler
}

export const FormList: React.FC<FormListProps> = ({
  forms,
  loading,
  onViewDetails,
  getStatusColor,
  getFormTypeLabel,
  onUpdateStatus,
  userRole,
  selectedForms = new Set(),
  onSelectionChange = () => {},
  onBulkApprove = () => {},
  onEditForm = () => {}, // Add edit form handler
}) => {
  const handleCheckboxChange = (formId: string, checked: boolean) => {
    const newSelected = new Set(selectedForms);
    if (checked) {
      newSelected.add(formId);
    } else {
      newSelected.delete(formId);
    }
    onSelectionChange?.(newSelected);
  };

  const handleGenerateForm = async (form: FormSubmission) => {
    try {
      await generateFormDocument(form);
    } catch (error) {
      console.error('Error generating form:', error);
      alert('Failed to generate form document. Please try again.');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allApprovableForms = forms
        .filter(form => userRole === 'Admin' && form.status === 'Custodian_Approved')
        .map(form => `${form.type}-${form.id}`);
      onSelectionChange?.(new Set(allApprovableForms));
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const approvableForms = forms.filter(form => userRole === 'Admin' && form.status === 'Custodian_Approved');
  const allSelected = approvableForms.length > 0 && approvableForms.every(form => selectedForms.has(`${form.type}-${form.id}`));
  const someSelected = approvableForms.some(form => selectedForms.has(`${form.type}-${form.id}`));

  if (loading) {
    return <div>Loading...</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No forms found matching the current filters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userRole === 'Admin' && approvableForms.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected && !allSelected;
                }
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              {allSelected ? 'Deselect All' : 'Select All'} ({selectedForms.size} selected)
            </span>
          </div>
          {selectedForms.size > 0 && (
            <Button
              onClick={onBulkApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              Approve Selected ({selectedForms.size})
            </Button>
          )}
        </div>
      )}
      
      {forms.map((form) => {
        const formId = `${form.type}-${form.id}`;
        const isApprovable = userRole === 'Admin' && form.status === 'Custodian_Approved';
        const isSelected = selectedForms.has(formId);
        
        return (
          <div key={formId} className="border rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {isApprovable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleCheckboxChange(formId, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium">{getFormTypeLabel(form.type)}</h3>
                      <Badge variant="outline" className={getStatusColor(form.status)}>
                        {form.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {form.purpose && (
                      <p className="text-sm text-gray-600 mb-2">
                        {form.purpose}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{form.name}</span>
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{format(new Date(form.date), 'M/d/yyyy')}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Submitted: {format(new Date(form.createdAt || form.date), 'M/d/yyyy, h:mm:ss a')}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(form)}
                      className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-100 rounded-md"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {userRole !== 'Admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerateForm(form)}
                        className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-100 rounded-md"
                        title="Generate Form Document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {userRole === 'Admin' && form.status === 'Custodian_Approved' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 cursor-pointer"
                          onClick={() => onUpdateStatus(form.id, form.type, 'Admin_Approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white h-8 cursor-pointer"
                          onClick={() => onUpdateStatus(form.id, form.type, 'Denied')}
                        >
                          Deny
                        </Button>
                      </>
                    )}
                    
                    {/* Software Installation: Edit and Complete buttons for Custodian_Approved status */}
                    {form.type === 'software-install' && form.status === 'Custodian_Approved' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditForm(form)} // Use edit handler
                          className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-100 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Edit Installation Details"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 cursor-pointer"
                          onClick={() => {
                            // Check if required fields are filled before marking as completed
                            const installationRemarks = form.details.installation_remarks;
                            const feedbackDate = form.details.feedback_date;
                            
                            if (!installationRemarks || !feedbackDate) {
                              const missingFields = [];
                              if (!installationRemarks) missingFields.push('Installation Remarks');
                              if (!feedbackDate) missingFields.push('Feedback Date');
                              
                              alert(`Please fill in the following required fields before marking as completed:\n\n${missingFields.join('\n')}\n\nClick "Edit" to update form details.`);
                              return;
                            }
                            
                            onUpdateStatus(form.id, form.type, 'Completed');
                          }}
                        >
                          Completed
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
