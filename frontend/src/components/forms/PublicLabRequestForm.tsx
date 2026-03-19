import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getApiBaseUrl } from "../../api/publicForms";
import { useAuth } from "../../context/AuthContext";

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  status_id: number;
  workstation_remarks?: string;
}

// Year levels for students
const yearLevels = [
  "1",
  "2",
  "3",
  "4",
  "5"
];

interface PublicLabRequestFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
  custodianName?: string;
  assignedLab?: string;
  isOneTimeForm?: boolean; // New prop to distinguish form type
}

export const PublicLabRequestForm = ({ onSubmit, disabled = false, custodianName, assignedLab, isOneTimeForm = false }: PublicLabRequestFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labs, setLabs] = useState<Array<{value: string, label: string}>>([]);
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [userType, setUserType] = useState<'student' | 'faculty'>(user?.role === 'Admin' ? 'faculty' : 'student'); // New state for user type
  const [workstations, setWorkstations] = useState<Workstation[]>([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    usage_type: 'set-in-reservation', // Set default usage type
    faculty_student_name: '',
    year_level: '',
    laboratory: '',
    printing_pages: '',
    ws_number: '',
    time_in: '',
    time_out: '',
    purpose: '',
    requested_by: '', // Default value for public submissions
    remarks: '',
    monitored_by: '',
    approved_by: 'DR. MARCO MARVIN L. RADO', // Pre-filled approval
    user_type: 'student' // Add user_type field for database storage
  });

  // Fetch all labs from database
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/laboratories/public`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch labs: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        
        // Check if response is HTML (error page) instead of JSON
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned HTML error page instead of JSON data');
        }
        
        let labsData;
        try {
          labsData = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${(parseError as Error).message}`);
        }
        
        const labOptions = labsData.map((lab: any) => ({
          value: lab.lab_name,
          label: lab.lab_name
        }));
        setLabs(labOptions);
      } catch (error) {
        console.error('Failed to fetch labs:', error);
      }
    };

    fetchLabs();
  }, []);

  // Auto-populate lab when assignedLab is available
  useEffect(() => {
    // Only auto-populate for non-one-time forms
    if (!isOneTimeForm && assignedLab && labs.length > 0) {
      const assignedLabOption = labs.find(option => option.value === assignedLab);
      if (assignedLabOption) {
        setFormData(prev => ({
          ...prev,
          laboratory: assignedLab
        }));
      }
    }
  }, [formData.laboratory, labs, assignedLab, isOneTimeForm]);

  // Auto-populate custodian fields when lab is selected
  useEffect(() => {
    if (selectedLab && labs.length > 0) {
      const selectedLabData = labs.find(lab => lab.value === selectedLab);
      if (selectedLabData) {
        // Find custodian for this lab
        const fetchCustodian = async () => {
          try {
            const encodedLabName = encodeURIComponent(selectedLabData.value);
            const response = await fetch(`${getApiBaseUrl()}/laboratories/public/${encodedLabName}/custodian`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch custodian: ${response.status} ${response.statusText}`);
            }
            
            const custodianData = await response.json();
            
            // Try different possible custodian field names
            const custodianName = custodianData.users?.[0]?.full_name || 
                              custodianData.in_charge?.full_name || 
                              custodianData.full_name || 
                              custodianData.users?.find((u: any) => u.role === 'Custodian')?.full_name ||
                              'No custodian assigned';
            
            setFormData(prev => ({
              ...prev,
              monitored_by: custodianName
            }));
          } catch (error) {
            console.error('Failed to fetch custodian:', error);
            // Set default values if custodian fetch fails
            setFormData(prev => ({
              ...prev,
              monitored_by: 'No custodian assigned'
            }));
          }
        };

        fetchCustodian();
      }
    }
  }, [formData.laboratory, labs]);

  // Handle lab selection from dropdown
  const handleLabSelection = (labValue: string) => {
    console.log('🔄 handleLabSelection called with:', labValue);
    setSelectedLab(labValue);
    setFormData(prev => {
      const newData = {
        ...prev,
        laboratory: labValue
      };
      
      // Fetch workstations for this lab
      if (labValue && labValue !== 'e-forum') {
        console.log('🚀 Calling fetchWorkstations for:', labValue);
        fetchWorkstations(labValue);
      } else {
        console.log('🚫 Clearing workstations for E-Forum or empty');
        setWorkstations([]);
      }
      
      return newData;
    });
  };
  
  // Filter laboratory options based on assigned lab and form type
  const getLabOptions = () => {
    // Always include E-Forum but exclude for printing
    const eForumOption = { value: "e-forum", label: "E-Forum" };
    
    // For public forms (not one-time), show all labs + E-Forum (exclude E-Forum for printing)
    if (!isOneTimeForm) {
      const labOptions = formData.usage_type === "printing" ? labs : [eForumOption, ...labs];
      console.log('🔍 getLabOptions (public form):', { usage_type: formData.usage_type, labOptions });
      return labOptions;
    }
    
    // If no assigned lab, only return E-Forum (unless printing)
    if (!assignedLab) {
      const options = formData.usage_type === "printing" ? [] : [eForumOption];
      console.log('🔍 getLabOptions (no assigned lab):', { usage_type: formData.usage_type, options });
      return options;
    }
    
    // For one-time forms, create assigned lab option directly and add E-Forum (exclude E-Forum for printing)
    const assignedLabOption = { value: assignedLab, label: assignedLab };
    
    let options;
    if (formData.usage_type === "printing") {
      options = [assignedLabOption];
    } else {
      options = [assignedLabOption, eForumOption];
    }
    
    console.log('🔍 getLabOptions (one-time form):', { 
      assignedLab, 
      usage_type: formData.usage_type, 
      options,
      currentLabValue: formData.laboratory 
    });
    
    return options;
  };

  // Update monitored_by when custodianName changes
  useEffect(() => {
    if (custodianName) {
      setFormData(prev => ({
        ...prev,
        monitored_by: custodianName // Auto-populate monitored by only
      }));
    }
  }, [custodianName]);

  const fetchWorkstations = async (labName: string) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Get lab ID from lab name
      const labResponse = await fetch(`${apiBaseUrl}/laboratories/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const labs = await labResponse.json();
      
      const lab = labs.find((l: any) => l.lab_name === labName);
      
      if (lab && lab.lab_id) {
        const workstationResponse = await fetch(`${apiBaseUrl}/public-forms/labs/${lab.lab_id}/workstations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const workstationData = await workstationResponse.json();
        
        if (workstationData.success && Array.isArray(workstationData.data)) {
          setWorkstations(workstationData.data);
        } else {
          setWorkstations([]);
        }
      } else {
        setWorkstations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching workstations:', error);
      setWorkstations([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Process name fields to capitalize first letter of each word
    if (field === 'faculty_student_name' || field === 'requested_by') {
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

      // Fetch workstations when laboratory is selected
      if (field === 'laboratory') {
        // Clear workstation selection when lab changes
        newData.ws_number = '';
        
        // Fetch workstations for this lab
        if (value && value !== 'e-forum') {
          fetchWorkstations(value);
        } else {
          setWorkstations([]);
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Network connectivity check
    if (!navigator.onLine) {
      alert('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    // Check if any validation failed
    const validationErrors = [];
    if (!formData.usage_type) {
      validationErrors.push('Usage Type is required');
    }
    if (formData.faculty_student_name && formData.faculty_student_name.length > 100) {
      validationErrors.push('Name must be less than 100 characters');
    }
    if (formData.purpose && formData.purpose.length > 500) {
      validationErrors.push('Purpose must be less than 500 characters');
    }
    if (formData.faculty_student_name && !/^[a-zA-Z\s.-]+$/.test(formData.faculty_student_name)) {
      validationErrors.push('Name contains invalid characters');
    }
    if (formData.requested_by && !/^[a-zA-Z\s.-]+$/.test(formData.requested_by)) {
      validationErrors.push('Requested By contains invalid characters');
    }
    
    if (validationErrors.length > 0) {
      console.log('❌ CLIENT-SIDE VALIDATION FAILED:', validationErrors);
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }
    
    console.log('✅ Client-side validation passed - proceeding to submission');
    setIsSubmitting(true);
    try {
      // Include userType in the form data for template generation
      const formDataWithUserType = {
        ...formData,
        userType: userType, // Add user type to determine template name
        user_type: userType // Add user_type field for database storage
      };
      
      console.log('📤 Submitting to API with data:', formDataWithUserType);
      
      // Call parent's onSubmit to show success message
      if (onSubmit) {
        await onSubmit(formDataWithUserType);
      }
      
      console.log('✅ SUCCESS: Form submitted successfully');
    } catch (error) {
      console.error('❌ ERROR: Form submission failed:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        usage_type: '',
        faculty_student_name: '',
        year_level: '',
        laboratory: '',
        printing_pages: '',
        ws_number: '',
        time_in: '',
        time_out: '',
        purpose: '',
        requested_by: '',
        remarks: '',
        monitored_by: '',
        approved_by: 'DR. MARCO MARVIN L. RADO', // Pre-filled approval
        user_type: userType // Add user_type field for database storage
      });
      
      console.log('🔄 Form reset to initial state');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
            disabled={disabled}
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usage_type">Usage Type *</Label>
          <Select value={formData.usage_type} onValueChange={(value) => handleInputChange('usage_type', value)} required disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select Usage Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="printing">Printing</SelectItem>
              <SelectItem value="set-in-reservation">Set-in/Reservation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_type">User Type *</Label>
          <Select value={userType} onValueChange={(value: 'student' | 'faculty') => setUserType(value)} required disabled={disabled}>
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
          <Label htmlFor="faculty_student_name">{userType === 'faculty' ? 'Faculty Name' : 'Student Name'} *</Label>
          <Input
            id="faculty_student_name"
            value={formData.faculty_student_name}
            onChange={(e) => handleInputChange('faculty_student_name', e.target.value)}
            placeholder="Enter your full name"
            className="capitalize-first"
            required
            disabled={disabled}
            pattern="[a-zA-Z\s.-]+"
            title="Only letters, spaces, dots, and hyphens allowed"
          />
        </div>

        {userType === 'student' && (
          <div className="space-y-2">
            <Label htmlFor="year_level">Year Level</Label>
            <Select
              value={formData.year_level}
              onValueChange={(value) => handleInputChange('year_level', value)}
              disabled={disabled}
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

        <div className="space-y-2">
          <Label htmlFor="laboratory">Laboratory *</Label>
          <Select value={formData.laboratory} onValueChange={handleLabSelection} required disabled={disabled}>
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

        {formData.usage_type === "printing" && (
          <div className="space-y-2">
            <Label htmlFor="printing_pages">Printing Pages</Label>
            <Input
              id="printing_pages"
              value={formData.printing_pages}
              onChange={(e) => handleInputChange('printing_pages', e.target.value)}
              placeholder="Number of pages to print"
              disabled={disabled}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="ws_number">Workstation Number</Label>
          <Select
            value={formData.ws_number}
            onValueChange={(value) => handleInputChange("ws_number", value)}
            disabled={!formData.laboratory || formData.laboratory === 'e-forum' || workstations.length === 0 || disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                formData.laboratory === 'e-forum' 
                  ? 'Not applicable for E-Forum' 
                  : workstations.length === 0 
                    ? 'Select a laboratory first' 
                    : 'Select workstation'
              } />
            </SelectTrigger>
            <SelectContent>
              {workstations.map((workstation) => (
                <SelectItem key={workstation.workstation_id} value={workstation.workstation_name}>
                  {workstation.workstation_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time_in">Time In *</Label>
          <Input
            id="time_in"
            type="time"
            value={formData.time_in}
            onChange={(e) => handleInputChange('time_in', e.target.value)}
            disabled={disabled}
            required
          />
        </div>

        {/* Time Out will be filled by Custodian after approval */}
        <input
          type="hidden"
          value={formData.time_out}
          onChange={(e) => handleInputChange('time_out', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => handleInputChange('purpose', e.target.value)}
          placeholder="Describe the purpose of your lab request"
          rows={3}
          required
          disabled={disabled}
          minLength={3}
          title="Purpose must be at least 3 characters"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="requested_by">Requested By</Label>
          <Input
            id="requested_by"
            value={formData.requested_by}
            onChange={(e) => handleInputChange('requested_by', e.target.value)}
            placeholder="Enter your name"
            pattern="[a-zA-Z\s.-]+"
            title="Only letters, spaces, dots, and hyphens allowed"
            required
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="approved_by">Approved by</Label>
          <Input
            id="approved_by"
            value={formData.approved_by}
            onChange={(e) => handleInputChange('approved_by', e.target.value)}
            placeholder="DR. MARCO MARVIN L. RADO"
            disabled // Make disabled to prevent cursor and clicking
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monitored_by">Monitored By</Label>
          <Input
            id="monitored_by"
            value={custodianName ? custodianName.toUpperCase() : formData.monitored_by}
            onChange={!custodianName ? (e) => handleInputChange('monitored_by', e.target.value) : undefined}
            placeholder="Lab monitor name"
            disabled={disabled || !!custodianName || (!formData.laboratory || formData.laboratory !== 'e-forum')} // Disabled by default, only enabled for E-Forum
            readOnly={!!custodianName || (!formData.laboratory || formData.laboratory !== 'e-forum')} // Read-only by default, only enabled for E-Forum
          />
          {(custodianName || (formData.laboratory && formData.laboratory !== 'e-forum')) && (
            <p className="text-sm text-gray-500">This field is automatically set by the assigned custodian</p>
          )}
          {formData.laboratory === 'e-forum' && (
            <p className="text-sm text-gray-500">E-Forum requires manual monitor assignment</p>
          )}
          {!formData.laboratory && (
            <p className="text-sm text-gray-500">This field will auto-populate when a laboratory is selected</p>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          type="submit" 
          variant="outline"
          className="px-8 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm" 
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
};
