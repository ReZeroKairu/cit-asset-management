import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Year levels for students
const yearLevels = [
  "1",
  "2", 
  "3",
  "4",
  "5"
];
import { submitLabRequest } from "../../api/forms";
import { generateFormDocument } from "../../utils/formTemplateMapping";
import api from "../../api/axios";

interface LabRequestFormData {
  date: string;
  usageType: "printing" | "set-in-reservation";
  userType: "student" | "faculty";
  facultyStudentName: string;
  yearLevel: string;
  laboratory: string;
  printingPages: string;
  wsNumber: string;
  timeIn: string;
  timeOut: string;
  purpose: string;
  requestedBy: string;
  approvedBy: string;
  remarks: string;
  monitoredBy: string;
}

export const LabRequestForm = () => {
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

  const [formData, setFormData] = useState<LabRequestFormData>({
    date: "",
    usageType: "printing",
    userType: "student",
    facultyStudentName: "",
    yearLevel: "",
    laboratory: "lab1",
    printingPages: "",
    wsNumber: "",
    timeIn: "",
    timeOut: "",
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
            laboratory: prev.laboratory === "e-forum" ? prev.laboratory : labName.toLowerCase().replace(/\s+/g, '-'), // Use actual lab name
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
    // E-Forum is always available but excluded for printing
    const eForumOption = { value: "e-forum", label: "E-Forum" };
    
    // If no assigned lab, only return E-Forum (unless printing)
    if (!assignedLab) {
      return formData.usageType === "printing" ? [] : [eForumOption];
    }
    
    // Filter options: include E-Forum + assigned lab if it exists (exclude E-Forum for printing)
    const filteredOptions: Array<{value: string, label: string}> = [];
    
    // Only add E-Forum if usage type is not printing
    if (formData.usageType !== "printing") {
      filteredOptions.push(eForumOption);
    }
    
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

  const handleInputChange = (field: keyof LabRequestFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Validation
    if (formData.usageType === "printing" && !formData.printingPages.trim()) {
      setSubmitMessage("Please enter the number of printing pages");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await submitLabRequest({
        date: formData.date,
        usage_type: formData.usageType,
        user_type: formData.userType,
        faculty_student_name: formData.facultyStudentName,
        year_level: formData.yearLevel,
        laboratory: formData.laboratory,
        printing_pages: formData.printingPages,
        ws_number: formData.wsNumber,
        time_in: formData.timeIn,
        time_out: formData.timeOut,
        purpose: formData.purpose,
        requested_by: formData.requestedBy,
        approved_by: formData.approvedBy,
        remarks: formData.remarks,
        monitored_by: formData.monitoredBy,
        user_id: user?.id,
      });

      if (response.success) {
        setSubmitMessage("Lab request submitted successfully!");
        setCooldownActive(true);
        // Reset cooldown after 5 seconds
        setTimeout(() => setCooldownActive(false), 5000);
        // Reset form but keep default values
        setFormData({
          date: "",
          usageType: "printing",
          userType: "student",
          facultyStudentName: "",
          yearLevel: "",
          laboratory: "lab1",
          printingPages: "",
          wsNumber: "",
          timeIn: "",
          timeOut: "",
          purpose: "",
          requestedBy: "",
          approvedBy: "",
          remarks: "",
          monitoredBy: "",
        });
      } else {
        setSubmitMessage(response.message || "Failed to submit lab request");
      }
    } catch (error) {
      setSubmitMessage("Error submitting lab request");
      console.error("Lab request submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateReport = async () => {
    try {
      // Create form data object that matches the expected structure for template generation
      const formDataForTemplate = {
        // Remove hardcoded type to allow smart detection
        details: {
          date: formData.date,
          usage_type: formData.usageType,
          user_type: formData.userType,
          faculty_student_name: formData.facultyStudentName,
          year_level: formData.yearLevel,
          laboratory: formData.laboratory,
          printing_pages: formData.printingPages,
          ws_number: formData.wsNumber,
          time_in: formData.timeIn,
          time_out: formData.timeOut,
          purpose: formData.purpose,
          requested_by: formData.requestedBy,
          approved_by: formData.approvedBy,
          remarks: formData.remarks,
          monitored_by: formData.monitoredBy,
        },
        name: formData.facultyStudentName,
        purpose: formData.purpose,
        laboratory: formData.laboratory,
        date: formData.date,
      };
      
      // Debug logging to see what data is being passed
      console.log('🔍 LabRequestForm - Generating report with data:', {
        usageType: formData.usageType,
        userType: formData.userType,
        formDataForTemplate
      });
      
      await generateFormDocument(formDataForTemplate);
    } catch (error) {
      console.error('Error generating lab report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          COLLEGE OF INFORMATION TECHNOLOGY
          <br />
          REQUEST FORM FOR LABORATORY/E-FORUM USAGE
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
              <Label htmlFor="usageType">Usage Type</Label>
              <Select value={formData.usageType} onValueChange={(value) => handleInputChange("usageType", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="set-in-reservation">Set-in/Reservation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="userType">User Type</Label>
              <Select value={formData.userType} onValueChange={(value: "student" | "faculty") => handleInputChange("userType", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facultyStudentName">{formData.userType === 'faculty' ? 'Faculty Name' : 'Student Name'}</Label>
              <Input
                id="facultyStudentName"
                value={formData.facultyStudentName}
                onChange={(e) => handleInputChange("facultyStudentName", e.target.value)}
                placeholder="Enter full name"
                className="capitalize-first"
                required
              />
            </div>
            {formData.userType === 'student' && (
              <div>
                <Label htmlFor="yearLevel">Year Level</Label>
                <Select
                  value={formData.yearLevel}
                  onValueChange={(value) => handleInputChange("yearLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="col-span-2">
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
            {formData.usageType === "printing" && (
              <div>
                <Label htmlFor="printingPages">Printing-No. Pages</Label>
                <Input
                  id="printingPages"
                  value={formData.printingPages}
                  onChange={(e) => handleInputChange("printingPages", e.target.value)}
                  placeholder="Number of pages"
                />
              </div>
            )}
            <div></div>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <Label htmlFor="wsNumber">WS No.</Label>
              <Input
                id="wsNumber"
                value={formData.wsNumber}
                onChange={(e) => handleInputChange("wsNumber", e.target.value)}
                placeholder="Workstation number"
              />
            </div>
            <div>
              <Label htmlFor="timeIn">Time In</Label>
              <Input
                id="timeIn"
                type="time"
                value={formData.timeIn}
                onChange={(e) => handleInputChange("timeIn", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timeOut">Time Out</Label>
              <Input
                id="timeOut"
                type="time"
                value={formData.timeOut}
                onChange={(e) => handleInputChange("timeOut", e.target.value)}
              />
            </div>
            <div></div>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              placeholder="Describe the purpose of laboratory usage"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="requestedBy">Requested by</Label>
            <Input
              id="requestedBy"
              value={formData.requestedBy}
              onChange={(e) => handleInputChange("requestedBy", e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label htmlFor="approvedBy">Approved by</Label>
              <Input
                id="approvedBy"
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
            <h3 className="font-semibold mb-4">Monitoring Form After Laboratory/E-Forum Usage</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Enter remarks about the laboratory usage"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="monitoredBy">Monitored by</Label>
                <Input
                  id="monitoredBy"
                  value={formData.monitoredBy}
                  onChange={(e) => handleInputChange("monitoredBy", e.target.value)}
                  placeholder="Laboratory Custodian name"
                  readOnly // Make read-only since it's auto-populated
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6">
            <div></div>
            <div className="flex justify-center">
              <Button type="submit" variant="outline" className="px-8 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm" disabled={isSubmitting || cooldownActive}>
                {isSubmitting ? 'Submitting...' : cooldownActive ? 'Please wait...' : 'Submit Form'}
              </Button>
            </div>
            <Button type="button" variant="outline" onClick={() => generateReport()} className="flex items-center gap-2 px-6 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm" disabled={isSubmitting}>
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

export default LabRequestForm;
