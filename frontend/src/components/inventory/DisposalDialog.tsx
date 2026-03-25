import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DisposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (disposalData: any) => void;
  asset: any;
}

const DisposalDialog: React.FC<DisposalDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  asset
}) => {
  const [disposalData, setDisposalData] = useState({
    asset_id: asset?.asset_id || 0,
    disposal_date: new Date().toISOString().split('T')[0],
    disposal_reason: "",
    disposal_method: "Scrap" as const,
    disposal_value: "",
    disposal_remarks: ""
  });

  const handleSubmit = () => {
    if (!disposalData.disposal_reason.trim()) {
      alert("Please provide a disposal reason");
      return;
    }

    onConfirm({
      ...disposalData,
      disposal_value: disposalData.disposal_value ? parseFloat(disposalData.disposal_value) : null
    });
    onClose();
  };

  const handleClose = () => {
    setDisposalData({
      asset_id: asset?.asset_id || 0,
      disposal_date: new Date().toISOString().split('T')[0],
      disposal_reason: "",
      disposal_method: "Scrap",
      disposal_value: "",
      disposal_remarks: ""
    });
    onClose();
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dispose Asset</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property-tag" className="text-right">
              Property Tag
            </Label>
            <div className="col-span-3">
              <input
                id="property-tag"
                value={asset.asset_details?.property_tag_no || "N/A"}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <div className="col-span-3">
              <input
                id="description"
                value={asset.asset_details?.description || "N/A"}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="disposal-date" className="text-right">
              Disposal Date *
            </Label>
            <div className="col-span-3">
              <input
                id="disposal-date"
                type="date"
                value={disposalData.disposal_date}
                onChange={(e) => setDisposalData(prev => ({ ...prev, disposal_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="disposal-method" className="text-right">
              Disposal Method *
            </Label>
            <div className="col-span-3">
              <Select 
                value={disposalData.disposal_method} 
                onValueChange={(value: any) => setDisposalData(prev => ({ ...prev, disposal_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select disposal method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Scrap">Scrap</SelectItem>
                  <SelectItem value="Donated">Donated</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Stolen">Stolen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="disposal-value" className="text-right">
              Value (₱)
            </Label>
            <div className="col-span-3">
              <input
                id="disposal-value"
                type="number"
                step="0.01"
                min="0"
                value={disposalData.disposal_value}
                onChange={(e) => setDisposalData(prev => ({ ...prev, disposal_value: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="disposal-reason" className="text-right pt-2">
              Disposal Reason *
            </Label>
            <div className="col-span-3">
              <Textarea
                id="disposal-reason"
                value={disposalData.disposal_reason}
                onChange={(e) => setDisposalData(prev => ({ ...prev, disposal_reason: e.target.value }))}
                placeholder="Enter reason for disposal..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="disposal-remarks" className="text-right pt-2">
              Remarks
            </Label>
            <div className="col-span-3">
              <Textarea
                id="disposal-remarks"
                value={disposalData.disposal_remarks}
                onChange={(e) => setDisposalData(prev => ({ ...prev, disposal_remarks: e.target.value }))}
                placeholder="Additional remarks (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Dispose Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisposalDialog;
