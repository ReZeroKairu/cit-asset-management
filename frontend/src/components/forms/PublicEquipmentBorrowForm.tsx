import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { submitPublicEquipmentBorrow } from "../../api/publicForms";

interface PublicEquipmentBorrowFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
  custodianName?: string;
  assignedLab?: string;
  isOneTimeForm?: boolean;
}

export const PublicEquipmentBorrowForm = ({ onSubmit, disabled = false, custodianName, assignedLab, isOneTimeForm = false }: PublicEquipmentBorrowFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labs, setLabs] = useState<Array<{value: string, label: string}>>([]);
  
  // Fetch all labs from database (fallback when not provided an assigned lab)
  useEffect(() => {
    if (assignedLab) return;

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
  }, [assignedLab]);

  // Filter laboratory options based on assigned lab
  const getLabOptions = () => {
    // If assigned lab exists, only show that lab
    if (assignedLab) {
      return [{ value: assignedLab, label: assignedLab }];
    }

    // Otherwise show all labs from the database
    return labs;
  };
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    faculty_student_name: '',
    year_level: '',
    laboratory: '',
    equipment_list: [{ equipmentName: '', unitQty: '' }],
    purpose: '',
    release_time: '',
    returned_time: '',
    requested_by: '', // Default value for public submissions
    remarks: '',
    monitored_by: '', // Will be set by useEffect
    approved_by: 'DR. MARCO MARVIN L. RADO' // Pre-filled approval
  });

  // If assignedLab is provided, pre-fill the laboratory field.
  useEffect(() => {
    if (!assignedLab) return;
    setFormData(prev => ({
      ...prev,
      laboratory: prev.laboratory || assignedLab,
    }));
  }, [assignedLab]);

  // Auto-populate monitored_by based on selected lab custodian (if custodianName prop is not explicitly provided)
  useEffect(() => {
    if (custodianName) return;
    if (!formData.laboratory) return;

    const fetchCustodian = async () => {
      try {
        const encodedLabName = encodeURIComponent(formData.laboratory);
        console.log('🔍 Fetching custodian for lab:', formData.laboratory);
        console.log('🔍 API URL:', `http://192.168.110.72:3001/laboratories/public/${encodedLabName}/custodian`);

        const response = await fetch(`http://192.168.110.72:3001/laboratories/public/${encodedLabName}/custodian`);
        console.log('🔍 Custodian response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch custodian: ${response.status} ${response.statusText}`);
        }

        const custodianData = await response.json();
        console.log('🔍 Custodian data received:', custodianData);

        const resolvedCustodianName = custodianData.users?.[0]?.full_name ||
          custodianData.in_charge?.full_name ||
          custodianData.full_name ||
          custodianData.users?.find((u: any) => u.role === 'Custodian')?.full_name ||
          'No custodian assigned';

        console.log('🔍 Extracted custodian name:', resolvedCustodianName);

        setFormData(prev => ({
          ...prev,
          monitored_by: resolvedCustodianName,
        }));
      } catch (error) {
        console.error('Failed to fetch custodian:', error);
        setFormData(prev => ({
          ...prev,
          monitored_by: 'No custodian assigned',
        }));
      }
    };

    fetchCustodian();
  }, [custodianName, formData.laboratory]);

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
    // Prevent changes to monitored_by if custodianName is provided
    if (field === 'monitored_by' && custodianName) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEquipmentChange = (index: number, field: string, value: string | number) => {
    const newEquipmentList = [...formData.equipment_list];
    newEquipmentList[index] = {
      ...newEquipmentList[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      equipment_list: newEquipmentList
    }));
  };

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipment_list: [...prev.equipment_list, { equipmentName: '', unitQty: '' }]
    }));
  };

  const removeEquipment = (index: number) => {
    const newEquipmentList = formData.equipment_list.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      equipment_list: newEquipmentList
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Network connectivity check
    if (!navigator.onLine) {
      alert('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    if (!formData.faculty_student_name || !formData.laboratory || !formData.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting equipment borrow data:', formData);
      
      // Don't submit directly - parent will handle submission
      
      // Call parent's onSubmit to show success message
      if (onSubmit) {
        onSubmit(formData);
      }
      
      // Reset form
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        faculty_student_name: '',
        year_level: '',
        laboratory: '',
        equipment_list: [{ equipmentName: '', unitQty: '' }],
        purpose: '',
        release_time: '',
        returned_time: '',
        requested_by: '', // Default value for public submissions
        remarks: '',
        monitored_by: '',
        approved_by: 'DR. MARCO MARVIN L. RADO' // Pre-filled approval
      });
    } catch (error) {
      console.error('Error submitting equipment borrow:', error);
      
      // Better error handling
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(`Error submitting equipment borrow: ${errorMessage}`);
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
          <Label htmlFor="release_time">Release Time *</Label>
          <Input
            id="release_time"
            type="time"
            value={formData.release_time}
            onChange={(e) => handleInputChange('release_time', e.target.value)}
            disabled={disabled}
            required
          />
        </div>

        {/* Returned Time will be filled by Custodian after approval */}
        <input
          type="hidden"
          value={formData.returned_time}
          onChange={(e) => handleInputChange('returned_time', e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Equipment List *</Label>
          <Button type="button" onClick={addEquipment} variant="outline" size="sm" disabled={disabled}>
            Add Equipment
          </Button>
        </div>
        
        {formData.equipment_list.map((equipment, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Equipment Name</Label>
              <Input
                value={equipment.equipmentName}
                onChange={(e) => handleEquipmentChange(index, 'equipmentName', e.target.value)}
                placeholder="Enter equipment name"
                required
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                value={equipment.unitQty}
                onChange={(e) => handleEquipmentChange(index, 'unitQty', e.target.value)}
                placeholder="Enter quantity"
                required
                disabled={disabled}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                type="button" 
                onClick={() => removeEquipment(index)} 
                variant="destructive" 
                size="sm"
                disabled={disabled}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => handleInputChange('purpose', e.target.value)}
          placeholder="Describe the purpose of equipment borrowing"
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

      <Button 
        type="submit" 
        className="w-full" 
        disabled={disabled || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Equipment Borrow Request'}
      </Button>
    </form>
  );
};
