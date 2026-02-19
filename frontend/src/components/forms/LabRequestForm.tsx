import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { submitLabRequest } from "../../api/forms";
import { getAllWorkstations } from "../../api/workstations";
import api from "../../api/axios";

interface LabRequestFormData {
  date: string;
  usageType: "printing" | "set-in-reservation";
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
  const [workstations, setWorkstations] = useState<any[]>([]);
  const [assignedLab, setAssignedLab] = useState<string>('');
  const [isLoadingWorkstations, setIsLoadingWorkstations] = useState(false);

  const [formData, setFormData] = useState<LabRequestFormData>({
    date: "",
    usageType: "printing",
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
    // E-Forum is always available and stays hardcoded
    const eForumOption = { value: "e-forum", label: "E-Forum" };
    
    // If no assigned lab, only return E-Forum
    if (!assignedLab) {
      return [eForumOption];
    }
    
    // Filter options: always include E-Forum + assigned lab if it exists
    const filteredOptions: Array<{value: string, label: string}> = [eForumOption];
    
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

  useEffect(() => {
    const fetchWorkstations = async () => {
      // Only fetch if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping workstation fetch');
        return;
      }
      
      setIsLoadingWorkstations(true);
      try {
        console.log('Fetching workstations...');
        const allWorkstations = await getAllWorkstations();
        console.log('Workstations fetched:', allWorkstations);
        
        // Filter workstations by selected lab
        const labId = formData.laboratory === "lab1" ? 1 : formData.laboratory === "lab2" ? 2 : formData.laboratory === "cisco" ? 3 : null;
        const filteredWorkstations = labId ? allWorkstations.filter((ws: any) => ws.lab_id === labId) : [];
        console.log('Filtered workstations:', filteredWorkstations);
        setWorkstations(filteredWorkstations);
      } catch (error) {
        console.error("Error fetching workstations:", error);
        // Don't crash the app if workstations fail to load
        setWorkstations([]);
      } finally {
        setIsLoadingWorkstations(false);
      }
    };

    fetchWorkstations();
  }, [formData.laboratory, user]); // Fetch when lab selection changes or user loads

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

    try {
      const response = await submitLabRequest({
        date: formData.date,
        usage_type: formData.usageType,
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
        // Reset form but keep default values
        setFormData({
          date: "",
          usageType: "printing",
          facultyStudentName: "",
          yearLevel: "",
          laboratory: "lab1",
          printingPages: "",
          wsNumber: "",
          timeIn: "",
          timeOut: "",
          purpose: "",
          requestedBy: "",
          approvedBy: "DR. MARCO MARVIN L. RADO", // Keep default value
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

  const generateReport = () => {
    const reportContent = `
COLLEGE OF INFORMATION TECHNOLOGY
REQUEST FORM FOR LABORATORY/E-FORUM USAGE

Date: ${formData.date}
Usage Type: ${formData.usageType}
Faculty/Student Name: ${formData.facultyStudentName}
Year Level: ${formData.yearLevel}
Laboratory: ${formData.laboratory}
Printing-No. Pages: ${formData.printingPages}
WS No.: ${formData.wsNumber}
Time In: ${formData.timeIn}
Time Out: ${formData.timeOut}
Purpose: ${formData.purpose}

Requested by: ${formData.requestedBy}

Monitoring Form After Laboratory/E-Forum Usage
Remarks: ${formData.remarks}
Monitored by: ${formData.monitoredBy}

Laboratory Custodian
    `.trim();

    // Create and download lab report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-request-${formData.date || new Date().toISOString().split('T')[0]}.txt`;
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
            <div></div>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facultyStudentName">Faculty/Student Name</Label>
              <Input
                id="facultyStudentName"
                value={formData.facultyStudentName}
                onChange={(e) => handleInputChange("facultyStudentName", e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="yearLevel">Year Level</Label>
              <Input
                id="yearLevel"
                value={formData.yearLevel}
                onChange={(e) => handleInputChange("yearLevel", e.target.value)}
                placeholder="Enter year level"
              />
            </div>
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
            <div>
              <Label htmlFor="printingPages">Printing-No. Pages</Label>
              <Input
                id="printingPages"
                value={formData.printingPages}
                onChange={(e) => handleInputChange("printingPages", e.target.value)}
                placeholder="Number of pages"
              />
            </div>
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

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
            <Button type="button" variant="outline" onClick={() => generateReport()} className="flex items-center gap-2" disabled={isSubmitting}>
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
