import React from 'react';
import { type FormSubmission } from '../../types/forms';
import { format } from "date-fns";
import { Download, Edit } from "lucide-react";
import { generateFormDocument } from "../../utils/formTemplateMapping";
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
  console.log('📋 FormList received:', {
    formsCount: forms.length,
    forms: forms.map(f => ({ id: f.id, status: f.status, type: f.type })),
    loading
  });
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
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer checked:bg-blue-600 checked:border-blue-600"
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
      
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {userRole === 'Admin' && approvableForms.length > 0 && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Select
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">
                Form Info
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                User Details
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Submitted
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.map((form) => {
              const formId = `${form.type}-${form.id}`;
              const isApprovable = userRole === 'Admin' && form.status === 'Custodian_Approved';
              const isSelected = selectedForms.has(formId);
              
              return (
                <tr key={formId} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                  // Don't open modal if clicking on input elements (checkboxes)
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'INPUT') return;
                  onViewDetails(form);
                }}>
                  {userRole === 'Admin' && approvableForms.length > 0 && (
                    <td className="px-3 py-4 whitespace-nowrap">
                      {isApprovable && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(formId, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                          />
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getFormTypeLabel(form.type)}
                    </div>
                    {form.purpose && (
                      <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                        {form.purpose}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {form.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {form.type === 'lab-request' && (
                        <>
                          {form.details?.user_type && (
                            <span className="capitalize">{form.details.user_type.replace('-', ' ')}</span>
                          )}
                          {form.details?.usage_type && (
                            <span> • {form.details.usage_type.replace('-', ' ')}</span>
                          )}
                        </>
                      )}
                      {form.type !== 'lab-request' && form.laboratory && (
                        <span>{form.laboratory}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(form.status)}`}>
                      {form.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {format(new Date(form.createdAt || form.date), 'M/d/yyyy, h:mm a')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {userRole !== 'Admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGenerateForm(form)}
                          className="p-2 h-8 w-8 cursor-pointer hover:bg-green-100 rounded-md text-green-600 hover:text-green-700 transition-colors"
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
                            className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-200 rounded-md text-blue-600 hover:text-blue-700"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
