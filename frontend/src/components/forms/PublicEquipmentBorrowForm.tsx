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
}

export const PublicEquipmentBorrowForm = ({ onSubmit, disabled = false, custodianName, assignedLab }: PublicEquipmentBorrowFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter laboratory options based on assigned lab
  const getLabOptions = () => {
    // If no assigned lab, return empty array (no options)
    if (!assignedLab) {
      return [];
    }
    
    // Only show assigned lab for Equipment Borrow form
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
      
      // Call the parent's onSubmit callback instead of submitting directly
      if (onSubmit) {
        await onSubmit(formData);
      }
      
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
