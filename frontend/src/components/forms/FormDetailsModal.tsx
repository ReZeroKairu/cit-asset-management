import React, { useState } from "react";
import { type FormSubmission } from "../../types/forms";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { updateLabRequestDetails, updateEquipmentBorrowDetails, updateSoftwareInstallDetails } from "../../api/forms";

interface FormDetailsModalProps {
  show: boolean;
  form: FormSubmission | null;
  editMode?: boolean;
  onClose: () => void;
  onUpdateStatus?: (formId: number, formType: string, newStatus: string) => void;
  onUpdate?: () => void; // Add callback to refresh data after save
  userRole?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Custodian_Approved':
      return 'bg-blue-100 text-blue-800';
    case 'Admin_Approved':
      return 'bg-green-100 text-green-800';
    case 'Denied':
      return 'bg-red-100 text-red-800';
    case 'Returned':
      return 'bg-purple-100 text-purple-800';
    case 'Completed':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getFormTypeLabel = (type: string) => {
  switch (type) {
    case 'lab-request':
      return 'Lab Request';
    case 'equipment-borrow':
      return 'Equipment Borrow';
    case 'software-install':
      return 'Software Installation';
    default:
      return type;
  }
};

export const FormDetailsModal: React.FC<FormDetailsModalProps> = ({ 
  show, 
  form, 
  editMode = false,
  onClose, 
  onUpdateStatus,
  onUpdate,
  userRole 
}) => {
  const [editFormData, setEditFormData] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Debug logging
  console.log('FormDetailsModal - Form data:', form?.details);
  console.log('FormDetailsModal - Edit mode:', editMode);
  console.log('FormDetailsModal - Edit form data:', editFormData);
  console.log('FormDetailsModal - Remarks exists:', !!form?.details?.remarks, 'Value:', form?.details?.remarks);
  
  // Initialize edit form data when entering edit mode
  React.useEffect(() => {
    if (editMode && form && !isInitialized) {
      const initialData = {
        time_out: form.details.time_out || '',
        returned_time: form.details.returned_time || '',
        remarks: form.details.remarks || '',
        installation_remarks: form.details.installation_remarks || '',
        feedback_date: (() => {
          const feedbackDate = form.details.feedback_date;
          if (!feedbackDate) return '';
          
          if (typeof feedbackDate === 'string') {
            if (feedbackDate.includes('T')) {
              const date = new Date(feedbackDate);
              return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for date input
            } else {
              return feedbackDate; // Return as-is if already in correct format
            }
          } else if (feedbackDate instanceof Date) {
            return feedbackDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD for date input
          }
          
          return '';
        })()
      };
      setEditFormData(initialData);
      setIsInitialized(true);
      console.log('Edit form data initialized:', initialData);
    } else if (!editMode) {
      setEditFormData({});
      setIsInitialized(false);
    }
  }, [editMode, form, isInitialized]);
  
  console.log('FormDetailsModal props:', { show, form: form ? 'exists' : 'null', userRole, editMode });
  console.log('Modal should render:', !(!show || !form));
  
  if (!show || !form) {
    console.log('Modal not rendering - show:', show, 'form:', form);
    return null;
  }

  const canEdit = (userRole === 'Custodian' && form.status === 'Admin_Approved') || 
                   (userRole === 'Custodian' && form.type === 'software-install' && form.status === 'Custodian_Approved');

  console.log('Modal rendering...', { show, form: form?.id, formType: form?.type });
  return (
  <>
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-[99999] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  {form.type === 'lab-request' && '🔬'}
                  {form.type === 'equipment-borrow' && '💻'}
                  {form.type === 'software-install' && '⚙️'}
                </div>
                {getFormTypeLabel(form.type)} Details
              </h2>
              <p className="text-blue-100 mt-1">Request ID: #{form.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                onClick={onClose}
              >
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Bar */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <div className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(form.status)}`}>
                  {form.status}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Submitted</span>
                <p className="font-medium">{new Date(form.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        
        {form.type === 'lab-request' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  🔬 Laboratory Request Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Faculty/Student Name</label>
                      <p className="font-medium text-gray-900">{form.details.faculty_student_name}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Year Level</label>
                      <p className="font-medium text-gray-900">{form.details.year_level}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Usage Type</label>
                      <p className="font-medium text-gray-900 capitalize">{form.details.usage_type?.replace('-', ' ')}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Laboratory</label>
                      <p className="font-medium text-gray-900 uppercase">{form.details?.laboratory || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">WS Number</label>
                      <p className="font-medium text-gray-900">{form.details.ws_number}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Time In</label>
                      <p className="font-medium text-gray-900">{form.details.time_in}</p>
                    </div>
                    <div className={`bg-white p-3 rounded border ${canEdit && editMode ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Time Out</label>
                      {canEdit && editMode ? (
                        <Input
                          type="time"
                          value={editFormData.time_out || ''}
                          onChange={(e) => setEditFormData({...editFormData, time_out: e.target.value})}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium text-gray-900">
                          {form.details.time_out || <span className="text-gray-400 italic">To be filled by Custodian</span>}
                        </p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Requested by</label>
                      <p className="font-medium text-gray-900">{form.details?.requested_by || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Approved by</label>
                      <p className="font-medium text-gray-900">
                        {form.details.approved_by || 'DR. MARCO MARVIN L. RADO'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Monitored by</label>
                      <p className="font-medium text-gray-900">{form.details?.monitored_by || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {form.details.purpose && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Purpose</h4>
                  <p className="text-gray-700">{form.details.purpose}</p>
                </div>
              )}
              
              {canEdit && editMode && (
                <div className={`bg-gray-50 border rounded-lg p-4 ${canEdit && editMode ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                  <Textarea
                    value={editFormData.remarks || ''}
                    onChange={(e) => setEditFormData({...editFormData, remarks: e.target.value})}
                    placeholder="Add remarks about this request"
                    rows={3}
                  />
                </div>
              )}
              
              {!editMode && (form.details.remarks || form.status === 'Completed') && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                  <p className="text-gray-700">
                    {form.details.remarks || <span className="text-gray-400 italic">No remarks provided</span>}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {form.type === 'equipment-borrow' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  💻 Equipment Borrow Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Faculty/Student Name</label>
                      <p className="font-medium text-gray-900">{form.details.faculty_student_name}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Year Level</label>
                      <p className="font-medium text-gray-900">{form.details.year_level}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Laboratory</label>
                      <p className="font-medium text-gray-900 uppercase">{form.details?.laboratory || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Release Time</label>
                      <p className="font-medium text-gray-900">{form.details.release_time}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`bg-white p-3 rounded border ${canEdit && editMode ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Returned Time</label>
                      {canEdit && editMode ? (
                        <Input
                          type="time"
                          value={editFormData.returned_time || ''}
                          onChange={(e) => setEditFormData({...editFormData, returned_time: e.target.value})}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium text-gray-900">
                          {form.details.returned_time || <span className="text-gray-400 italic">To be filled by Custodian</span>}
                        </p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Requested by</label>
                      <p className="font-medium text-gray-900">{form.details?.requested_by || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Approved by</label>
                      <p className="font-medium text-gray-900">
                        {form.details.approved_by || 'DR. MARCO MARVIN L. RADO'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Monitored by</label>
                      <p className="font-medium text-gray-900">{form.details?.monitored_by || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {form.details.equipment_list && Array.isArray(form.details.equipment_list) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-3">Equipment List</h4>
                  <div className="space-y-2">
                    {form.details.equipment_list.map((item: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{item.equipmentName}</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                          Qty: {item.unitQty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {form.details.purpose && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Purpose</h4>
                  <p className="text-gray-700">{form.details.purpose}</p>
                </div>
              )}
              
              {canEdit && editMode && (
                <div className={`bg-gray-50 border rounded-lg p-4 ${canEdit && editMode ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                  <Textarea
                    value={editFormData.remarks || ''}
                    onChange={(e) => setEditFormData({...editFormData, remarks: e.target.value})}
                    placeholder="Add remarks about this request"
                    rows={3}
                  />
                </div>
              )}
              
              {!editMode && (form.details.remarks || form.status === 'Returned') && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                  <p className="text-gray-700">
                    {form.details.remarks || <span className="text-gray-400 italic">No remarks provided</span>}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {form.type === 'software-install' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  ⚙️ Software Installation Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Faculty Name</label>
                      <p className="font-medium text-gray-900">{form.details.faculty_name}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Date</label>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const dateInput = form.details.date;
                          if (!dateInput) return '';
                          
                          let date: Date;
                          if (typeof dateInput === 'string') {
                            if (dateInput.includes('T')) {
                              date = new Date(dateInput);
                            } else {
                              date = new Date(dateInput + 'T00:00:00.000Z');
                            }
                          } else if (dateInput instanceof Date) {
                            date = dateInput;
                          } else {
                            date = new Date();
                          }
                          
                          return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          });
                        })()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Laboratory</label>
                      <p className="font-medium text-gray-900 uppercase">{form.details?.laboratory || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Requested by</label>
                      <p className="font-medium text-gray-900">{form.details?.requested_by || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Approved by</label>
                      <p className="font-medium text-gray-900">{form.details.prepared_by || form.details.approved_by}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Prepared by</label>
                      <p className="font-medium text-gray-900">{form.details.prepared_by}</p>
                    </div>
                    {/* Add feedback date field for software installation forms */}
                    {form.type === 'software-install' && (
                      <div className={`bg-white p-3 rounded border ${canEdit && editMode ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Feedback Date</label>
                        {canEdit && editMode ? (
                          <Input
                            type="date"
                            value={editFormData.feedback_date || ''}
                            onChange={(e) => setEditFormData({...editFormData, feedback_date: e.target.value})}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {(() => {
                              const feedbackDate = form.details.feedback_date;
                              if (!feedbackDate) return '';
                              
                              if (typeof feedbackDate === 'string') {
                                if (feedbackDate.includes('T')) {
                                  const date = new Date(feedbackDate);
                                  return date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  });
                                } else {
                                  return feedbackDate; // Return as-is if no T
                                }
                              } else if (feedbackDate instanceof Date) {
                                return feedbackDate.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                });
                              }
                              
                              return '';
                            })()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {form.details.software_list && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-900 mb-2">Software List</h4>
                  <p className="text-gray-700">{form.details.software_list}</p>
                </div>
              )}
              
              {canEdit && editMode && (
                <div className={`bg-gray-50 border rounded-lg p-4 ${canEdit && editMode ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                  <h4 className="font-medium text-gray-900 mb-2">Installation Remarks</h4>
                  <Textarea
                    value={editFormData.installation_remarks || ''}
                    onChange={(e) => setEditFormData({...editFormData, installation_remarks: e.target.value})}
                    placeholder="Add installation feedback and remarks"
                    rows={3}
                  />
                </div>
              )}
              
              {!editMode && form.details.installation_remarks && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Installation Remarks</h4>
                  <p className="text-gray-700">{form.details.installation_remarks}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Edit Action Buttons - Fixed at bottom */}
        {editMode && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-3 justify-end">
              <Button 
                onClick={async () => {
                  if (onUpdateStatus && form) {
                    try {
                      // Create the update data based on form type
                      const updateData: any = {};
                      
                      if (form.type === 'lab-request') {
                        updateData.time_out = editFormData.time_out;
                      } else if (form.type === 'equipment-borrow') {
                        updateData.returned_time = editFormData.returned_time;
                      }
                      
                      // Always update remarks if provided
                      if (editFormData.remarks !== undefined) {
                        updateData.remarks = editFormData.remarks;
                      }
                      
                      // Always update installation_remarks if provided (for software install forms)
                      if (editFormData.installation_remarks !== undefined) {
                        updateData.installation_remarks = editFormData.installation_remarks;
                      }

                      // Always update feedback_date if provided (for software install forms)
                      if (editFormData.feedback_date !== undefined) {
                        updateData.feedback_date = editFormData.feedback_date;
                      }

                      console.log('Saving edited form data:', updateData);
                      
                      // Call the appropriate API function based on form type
                      if (form.type === 'lab-request') {
                        await updateLabRequestDetails(form.id, updateData);
                      } else if (form.type === 'equipment-borrow') {
                        await updateEquipmentBorrowDetails(form.id, updateData);
                      } else if (form.type === 'software-install') {
                        await updateSoftwareInstallDetails(form.id, updateData);
                      }
                      
                      console.log('Form updated successfully with data:', updateData);
                      alert('Form updated successfully!');
                      
                      // Call onUpdate to refresh the parent component's data
                      if (onUpdate) {
                        onUpdate();
                      }
                      
                      // Close the modal and reset edit mode
                      if (onClose) {
                        onClose();
                      }
                      
                    } catch (error) {
                      console.error('Error updating form:', error);
                      alert('Error updating form. Please try again.');
                    }
                  }
                }} 
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              >
                Save Changes
              </Button>
              <Button onClick={onClose} variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
  );
};

export default FormDetailsModal;
