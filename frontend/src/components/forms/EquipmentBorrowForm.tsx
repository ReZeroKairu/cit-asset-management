import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { submitEquipmentBorrow } from "../../api/forms";
import api from "../../api/axios";

interface EquipmentBorrowFormData {
  date: string;
  laboratory: string;
  facultyStudentName: string;
  yearLevel: string;
  releaseTime: string;
  returnedTime: string;
  equipmentList: Array<{unitQty: string; equipmentName: string}>;
  purpose: string;
  requestedBy: string;
  approvedBy: string;
  remarks: string;
  monitoredBy: string;
}

export const EquipmentBorrowForm = () => {
  const { user } = useAuth();
  
  // If user is not authenticated, show a message
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to access this form.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [assignedLab, setAssignedLab] = useState<string>('');

  const [formData, setFormData] = useState<EquipmentBorrowFormData>({
    date: "",
    laboratory: "lab1",
    facultyStudentName: "",
    yearLevel: "",
    releaseTime: "",
    returnedTime: "",
    equipmentList: [{ unitQty: "", equipmentName: "" }],
    purpose: "",
    requestedBy: "",
    approvedBy: "DR. MARCO MARVIN L. RADO",
    remarks: "",
    monitoredBy: "",
  });

  // Fetch assigned lab information and auto-populate form fields
  useEffect(() => {
    if (user && user.name) {
      // Fetch assigned lab name
      const fetchAssignedLab = async () => {
        try {
          const response = await api.get(`/api/one-time-forms/users/${user.id}/assigned-lab`);
          const labName = response.data.labName || '';
          setAssignedLab(labName);
          
          // Set custodian name in all caps
          const custodianName = user.role === 'Admin' ? 'SYSTEM ADMINISTRATOR' : user.name.toUpperCase();

          // Update form with fetched information
          setFormData(prev => ({
            ...prev,
            laboratory: labName.toLowerCase().replace(/\s+/g, '-'), // Use actual lab name (no E-Forum option)
            requestedBy: prev.requestedBy, // Keep manual entry for requested by
            approvedBy: prev.approvedBy, // Keep manual entry for approved by
            monitoredBy: custodianName, // Auto-populate monitored by in all caps
          }));
        } catch (error) {
          console.error('Error fetching assigned lab:', error);
          // Fallback to basic logic
          const custodianName = user.role === 'Admin' ? 'SYSTEM ADMINISTRATOR' : user.name.toUpperCase();
          setFormData(prev => ({
            ...prev,
            monitoredBy: custodianName,
          }));
        }
      };

      fetchAssignedLab();
    }
  }, [user]); // Run when user changes

  // Filter laboratory options based on assigned lab
  const getLabOptions = () => {
    // If no assigned lab, return empty array (no options)
    if (!assignedLab) {
      return [];
    }
    
    // Only show assigned lab for Equipment Borrow form
    const filteredOptions: Array<{value: string, label: string}> = [];
    
    // Add assigned lab using the actual lab name from database
    if (assignedLab) {
      // Create option for the assigned lab using its actual name
      const assignedLabOption = {
        value: assignedLab.toLowerCase().replace(/\s+/g, '-'), // Create a simple value
        label: assignedLab
      };
      filteredOptions.push(assignedLabOption);
    }
    
    return filteredOptions;
  };

  const handleInputChange = (field: keyof EquipmentBorrowFormData, value: string | Array<{unitQty: string; equipmentName: string}>) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEquipmentListChange = (index: number, field: 'unitQty' | 'equipmentName', value: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentList: prev.equipmentList.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addEquipmentItem = () => {
    setFormData(prev => ({
      ...prev,
      equipmentList: [...prev.equipmentList, { unitQty: "", equipmentName: "" }]
    }));
  };

  const removeEquipmentItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipmentList: prev.equipmentList.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await submitEquipmentBorrow({
        date: formData.date,
        laboratory: formData.laboratory,
        faculty_student_name: formData.facultyStudentName,
        year_level: formData.yearLevel,
        release_time: formData.releaseTime,
        returned_time: formData.returnedTime,
        equipment_list: formData.equipmentList,
        purpose: formData.purpose,
        requested_by: formData.requestedBy,
        approved_by: formData.approvedBy,
        remarks: formData.remarks,
        monitored_by: formData.monitoredBy,
        user_id: user?.id,
      });

      if (response.success) {
        console.log('✅ Equipment borrow submission successful:', response);
        setSubmitMessage("Equipment borrow request submitted successfully!");
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitMessage(null);
        }, 5000);
        // Reset form after a short delay to show the success message
        setTimeout(() => {
          setFormData({
            date: "",
            laboratory: "lab1",
            facultyStudentName: "",
            yearLevel: "",
            releaseTime: "",
            returnedTime: "",
            equipmentList: [{ unitQty: "", equipmentName: "" }],
            purpose: "",
            requestedBy: "",
            approvedBy: "DR. MARCO MARVIN L. RADO", // Keep default value
            remarks: "",
            monitoredBy: "",
          });
        }, 2000); // Reset form after 2 seconds
      } else {
        console.log('❌ Equipment borrow submission failed:', response);
        setSubmitMessage(response.message || "Failed to submit equipment borrow request");
        // Clear error message after 5 seconds
        setTimeout(() => {
          setSubmitMessage(null);
        }, 5000);
      }
    } catch (error) {
      setSubmitMessage("Error submitting equipment borrow request");
      console.error("Equipment borrow submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateEquipmentReport = () => {
    const reportContent = `
COLLEGE OF INFORMATION TECHNOLOGY
EQUIPMENT BORROWING FORM

Date: ${formData.date}
Laboratory: ${formData.laboratory}
Faculty/Student Name: ${formData.facultyStudentName}
Year Level: ${formData.yearLevel}
Release Time: ${formData.releaseTime}
Returned Time: ${formData.returnedTime}

Equipment List:
${formData.equipmentList.map((item, index) => 
  `${index + 1}. ${item.equipmentName} - Quantity: ${item.unitQty}`
).join('\n')}

Purpose: ${formData.purpose}

Requested by: ${formData.requestedBy}

MONITORING FORM FOR BORROWED EQUIPMENT
Remarks: ${formData.remarks}
Monitored by: ${formData.monitoredBy}

Laboratory Custodian
    `.trim();

    // Create and download equipment report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-borrow-${formData.date || new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          COLLEGE OF INFORMATION TECHNOLOGY
          <br />
          EQUIPMENT BORROWING FORM
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="laboratory">Laboratory</Label>
              <Select value={formData.laboratory} onValueChange={(value) => handleInputChange("laboratory", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select laboratory" />
                </SelectTrigger>
                <SelectContent>
                  {getLabOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div></div>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment-facultyStudentName">Faculty/Student Name</Label>
              <Input
                id="equipment-facultyStudentName"
                value={formData.facultyStudentName}
                onChange={(e) => handleInputChange("facultyStudentName", e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="equipment-yearLevel">Year Level</Label>
              <Input
                id="equipment-yearLevel"
                value={formData.yearLevel}
                onChange={(e) => handleInputChange("yearLevel", e.target.value)}
                placeholder="Enter year level"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="releaseTime">Release Time</Label>
              <Input
                id="releaseTime"
                type="time"
                value={formData.releaseTime}
                onChange={(e) => handleInputChange("releaseTime", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="returnedTime">Returned Time</Label>
              <Input
                id="returnedTime"
                type="time"
                value={formData.returnedTime}
                onChange={(e) => handleInputChange("returnedTime", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Equipment List</Label>
            <div className="border border-gray-200 rounded-lg p-4 mt-2">
              <div className="grid grid-cols-3 gap-4 mb-3 font-semibold">
                <div>Unit/Oty.</div>
                <div>Equipment Name</div>
                <div></div>
              </div>
              {formData.equipmentList.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-2 items-center">
                  <div>
                    <Input
                      id={`equipment-qty-${index}`}
                      value={item.unitQty}
                      onChange={(e) => handleEquipmentListChange(index, 'unitQty', e.target.value)}
                      placeholder="Unit/Quantity"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      id={`equipment-name-${index}`}
                      value={item.equipmentName}
                      onChange={(e) => handleEquipmentListChange(index, 'equipmentName', e.target.value)}
                      placeholder="Equipment name"
                      required
                    />
                  </div>
                  <div>
                    {formData.equipmentList.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEquipmentItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addEquipmentItem}
                className="mt-3"
              >
                + Add Equipment
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="equipment-purpose">Purpose</Label>
            <Textarea
              id="equipment-purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              placeholder="Describe the purpose of equipment borrowing"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="equipment-requestedBy">Requested by</Label>
            <Input
              id="equipment-requestedBy"
              value={formData.requestedBy}
              onChange={(e) => handleInputChange("requestedBy", e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label htmlFor="equipment-approvedBy">Approved by</Label>
              <Input
                id="equipment-approvedBy"
                value={formData.approvedBy}
                onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                placeholder="DR. MARCO MARVIN L. RADO"
                required
              />
            </div>
            <div className="text-right text-sm text-gray-600 mt-6">
              Dean
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">MONITORING FORM FOR BORROWED EQUIPMENT</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipment-remarks">Remarks</Label>
                <Textarea
                  id="equipment-remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Enter remarks about the borrowed equipment"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="equipment-monitoredBy">Monitored by</Label>
                <Input
                  id="equipment-monitoredBy"
                  value={formData.monitoredBy}
                  onChange={(e) => handleInputChange("monitoredBy", e.target.value)}
                  placeholder="Laboratory Custodian name"
                  readOnly // Make read-only since it's auto-populated
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
            <Button type="button" variant="outline" onClick={() => generateEquipmentReport()} className="flex items-center gap-2" disabled={isSubmitting}>
              <Download className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </form>

        {/* Success/Error Message */}
        {submitMessage && (
          <div className={`p-4 rounded-lg ${
            submitMessage.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {submitMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentBorrowForm;
