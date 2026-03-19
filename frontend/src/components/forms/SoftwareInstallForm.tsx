import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { submitSoftwareInstallation } from "../../api/forms";
import { generateFormDocument } from "../../utils/formTemplateMapping";
import api from "../../api/axios";

interface SoftwareInstallFormData {
  facultyName: string;
  date: string;
  laboratory: string;
  softwareList: string;
  requestedBy: string;
  approvedBy: string;
  installationRemarks: string;
  preparedBy: string;
  feedbackDate: string;
}

export const SoftwareInstallForm = () => {
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
  const [cooldownActive, setCooldownActive] = useState(false);
  const [assignedLab, setAssignedLab] = useState<string>('');

  const [formData, setFormData] = useState<SoftwareInstallFormData>({
    facultyName: "",
    date: "",
    laboratory: "lab1",
    softwareList: "",
    requestedBy: "",
    approvedBy: "DR. MARCO MARVIN L. RADO",
    installationRemarks: "",
    preparedBy: "",
    feedbackDate: "",
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
            approvedBy: custodianName, // Auto-populate approved by in all caps
            preparedBy: custodianName, // Auto-populate prepared by in all caps
          }));
        } catch (error) {
          console.error('Error fetching assigned lab:', error);
          // Fallback to basic logic
          const custodianName = user.role === 'Admin' ? 'SYSTEM ADMINISTRATOR' : user.name.toUpperCase();
          setFormData(prev => ({
            ...prev,
            approvedBy: custodianName,
            preparedBy: custodianName,
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
    
    // Only show assigned lab for Software Installation form
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

  const handleInputChange = (field: keyof SoftwareInstallFormData, value: string) => {
    let processedValue = value;
    
    // Process name fields to capitalize first letter of each word
    if (field === 'facultyName' || field === 'requestedBy') {
      processedValue = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await submitSoftwareInstallation({
        faculty_name: formData.facultyName,
        date: formData.date,
        laboratory: formData.laboratory,
        software_list: formData.softwareList,
        requested_by: formData.requestedBy,
        approved_by: formData.approvedBy,
        installation_remarks: formData.installationRemarks,
        prepared_by: formData.preparedBy,
        feedback_date: formData.feedbackDate || null,
        user_id: user?.id,
      });

      if (response.success) {
        setSubmitMessage("Software installation request submitted successfully!");
        setCooldownActive(true);
        // Reset cooldown after 5 seconds
        setTimeout(() => setCooldownActive(false), 5000);
        // Reset form but keep default values
        setFormData({
          facultyName: "",
          date: "",
          laboratory: "lab1",
          softwareList: "",
          requestedBy: "",
          approvedBy: "DR. MARCO MARVIN L. RADO", // Keep default value
          installationRemarks: "",
          preparedBy: "",
          feedbackDate: "",
        });
      } else {
        setSubmitMessage(response.message || "Failed to submit software installation request");
      }
    } catch (error) {
      setSubmitMessage("Error submitting software installation request");
      console.error("Software installation submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSoftwareReport = async () => {
    try {
      // Create form data object that matches the expected structure for template generation
      const formDataForTemplate = {
        type: 'software-install',
        details: {
          faculty_name: formData.facultyName,
          date: formData.date,
          laboratory: formData.laboratory,
          software_list: formData.softwareList,
          requested_by: formData.requestedBy,
          approved_by: formData.approvedBy,
          installation_remarks: formData.installationRemarks,
          prepared_by: formData.preparedBy,
          feedback_date: formData.feedbackDate,
        },
        name: formData.facultyName,
        purpose: formData.softwareList,
        laboratory: formData.laboratory,
        date: formData.date,
        softwareList: formData.softwareList,
      };
      
      await generateFormDocument(formDataForTemplate);
    } catch (error) {
      console.error('Error generating software report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          COLLEGE OF INFORMATION TECHNOLOGY
          <br />
          SOFTWARE INSTALLATION REQUEST FORM
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="software-facultyName">Faculty Name</Label>
              <Input
                id="software-facultyName"
                value={formData.facultyName}
                onChange={(e) => handleInputChange("facultyName", e.target.value)}
                placeholder="Enter faculty name"
                className="capitalize-first"
                required
              />
            </div>
            <div>
              <Label htmlFor="software-date">Date</Label>
              <Input
                id="software-date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
                className="cursor-pointer"
              />
            </div>
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

          <div>
            <Label htmlFor="software-softwareList">List of Software/Program to be installed</Label>
            <Textarea
              id="software-softwareList"
              value={formData.softwareList}
              onChange={(e) => handleInputChange("softwareList", e.target.value)}
              placeholder="List all software/programs to be installed"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="software-requestedBy">Requested by</Label>
            <Input
              id="software-requestedBy"
              value={formData.requestedBy}
              onChange={(e) => handleInputChange("requestedBy", e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label htmlFor="software-approvedBy">Approved by</Label>
              <Input
                id="software-approvedBy"
                value={formData.approvedBy}
                onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                placeholder="Laboratory Custodian"
                readOnly // Make read-only since it's auto-populated
              />
            </div>
            <div className="text-right text-sm text-gray-600 mt-6">
              Laboratory Custodian
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">INSTALLATION FEEDBACK FORM</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="software-installationRemarks">Remarks</Label>
                <Textarea
                  id="software-installationRemarks"
                  value={formData.installationRemarks}
                  onChange={(e) => handleInputChange("installationRemarks", e.target.value)}
                  placeholder="Enter installation feedback and remarks"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="software-preparedBy">Prepared by (Laboratory Custodian)</Label>
                  <Input
                    id="software-preparedBy"
                    value={formData.preparedBy}
                    onChange={(e) => handleInputChange("preparedBy", e.target.value)}
                    placeholder="Laboratory Custodian"
                    readOnly // Make read-only since it's auto-populated
                  />
                </div>
                <div>
                  <Label htmlFor="software-feedbackDate">Date</Label>
                  <Input
                    id="software-feedbackDate"
                    type="date"
                    value={formData.feedbackDate}
                    onChange={(e) => handleInputChange("feedbackDate", e.target.value)}
                    placeholder="Feedback date"
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <div className="text-right text-sm text-gray-600 mt-2">
                Laboratory Custodian
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6">
            <div></div>
            <div className="flex justify-center ml-32">
              <Button 
                type="submit" 
                variant="outline" 
                className="px-8 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm" 
                disabled={isSubmitting || cooldownActive}
              >
                {isSubmitting ? 'Submitting...' : cooldownActive ? 'Please wait...' : 'Submit Form'}
              </Button>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => generateSoftwareReport()} 
              className="flex items-center gap-2 px-6 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm" 
              disabled={isSubmitting}
            >
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

export default SoftwareInstallForm;
