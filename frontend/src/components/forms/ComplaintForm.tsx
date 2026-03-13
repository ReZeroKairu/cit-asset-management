import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, AlertCircle, Monitor, X } from "lucide-react";
import { 
  type ComplaintData,
  type Laboratory,
  type Workstation,
  getLaboratories,
  getWorkstationsByLab
} from "../../api/complaints";

interface ComplaintFormProps {
  onSubmit: (data: ComplaintData) => void;
  disabled?: boolean;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit, disabled = false }) => {
  const [formData, setFormData] = useState<ComplaintData>({
    lab_id: 0, // Keep as 0 but handle value differently
    laboratory_name: "",
    workstation_id: undefined,
    workstation_name: "",
    faculty_student_name: "",
    user_type: "Student",
    year_level: "",
    issue_description: "",
    selected_asset: undefined
  });

  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workstationAssets, setWorkstationAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWorkstations, setLoadingWorkstations] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);

  // Year levels for students
  const yearLevels = [
    "1",
    "2", 
    "3",
    "4",
    "5"
  ];

  useEffect(() => {
    fetchLaboratories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      setLoading(true);
      const labs = await getLaboratories();
      setLaboratories(labs);
    } catch (err: any) {
      // Check if it's a rate limit error
      if (err.message && err.message.includes('Too many form submissions')) {
        setError(err.message);
      } else {
        setError("Failed to load laboratories. Please try again.");
      }
      console.error("Error fetching laboratories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLabChange = async (labId: string) => {
    const labIdNum = parseInt(labId);
    const lab = laboratories.find(l => l.lab_id === labIdNum);
    setSelectedLab(lab || null);
    
    setFormData((prev: ComplaintData) => ({ 
      ...prev, 
      lab_id: labIdNum, 
      workstation_id: undefined, 
      asset_id: undefined,
      laboratory_name: lab?.lab_name,
      workstation_name: undefined,
      selected_asset: undefined 
    }));

    if (labIdNum) {
      try {
        setLoadingWorkstations(true);
        const workstations = await getWorkstationsByLab(labIdNum);
        setWorkstations(workstations);
      } catch (err: any) {
        // Check if it's a rate limit error
        if (err.message && err.message.includes('Too many form submissions')) {
          setError(err.message);
        } else {
          setError("Failed to load workstations. Please try again.");
        }
        console.error("Error fetching workstations:", err);
      } finally {
        setLoadingWorkstations(false);
      }
    } else {
      setWorkstations([]);
      setWorkstationAssets([]);
    }
  };

  const handleWorkstationChange = async (workstationId: string) => {
    const workstationIdNum = workstationId === "none" ? undefined : parseInt(workstationId);
    const selectedWorkstation = workstationIdNum ? workstations.find(w => w.workstation_id === workstationIdNum) : undefined;
    
    setFormData((prev: ComplaintData) => ({ 
      ...prev, 
      workstation_id: workstationIdNum, 
      workstation_name: selectedWorkstation?.workstation_name,
      selected_asset: undefined 
    }));
    
    if (workstationIdNum) {
      try {
        setLoadingAssets(true);
        // Fetch assets for the selected workstation using public endpoint
        const response = await fetch(`${getApiBaseUrl()}/inventory?workstation_id=${workstationIdNum}`);
        if (response.ok) {
          const assets = await response.json();
          setWorkstationAssets(assets);
        } else {
          console.error("Failed to fetch workstation assets");
          setWorkstationAssets([]);
        }
      } catch (err) {
        console.error("Error fetching workstation assets:", err);
        setWorkstationAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    } else {
      setWorkstationAssets([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.lab_id) {
      setError("Please select a laboratory");
      return;
    }

    if (!formData.faculty_student_name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (formData.user_type === "Student" && !formData.year_level?.trim()) {
      setError("Please select your year level");
      return;
    }

    if (!formData.issue_description.trim()) {
      setError("Please describe the issue");
      return;
    }

    if (!formData.selected_asset?.asset_id) {
      setError("Please select the affected asset");
      return;
    }

    // Check for existing complaints on the same asset
    if (formData.selected_asset?.asset_id) {
      try {
        console.log('Checking for existing complaints on asset:', formData.selected_asset.asset_id);
        const response = await fetch(`${getApiBaseUrl()}/public-complaints/check-asset/${formData.selected_asset.asset_id}`);
        
        if (!response.ok) {
          console.error('❌ Failed to check existing complaints:', response.status, response.statusText);
          // Continue with submission even if check fails
        } else {
          const result = await response.json();
          console.log('Duplicate check result:', result);
          
          if (result.hasExistingComplaint) {
            const errorMessage = `⚠️ **Duplicate Complaint Detected**

This asset already has an ongoing complaint (Complaint #${result.existingComplaintId}). The custodian is currently processing it.

Please wait for the current complaint to be resolved before submitting a new one.`;
            setError(errorMessage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          } else {
            console.log('No existing complaints found via asset_id check');
          }
        }
      } catch (error) {
        console.error('Error checking existing complaints via asset_id:', error);
        // Continue with submission even if check fails
      }
    }

    // Additional fallback check: If no specific asset selected, or if asset_id check failed
    if (formData.selected_asset && !error) {
      try {
        console.log('Performing fallback check using asset info');
        // For now, let's show a general message if any asset is selected
        // This can be enhanced later to check by asset name or other identifiers
        const assetName = formData.selected_asset.units?.unit_name || formData.selected_asset.asset_details?.property_tag_no || 'selected asset';
        console.log('Asset selected for fallback check:', assetName);
        
        // You could add another API call here for fallback checking if needed
        // For now, we'll proceed with submission but log the selection
      } catch (fallbackError) {
        console.error('Fallback check error:', fallbackError);
      }
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ComplaintData, value: string | undefined) => {
    // Clear error when user changes form data
    if (error) {
      setError(null);
    }
    
    if (field === 'workstation_id') {
      setFormData((prev: ComplaintData) => ({ 
        ...prev, 
        [field]: value === undefined ? undefined : parseInt(value) 
      }));
    } else {
      setFormData((prev: ComplaintData) => ({ ...prev, [field]: value }));
    }
  };

  // Dynamic name label based on user type
  const getNameLabel = () => {
    return formData.user_type === "Faculty" ? "Faculty Name" : "Student Name";
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="relative border-2 border-red-300 bg-red-50 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-red-800 font-medium text-sm leading-relaxed whitespace-pre-line">
                  {error}
                </AlertDescription>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                title="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Alert>
        )}

      {/* Form Fields in Flat Layout */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user_type">User Type *</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value) => handleInputChange("user_type", value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={formData.user_type === "Faculty" ? "faculty_name" : "student_name"}>
              {getNameLabel()} *
            </Label>
            <Input
              id={formData.user_type === "Faculty" ? "faculty_name" : "student_name"}
              value={formData.faculty_student_name}
              onChange={(e) => handleInputChange("faculty_student_name", e.target.value)}
              placeholder={`Enter ${formData.user_type === "Faculty" ? "faculty" : "student"} name`}
              className="capitalize-first"
              disabled={disabled}
              required
            />
          </div>
        </div>

        {/* Year Level - Only for Students */}
        {formData.user_type === "Student" && (
          <div>
            <Label htmlFor="year_level">Year Level *</Label>
            <Select
              value={formData.year_level}
              onValueChange={(value) => handleInputChange("year_level", value)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lab_id">Laboratory *</Label>
            <Select
              value={formData.lab_id > 0 ? formData.lab_id.toString() : ""}
              onValueChange={handleLabChange}
              disabled={disabled || loading}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={loading ? "Loading laboratories..." : "Select laboratory"}
                  className="text-gray-500 placeholder:text-gray-400"
                />
              </SelectTrigger>
              <SelectContent>
                {laboratories.map(lab => (
                  <SelectItem key={lab.lab_id} value={lab.lab_id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{lab.lab_name}</span>
                      {lab.location && <span className="text-gray-500">({lab.location})</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="workstation_id">Workstation</Label>
            <Select
              value={formData.workstation_id ? formData.workstation_id.toString() : "none"}
              onValueChange={handleWorkstationChange}
              disabled={disabled || loadingWorkstations || !formData.lab_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.lab_id 
                    ? "Select laboratory first" 
                    : loadingWorkstations 
                    ? "Loading workstations..." 
                    : "Select workstation (optional)"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific workstation</SelectItem>
                {workstations.map(workstation => (
                  <SelectItem key={workstation.workstation_id} value={workstation.workstation_id.toString()}>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      {workstation.workstation_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Asset Selection */}
        <div>
          <Label htmlFor="selected_asset">Asset *</Label>
          <Select
            value={formData.selected_asset?.asset_id?.toString() || ""}
            onValueChange={(value) => {
              const asset = workstationAssets.find(a => a.asset_id.toString() === value);
              setFormData(prev => ({ ...prev, selected_asset: asset }));
            }}
            disabled={disabled || loadingAssets || !formData.workstation_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.workstation_id 
                  ? "Select workstation first" 
                  : loadingAssets 
                  ? "Loading assets..." 
                  : "Select affected asset"
              } />
            </SelectTrigger>
            <SelectContent>
              {workstationAssets.length === 0 ? (
                <div className="p-2 text-sm text-gray-500 text-center">
                  No assets found for this workstation
                </div>
              ) : (
                workstationAssets.map((asset: any) => (
                  <SelectItem key={asset.asset_id} value={asset.asset_id.toString()}>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      <div>
                        <div className="font-medium">
                          {asset.asset_details?.property_tag_no || asset.units?.unit_name || `Asset #${asset.asset_id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.units?.unit_name || 'Unknown'} - {asset.asset_details?.asset_statuses?.status_name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Select the specific asset that has the issue. Asset selection is required.
          </p>
        </div>

        <div>
          <Label htmlFor="issue_description">Issue Description *</Label>
          <Textarea
            id="issue_description"
            value={formData.issue_description}
            onChange={(e) => handleInputChange("issue_description", e.target.value)}
            placeholder="Please describe the issue in detail..."
            rows={4}
            disabled={disabled}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="approved_by">Approved By</Label>
            <Input
              id="approved_by"
              value={selectedLab?.custodian?.full_name?.toUpperCase() || ""}
              disabled
              readOnly
            />
            {selectedLab && selectedLab.lab_name.toLowerCase() !== 'e-forum' && (
              <p className="text-sm text-gray-500">This field is automatically set by the assigned custodian</p>
            )}
            {selectedLab && selectedLab.lab_name.toLowerCase() === 'e-forum' && (
              <p className="text-sm text-gray-500">E-Forum requires manual monitor assignment</p>
            )}
            {!selectedLab && (
              <p className="text-sm text-gray-500">This field will auto-populate when a laboratory is selected</p>
            )}
          </div>

          <div>
            <Label htmlFor="monitored_by">Monitored By</Label>
            <Input
              id="monitored_by"
              value={selectedLab?.custodian?.full_name?.toUpperCase() || ""}
              disabled={disabled || (!selectedLab || selectedLab.lab_name.toLowerCase() !== 'e-forum')} // Disabled by default, only enabled for E-Forum
              readOnly={!selectedLab || selectedLab.lab_name.toLowerCase() !== 'e-forum'} // Read-only by default, only enabled for E-Forum
            />
            {selectedLab && selectedLab.lab_name.toLowerCase() !== 'e-forum' && (
              <p className="text-sm text-gray-500">This field is automatically set by the assigned custodian</p>
            )}
            {selectedLab && selectedLab.lab_name.toLowerCase() === 'e-forum' && (
              <p className="text-sm text-gray-500">E-Forum requires manual monitor assignment</p>
            )}
            {!selectedLab && (
              <p className="text-sm text-gray-500">This field will auto-populate when a laboratory is selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button
          type="submit"
          variant="outline"
          className="px-8 py-3 border-gray-300 hover:bg-gray-50 font-medium shadow-sm min-w-[120px]"
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
      </form>
    </div>
  );
};

export default ComplaintForm;
