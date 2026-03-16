import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getApiBaseUrl } from "../../api/publicForms";

// Year levels for students
const yearLevels = [
  "1",
  "2",
  "3",
  "4",
  "5"
];

interface CITLabUsersFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
}

interface Lab {
  value: string;
  label: string;
  monitor?: string;
  lab_id?: number;
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  status_id: number;
  workstation_remarks?: string;
}

interface FormData {
  usage_type: string;
  faculty_student_name: string;
  year_level: string;
  laboratory: string;
  printing_pages: string;
  ws_number: string;
  purpose: string;
  monitored_by: string;
}

export const CITLabUsersForm = ({ onSubmit, disabled = false }: CITLabUsersFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [userType, setUserType] = useState<'student' | 'faculty'>('student');
  const [isMonitorAutoPopulated, setIsMonitorAutoPopulated] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    usage_type: '',
    faculty_student_name: '',
    year_level: '',
    laboratory: '',
    printing_pages: '',
    ws_number: '',
    purpose: '',
    monitored_by: ''
  });

  const fetchLabs = async () => {
    try {
      // Try network IP first for CORS compatibility
      const possibleUrls = [
        'http://172.72.100.78:3001/laboratories/public',
        'http://localhost:3001/laboratories/public',
        'http://127.0.0.1:3001/laboratories/public'
      ];
      
      let labsData = null;
      
      for (const url of possibleUrls) {
        try {
          console.log(`🔄 Attempting to fetch labs from: ${url}`);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          labsData = data;
          console.log('✅ Successfully fetched labs from:', url);
          break;
        } catch (error) {
          console.warn(`❌ Failed to fetch from ${url}:`, error);
        }
      }
      
      // Process fetched data
      if (labsData) {
        const labOptions = labsData.map((lab: any) => ({
          value: lab.lab_name,
          label: lab.lab_name,
          monitor: lab.users?.find((user: any) => user.role === "Custodian")?.full_name || 'Not assigned',
          lab_id: lab.lab_id
        }));
        setLabs(labOptions);
        console.log('✅ Labs processed:', labOptions.length);
      } else {
        // Fallback data
        const fallbackLabs = [
          { value: "e-forum", label: "E-Forum", monitor: "SYSTEM ADMINISTRATOR", lab_id: 1 },
          { value: "hardware-lab", label: "Hardware Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 2 },
          { value: "software-lab", label: "Software Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 3 },
          { value: "network-lab", label: "Network Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 4 }
        ];
        setLabs(fallbackLabs);
      }
    } catch (error) {
      console.error('❌ Critical error in fetchLabs:', error);
      // Final fallback
      const fallbackLabs = [
        { value: "e-forum", label: "E-Forum", monitor: "SYSTEM ADMINISTRATOR", lab_id: 1 },
        { value: "hardware-lab", label: "Hardware Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 2 },
        { value: "software-lab", label: "Software Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 3 },
        { value: "network-lab", label: "Network Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 4 }
      ];
      setLabs(fallbackLabs);
    }
  };

  const fetchWorkstations = async (labId: number) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/public-forms/labs/${labId}/workstations`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setWorkstations(data.data);
        console.log('✅ Workstations fetched:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error fetching workstations:', error);
      setWorkstations([]);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []); // Only run once on mount

  const handleInputChange = (field: keyof FormData, value: string) => {
    console.log('🔄 Field change:', field, '->', value);
    console.log('📊 Current formData before change:', formData);
    
    // Prevent form reset during typing
    if (formData[field] === value) {
      console.log('⚠️ Field value unchanged, skipping update');
      return;
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      console.log('📊 New formData after change:', newData);

      // Auto-populate monitored_by when laboratory is selected (like lab requests)
      if (field === 'laboratory') {
        const selectedLab = labs.find(lab => lab.value === value);
        if (selectedLab && selectedLab.monitor) {
          newData.monitored_by = selectedLab.monitor;
          setIsMonitorAutoPopulated(true);
          console.log('🔄 Auto-populated monitored_by:', selectedLab.monitor, 'for lab:', value);
          
          // Fetch workstations for this lab
          if (selectedLab.lab_id) {
            fetchWorkstations(selectedLab.lab_id);
          }
        } else {
          setIsMonitorAutoPopulated(false);
          console.log('⚠️ No monitor found for lab:', value);
          setWorkstations([]);
        }
      }

      // Clear printing pages when switching to set-in-reservation
      if (field === 'usage_type') {
        if (value === 'set-in-reservation') {
          newData.printing_pages = '';
          console.log('🔄 Cleared printing_pages for set-in-reservation usage type');
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = [];
    
    if (!formData.usage_type) validationErrors.push('Usage type is required');
    if (!formData.faculty_student_name) validationErrors.push('Name is required');
    if (!userType) validationErrors.push('User type is required');
    if (!formData.laboratory) validationErrors.push('Laboratory is required');
    if (!formData.purpose) validationErrors.push('Purpose is required');
    
    if (formData.usage_type === 'printing' && !formData.printing_pages) {
      validationErrors.push('Printing pages is required when usage type is printing');
    }
    
    if (validationErrors.length > 0) {
      console.error('❌ Client-side validation failed:', validationErrors);
      alert('Please fill in all required fields: ' + validationErrors.join(', '));
      return;
    }
    
    // Network connectivity check
    if (!navigator.onLine) {
      console.log('❌ Network check failed - User is offline');
      alert('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    // TEST: Check if we reach validation
    console.log('🧪 TEST: About to run client-side validation...');
    
    // Client-side validation
    const clientValidationErrors = [];
    
    console.log('🔍 Client-side validation check:');
    console.log('  - formData.usage_type:', formData.usage_type);
    console.log('  - formData.faculty_student_name:', formData.faculty_student_name);
    console.log('  - formData.laboratory:', formData.laboratory);
    console.log('  - formData.purpose:', formData.purpose);
    
    if (!formData.usage_type) clientValidationErrors.push('Usage type is required');
    if (!formData.faculty_student_name.trim()) clientValidationErrors.push('Name is required');
    if (!formData.laboratory) clientValidationErrors.push('Laboratory is required');
    if (!formData.purpose.trim()) clientValidationErrors.push('Purpose is required');
    
    if (formData.faculty_student_name.length > 100) {
      clientValidationErrors.push('Name must be less than 100 characters');
    }
    if (formData.purpose.length > 500) {
      clientValidationErrors.push('Purpose must be less than 500 characters');
    }
    if (!/^[a-zA-Z\s.-]+$/.test(formData.faculty_student_name)) {
      clientValidationErrors.push('Name contains invalid characters (only letters, spaces, dots, and hyphens allowed)');
    }
    
    console.log('📊 Client validation errors:', clientValidationErrors);
    
    if (clientValidationErrors.length > 0) {
      console.error('❌ Client-side validation failed:', clientValidationErrors);
      alert('Please fix the following errors:\n' + clientValidationErrors.join('\n'));
      setIsSubmitting(false);
      return;
    } else {
      console.log('✅ Client-side validation passed');
    }
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log('🌐 Submitting CIT Lab Users form to:', apiBaseUrl);
      
      const submissionData = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        ...formData,
        user_type: userType === 'student' ? 'Student' : 'Faculty',
        year_level: formData.year_level ? `${formData.year_level} Year` : null,
      };
      
      console.log('📤 Form data being submitted:', submissionData);
      console.log('📊 Individual fields:');
      console.log('  - date:', submissionData.date);
      console.log('  - usage_type:', submissionData.usage_type);
      console.log('  - faculty_student_name:', submissionData.faculty_student_name);
      console.log('  - user_type:', submissionData.user_type);
      console.log('  - laboratory:', submissionData.laboratory);
      console.log('  - purpose:', submissionData.purpose);
      console.log('  - year_level:', submissionData.year_level);
      console.log('  - printing_pages:', submissionData.printing_pages);
      console.log('  - ws_number:', submissionData.ws_number);
      console.log('  - monitored_by:', submissionData.monitored_by);
      
      const response = await fetch(`${apiBaseUrl}/public-forms/cit-lab-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ CIT Lab Users form submitted successfully:', data);
        
        // Call onSubmit callback if provided with current form data
        if (onSubmit) {
          console.log('🔍 User type debugging:');
          console.log('  - userType state:', userType);
          console.log('  - userType condition result:', userType === 'student' ? 'Student' : 'Faculty');
          
          onSubmit({
            ...data,
            formData: { 
              ...formData,
              user_type: userType === 'student' ? 'Student' : 'Faculty'
            }
          });
        }
        
        // Reset form after successful submission (delay to allow callback to complete)
        setTimeout(() => {
          setFormData({
            usage_type: '',
            faculty_student_name: '',
            year_level: '',
            laboratory: '',
            printing_pages: '',
            ws_number: '',
            purpose: '',
            monitored_by: ''
          });
          setIsMonitorAutoPopulated(false);
          setWorkstations([]);
        }, 100); // 100ms delay
        
        // Show success message
        alert('CIT Lab Users log submitted successfully!');
      } else {
        console.log('❌ Submission failed:', data);
        alert(data.message || 'Failed to submit CIT Lab Users log. Please try again.');
      }
    } catch (error) {
      console.error('❌ Network error during CIT Lab Users submission:', error);
      alert('Network error: Failed to submit form. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="space-y-2">
          <Label htmlFor="usage_type">Usage Type *</Label>
          <Select value={formData.usage_type} onValueChange={(value) => handleInputChange('usage_type', value)} required disabled={disabled} key="usage_type">
            <SelectTrigger>
              <SelectValue placeholder="Select usage type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="set-in-reservation">Set-in/Reservation</SelectItem>
              <SelectItem value="printing">Printing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="user_type">User Type *</Label>
          <Select value={userType} onValueChange={(value) => setUserType(value as 'student' | 'faculty')} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="faculty_student_name">{userType === 'student' ? 'Student Name' : 'Faculty Name'} *</Label>
          <Input
            id="faculty_student_name"
            value={formData.faculty_student_name}
            onChange={(e) => handleInputChange('faculty_student_name', e.target.value)}
            placeholder={`Enter ${userType === 'student' ? 'student' : 'faculty'} full name`}
            required
            disabled={disabled}
          />
        </div>
        
        {userType === 'student' && (
          <div className="space-y-2">
            <Label htmlFor="year_level">Year Level</Label>
            <Select value={formData.year_level} onValueChange={(value) => handleInputChange('year_level', value)} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select year level" />
              </SelectTrigger>
              <SelectContent>
                {yearLevels.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="laboratory">Laboratory *</Label>
          <Select value={formData.laboratory} onValueChange={(value) => handleInputChange('laboratory', value)} required disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select laboratory" />
            </SelectTrigger>
            <SelectContent>
              {labs.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {formData.usage_type === 'printing' && (
          <div className="space-y-2">
            <Label htmlFor="printing_pages">Printing Pages *</Label>
            <Input
              id="printing_pages"
              value={formData.printing_pages}
              onChange={(e) => handleInputChange('printing_pages', e.target.value)}
              placeholder="Number of pages"
              required
              disabled={disabled}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="ws_number">Workstation Number</Label>
          <Select value={formData.ws_number} onValueChange={(value) => handleInputChange('ws_number', value)} disabled={disabled || workstations.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Select workstation" />
            </SelectTrigger>
            <SelectContent>
              {workstations.map((ws) => (
                <SelectItem key={ws.workstation_id} value={ws.workstation_name}>
                  {ws.workstation_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monitored_by">Monitored By</Label>
          <Input
            id="monitored_by"
            value={formData.monitored_by}
            onChange={(e) => handleInputChange('monitored_by', e.target.value)}
            placeholder="Laboratory Custodian name"
            disabled={disabled || isMonitorAutoPopulated}
            className={isMonitorAutoPopulated ? "bg-gray-100 cursor-not-allowed" : ""}
          />
          <p className="text-xs text-gray-500">
            Auto-populated from lab custodian.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => handleInputChange('purpose', e.target.value)}
          placeholder="Describe the purpose of laboratory usage"
          rows={5}
          required
          disabled={disabled}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={disabled || isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Log'}
        </Button>
      </div>
    </form>
  );
};
