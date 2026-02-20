import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { submitPublicSoftwareInstallation } from "../../api/publicForms";

// Dynamic API URL detection
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return `http://${hostname}:3001`;
};

interface PublicSoftwareInstallFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
  custodianName?: string;
  assignedLab?: string;
  isOneTimeForm?: boolean;
}

export const PublicSoftwareInstallForm = ({ onSubmit, disabled = false, custodianName, assignedLab, isOneTimeForm = false }: PublicSoftwareInstallFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labs, setLabs] = useState<Array<{value: string, label: string}>>([]);
  
  // Fetch all labs from database (fallback when not provided an assigned lab)
  useEffect(() => {
    if (assignedLab) return;

    const fetchLabs = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/laboratories/public`);
        if (!response.ok) {
          throw new Error(`Failed to fetch labs: ${response.status} ${response.statusText}`);
        }

        const labsData = await response.json();
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
  }, [assignedLab]);

  // Filter laboratory options based on assigned lab
  const getLabOptions = () => {
    if (assignedLab) {
      return [{ value: assignedLab, label: assignedLab }];
    }
    return labs;
  };
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    faculty_name: '',
    laboratory: '',
    software_list: '',
    requested_by: '', // Default value for public submissions
    approved_by: '',
    installation_remarks: '',
    prepared_by: ''
  });

  // If assignedLab is provided, pre-fill the laboratory field.
  useEffect(() => {
    if (!assignedLab) return;
    setFormData(prev => ({
      ...prev,
      laboratory: prev.laboratory || assignedLab,
    }));
  }, [assignedLab]);

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

  // Auto-populate approved_by and prepared_by based on selected lab custodian (if custodianName prop is not explicitly provided)
  useEffect(() => {
    if (custodianName) return;
    if (!formData.laboratory) {
      setFormData(prev => ({
        ...prev,
        approved_by: '',
        prepared_by: '',
      }));
      return;
    }

    const fetchCustodian = async () => {
      try {
        const encodedLabName = encodeURIComponent(formData.laboratory);
        const response = await fetch(`${getApiBaseUrl()}/laboratories/public/${encodedLabName}/custodian`);

        if (!response.ok) {
          throw new Error(`Failed to fetch custodian: ${response.status} ${response.statusText}`);
        }

        const custodianData = await response.json();
        
        const resolvedCustodianName = custodianData.users?.[0]?.full_name ||
          custodianData.in_charge?.full_name ||
          custodianData.full_name ||
          custodianData.users?.find((u: any) => u.role === 'Custodian')?.full_name ||
          '';

        setFormData(prev => ({
          ...prev,
          approved_by: resolvedCustodianName,
          prepared_by: resolvedCustodianName,
        }));
      } catch (error) {
        console.error('Failed to fetch custodian:', error);
        setFormData(prev => ({
          ...prev,
          approved_by: '',
          prepared_by: '',
        }));
      }
    };

    fetchCustodian();
  }, [custodianName, formData.laboratory]);

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
      // Add timeout for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Don't submit directly - parent will handle submission
      clearTimeout(timeoutId);
      
      // Call parent's onSubmit to show success message
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
        approved_by: '',
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
            disabled
            readOnly
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
            disabled
            readOnly
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
