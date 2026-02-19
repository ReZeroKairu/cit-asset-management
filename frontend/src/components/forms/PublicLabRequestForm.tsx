import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { submitPublicLabRequest } from "../../api/publicForms";

interface PublicLabRequestFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
  custodianName?: string;
  assignedLab?: string;
}

export const PublicLabRequestForm = ({ onSubmit, disabled = false, custodianName, assignedLab }: PublicLabRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labs, setLabs] = useState<Array<{value: string, label: string}>>([]);
  const [selectedLab, setSelectedLab] = useState<string>('');

  // Fetch all labs from database
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        console.log('🔍 Fetching labs from:', 'http://192.168.110.72:3001/laboratories/public');
        const response = await fetch('http://192.168.110.72:3001/laboratories/public');
        console.log('🔍 Labs response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch labs: ${response.status} ${response.statusText}`);
        }
        
        const labsData = await response.json();
        console.log('🔍 Labs data received:', labsData);
        
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

  // Auto-populate custodian fields when lab is selected
  useEffect(() => {
    if (selectedLab && labs.length > 0) {
      const selectedLabData = labs.find(lab => lab.value === selectedLab);
      if (selectedLabData) {
        // Find custodian for this lab
        const fetchCustodian = async () => {
          try {
            const encodedLabName = encodeURIComponent(selectedLabData.value);
            console.log('🔍 Fetching custodian for lab:', selectedLabData.value);
            console.log('🔍 API URL:', `http://192.168.110.72:3001/laboratories/public/${encodedLabName}/custodian`);
            
            const response = await fetch(`http://192.168.110.72:3001/laboratories/public/${encodedLabName}/custodian`);
            console.log('🔍 Custodian response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch custodian: ${response.status} ${response.statusText}`);
            }
            
            const custodianData = await response.json();
            console.log('🔍 Custodian data received:', custodianData);
            
            // Try different possible custodian field names
            const custodianName = custodianData.users?.[0]?.full_name || 
                              custodianData.in_charge?.full_name || 
                              custodianData.full_name || 
                              custodianData.users?.find((u: any) => u.role === 'Custodian')?.full_name ||
                              'No custodian assigned';
            
            console.log('🔍 Extracted custodian name:', custodianName);
            
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
  }, [selectedLab, labs]);

  // Handle lab selection from dropdown
  const handleLabSelection = (labValue: string) => {
    setSelectedLab(labValue);
    setFormData(prev => ({
      ...prev,
      laboratory: labValue
    }));
  };
  
  // Filter laboratory options based on assigned lab
  const getLabOptions = () => {
    // Always include E-Forum
    const eForumOption = { value: "e-forum", label: "E-Forum" };
    const allOptions = [eForumOption, ...labs];
    
    // If no assigned lab, return all options
    if (!assignedLab) {
      return allOptions;
    }
    
    // If assigned lab, return all options with assigned lab first
    const assignedLabOption = allOptions.find(option => option.value === assignedLab);
    if (assignedLabOption) {
      const otherOptions = allOptions.filter(option => option.value !== assignedLab);
      return [assignedLabOption, ...otherOptions];
    }
    
    return allOptions;
  };
  const [formData, setFormData] = useState({
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
    requested_by: '', // Default value for public submissions
    remarks: '',
    monitored_by: '',
    approved_by: 'DR. MARCO MARVIN L. RADO' // Pre-filled approval
  });

  // Update monitored_by when custodianName changes
  useEffect(() => {
    if (custodianName) {
      setFormData(prev => ({
        ...prev,
        monitored_by: custodianName // Auto-populate monitored by only
      }));
    }
  }, [custodianName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Network connectivity check
    if (!navigator.onLine) {
      alert('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    if (!formData.usage_type || !formData.faculty_student_name || !formData.laboratory || !formData.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting lab request data:', formData);
      
      // Call the parent's onSubmit callback instead of submitting directly
      if (onSubmit) {
        await onSubmit(formData);
      }
      
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
        requested_by: '', // Default value for public submissions
        remarks: '',
        monitored_by: '',
        approved_by: 'DR. MARCO MARVIN L. RADO' // Pre-filled approval
      });
    } catch (error) {
      console.error('Error submitting lab request:', error);
      
      // Better error handling
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(`Error submitting lab request: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usage_type">Usage Type *</Label>
          <Select value={formData.usage_type} onValueChange={(value) => handleInputChange('usage_type', value)} required disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select usage type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="printing">Printing</SelectItem>
              <SelectItem value="set-in-reservation">Set-in/Reservation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty_student_name">Faculty/Student Name *</Label>
          <Input
            id="faculty_student_name"
            value={formData.faculty_student_name}
            onChange={(e) => handleInputChange('faculty_student_name', e.target.value)}
            placeholder="Enter your full name"
            required
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year_level">Year Level</Label>
          <Input
            id="year_level"
            value={formData.year_level}
            onChange={(e) => handleInputChange('year_level', e.target.value)}
            placeholder="e.g., 1st Year, 2nd Year"
            disabled={disabled}
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="ws_number">Workstation Number</Label>
          <Input
            id="ws_number"
            value={formData.ws_number}
            onChange={(e) => handleInputChange('ws_number', e.target.value)}
            placeholder="e.g., WS-01, WS-02"
            disabled={disabled}
          />
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
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="requested_by">Requested By</Label>
          <Input
            id="requested_by"
            value={formData.requested_by}
            onChange={(e) => handleInputChange('requested_by', e.target.value)}
            placeholder="Your name"
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
            disabled={disabled || !!custodianName} // Disable if custodianName is provided
            readOnly={!!custodianName} // Make read-only if custodianName is provided
          />
          {custodianName && (
            <p className="text-sm text-gray-500">This field is automatically set by the custodian who generated this link</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Lab Request'}
        </Button>
      </div>
    </form>
  );
};
