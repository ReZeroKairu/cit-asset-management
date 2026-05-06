import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SearchableSelect } from "../ui/searchable-select";
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
  date: string;
  time_in: string;
  time_out: string;
  faculty_student_name: string;
  year_level: string;
  laboratory: string;
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    usage_type: 'set-in-reservation',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    time_in: new Date().toTimeString().slice(0, 5), // Current time in HH:MM format
    time_out: '',
    faculty_student_name: '',
    year_level: '',
    laboratory: '',
    ws_number: '',
    purpose: '',
    monitored_by: ''
  });

  const fetchLabs = async () => {
    try {
      // Use the correct public laboratories endpoint
      const apiBaseUrl = getApiBaseUrl();
      console.log(`🔄 Attempting to fetch labs from: ${apiBaseUrl}/laboratories/public`);
      
      const response = await fetch(`${apiBaseUrl}/laboratories/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // Increased to 10 seconds
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully fetched labs:', data);
      
      // Process fetched data
      if (data && Array.isArray(data)) {
        const labOptions = data.map((lab: any) => ({
          value: lab.lab_name,
          label: lab.lab_name,
          monitor: lab.users?.find((user: any) => user.role === "Custodian")?.full_name || 'Not assigned',
          lab_id: lab.lab_id
        }));
        setLabs(labOptions);
        console.log('✅ Labs processed:', labOptions.length);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('❌ Error fetching labs:', error);
      
      // Check if it's a timeout error
      if (error instanceof Error && error.name === 'TimeoutError') {
        console.log('⏰ Request timed out, using fallback data');
      } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.log('🔌 Network error, using fallback data');
      } else {
        console.log('❓ Unknown error, using fallback data');
      }
      
      // Fallback data
      const fallbackLabs = [
        { value: "e-forum", label: "E-Forum", monitor: "SYSTEM ADMINISTRATOR", lab_id: 1 },
        { value: "hardware-lab", label: "Hardware Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 2 },
        { value: "software-lab", label: "Software Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 3 },
        { value: "network-lab", label: "Network Lab", monitor: "SYSTEM ADMINISTRATOR", lab_id: 4 },
        { value: "CIT-Lab 1", label: "CIT-Lab 1", monitor: "John Custodians", lab_id: 1 }
      ];
      setLabs(fallbackLabs);
      console.log('🔄 Using fallback labs data');
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
    // Prevent form reset during typing
    if (formData[field] === value) {
      return;
    }
    
    let processedValue = value;
    
    // Process name fields to capitalize first letter of each word
    if (field === 'faculty_student_name') {
      processedValue = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: processedValue
      };

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
          setWorkstations([]);
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
    if (!formData.time_in) validationErrors.push('Time in is required');
    if (!formData.time_out) validationErrors.push('Time out is required');
    if (!formData.faculty_student_name) validationErrors.push('Name is required');
    if (!userType) validationErrors.push('User type is required');
    if (!formData.laboratory) validationErrors.push('Laboratory is required');
    if (!formData.purpose) validationErrors.push('Purpose is required');
    if (userType === 'student' && !formData.year_level) validationErrors.push('Year level is required for students');
    
    
    if (validationErrors.length > 0) {
      console.error('❌ Client-side validation failed:', validationErrors);
      
      // Convert validation errors to object for display
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(error => {
        if (error.includes('Usage type')) errorMap.usage_type = error;
        if (error.includes('Time in')) errorMap.time_in = error;
        if (error.includes('Time out')) errorMap.time_out = error;
        if (error.includes('Name')) errorMap.faculty_student_name = error;
        if (error.includes('User type')) errorMap.user_type = error;
        if (error.includes('Laboratory')) errorMap.laboratory = error;
        if (error.includes('Purpose')) errorMap.purpose = error;
        if (error.includes('Year level')) errorMap.year_level = error;
      });
      
      setErrors(errorMap);
      
      // Scroll to first error field
      const firstErrorField = document.querySelector('[data-error="true"]') as HTMLElement;
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      
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
        ...formData,
        user_type: userType === 'student' ? 'Student' : 'Faculty',
        year_level: formData.year_level || null,
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
            usage_type: 'set-in-reservation',
            date: new Date().toISOString().split('T')[0], // Reset to today's date
            time_in: new Date().toTimeString().slice(0, 5), // Reset to current time
            time_out: '', // Reset to empty
            faculty_student_name: '',
            year_level: '',
            laboratory: '',
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
        console.log('Submission failed:', data);
        console.log('Response status:', response.status);
        
        // Handle rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          alert(data.error || 'Form submission limit reached. Please try again in an hour.');
          return;
        }
        
        // Handle backend validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((error: string) => {
            if (error.includes('Time out')) errorMap.time_out = error;
            if (error.includes('Time in')) errorMap.time_in = error;
            if (error.includes('Usage type')) errorMap.usage_type = error;
            if (error.includes('Name')) errorMap.faculty_student_name = error;
            if (error.includes('User type')) errorMap.user_type = error;
            if (error.includes('Laboratory')) errorMap.laboratory = error;
            if (error.includes('Purpose')) errorMap.purpose = error;
          });
          
          setErrors(errorMap);
          
          // Scroll to first error field
          const firstErrorField = document.querySelector('[data-error="true"]') as HTMLElement;
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
          }
        } else {
          // Show the actual error message from backend
          const errorMessage = data.error || data.message || 'Failed to submit CIT Lab Users log. Please try again.';
          alert(errorMessage);
        }
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
          <Label>Usage Type</Label>
          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 font-medium">
            Set-in/Reservation
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Reservation Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
            disabled={disabled}
          />
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
            className={`capitalize-first ${errors.faculty_student_name ? "border-red-500 outline-red-500" : ""}`}
            data-error={errors.faculty_student_name ? "true" : undefined}
            required
            disabled={disabled}
          />
          {errors.faculty_student_name && (
            <span className="text-red-500 text-sm">
              {errors.faculty_student_name}
            </span>
          )}
        </div>
        
        {userType === 'student' && (
          <div className="space-y-2">
            <Label htmlFor="year_level">Year Level *</Label>
            <Select 
              value={formData.year_level} 
              onValueChange={(value) => handleInputChange('year_level', value)} 
              disabled={disabled}
              required
            >
              <SelectTrigger className={errors.year_level ? "border-red-500 outline-red-500" : ""} data-error={errors.year_level ? "true" : undefined}>
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
            {errors.year_level && (
              <span className="text-red-500 text-sm">
                {errors.year_level}
              </span>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="laboratory">Laboratory *</Label>
          <Select value={formData.laboratory} onValueChange={(value) => handleInputChange('laboratory', value)} required disabled={disabled}>
            <SelectTrigger className={errors.laboratory ? "border-red-500 outline-red-500" : ""} data-error={errors.laboratory ? "true" : undefined}>
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
          {errors.laboratory && (
            <span className="text-red-500 text-sm">
              {errors.laboratory}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time_in">Time In *</Label>
          <Input
            id="time_in"
            type="time"
            value={formData.time_in}
            onChange={(e) => handleInputChange('time_in', e.target.value)}
            required
            disabled={disabled}
            className={errors.time_in ? "border-red-500 outline-red-500" : ""}
            data-error={errors.time_in ? "true" : undefined}
          />
          {errors.time_in && (
            <span className="text-red-500 text-sm">
              {errors.time_in}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time_out">Time Out *</Label>
          <Input
            id="time_out"
            type="time"
            value={formData.time_out}
            onChange={(e) => handleInputChange('time_out', e.target.value)}
            required
            disabled={disabled}
            className={errors.time_out ? "border-red-500 outline-red-500" : ""}
            data-error={errors.time_out ? "true" : undefined}
          />
          {errors.time_out && (
            <span className="text-red-500 text-sm">
              {errors.time_out}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ws_number">Workstation Number</Label>
          <SearchableSelect
            value={formData.ws_number}
            onValueChange={(value) => handleInputChange('ws_number', value)}
            placeholder="Select workstation"
            disabled={disabled || workstations.length === 0}
            options={workstations.map((ws) => ({
              value: ws.workstation_name,
              label: ws.workstation_name
            }))}
          />
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
          className={errors.purpose ? "border-red-500 outline-red-500" : ""}
          data-error={errors.purpose ? "true" : undefined}
          required
          disabled={disabled}
        />
        {errors.purpose && (
          <span className="text-red-500 text-sm">
            {errors.purpose}
          </span>
        )}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          variant="outline"
          className="px-8 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm min-w-[120px]"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
};
