import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { submitPublicSoftwareInstallation } from "../../api/publicForms";

interface PublicSoftwareInstallFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
  custodianName?: string;
  assignedLab?: string;
}

export const PublicSoftwareInstallForm = ({ onSubmit, disabled = false, custodianName, assignedLab }: PublicSoftwareInstallFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    faculty_name: '',
    laboratory: '',
    software_list: '',
    requested_by: '', // Default value for public submissions
    approved_by: 'DR. MARCO MARVIN L. RADO', // Pre-filled approval
    installation_remarks: '',
    prepared_by: '' // Will be set by useEffect
  });

  // Update approved_by and prepared_by when custodianName changes
  useEffect(() => {
    if (custodianName) {
      setFormData(prev => ({
        ...prev,
        approved_by: custodianName, // Auto-populate approved by
        prepared_by: custodianName // Auto-populate prepared by
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
    
    if (!formData.faculty_name || !formData.laboratory || !formData.software_list) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting software installation data:', formData);
      
      // Add timeout for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const result = await submitPublicSoftwareInstallation(formData);
      clearTimeout(timeoutId);
      
      console.log('Software installation submission result:', result);
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        faculty_name: '',
        laboratory: '',
        software_list: '',
        requested_by: '', // Default value for public submissions
        approved_by: 'DR. MARCO MARVIN L. RADO', // Pre-filled approval
        installation_remarks: '',
        prepared_by: ''
      });
    } catch (error) {
      console.error('Error submitting software installation:', error);
      
      // Better error handling
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(`Error submitting form: ${errorMessage}`);
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
          <Label htmlFor="faculty_name">Faculty Name *</Label>
          <Input
            id="faculty_name"
            value={formData.faculty_name}
            onChange={(e) => handleInputChange('faculty_name', e.target.value)}
            placeholder="Enter faculty name"
            required
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="laboratory">Laboratory *</Label>
          <Select value={formData.laboratory} onValueChange={(value) => handleInputChange('laboratory', value)} required disabled={disabled}>
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
          <Label htmlFor="approved_by">Approved By</Label>
          <Input
            id="approved_by"
            value={custodianName ? custodianName.toUpperCase() : formData.approved_by}
            onChange={!custodianName ? (e) => handleInputChange('approved_by', e.target.value) : undefined}
            placeholder="DR. MARCO MARVIN L. RADO"
            disabled={disabled || !!custodianName} // Disable if custodianName is provided
            readOnly={!!custodianName} // Make read-only if custodianName is provided
          />
          {custodianName && (
            <p className="text-sm text-gray-500">This field is automatically set by the custodian who generated this link</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prepared_by">Prepared By</Label>
          <Input
            id="prepared_by"
            value={custodianName ? custodianName.toUpperCase() : formData.prepared_by}
            onChange={!custodianName ? (e) => handleInputChange('prepared_by', e.target.value) : undefined}
            placeholder="IT staff name"
            disabled={disabled || !!custodianName} // Disable if custodianName is provided
            readOnly={!!custodianName} // Make read-only if custodianName is provided
          />
          {custodianName && (
            <p className="text-sm text-gray-500">This field is automatically set by the custodian who generated this link</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="software_list">Software List *</Label>
        <Textarea
          id="software_list"
          value={formData.software_list}
          onChange={(e) => handleInputChange('software_list', e.target.value)}
          placeholder="List the software to be installed (one per line or comma-separated)"
          rows={4}
          required
          disabled={disabled}
        />
        <p className="text-sm text-gray-500">
          Example: Adobe Photoshop, Microsoft Office, AutoCAD, etc.
        </p>
      </div>

      <div className="flex gap-4 pt-6">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Software Installation Request'}
        </Button>
      </div>
    </form>
  );
};
