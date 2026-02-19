import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy, Download, QrCode, ExternalLink } from 'lucide-react';
import QRCodeLib from 'qrcode';

interface QRCodeModalProps {
  show: boolean;
  onClose: () => void;
  baseUrl?: string;
}

const QRCodeModal = ({ show, onClose, baseUrl }: QRCodeModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [customPath, setCustomPath] = useState<string>('public-forms');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [editableBaseUrl, setEditableBaseUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect the appropriate base URL
  const getBaseUrl = () => {
    if (baseUrl) return baseUrl;
    
    // If we're on localhost, use the local IP for LAN access
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://192.168.111.21:5173'; // Use local IP for LAN access
    }
    
    return window.location.origin;
  };

  // Initialize editable base URL when modal opens
  useEffect(() => {
    if (show) {
      setEditableBaseUrl(getBaseUrl());
      // Clear previous QR code when modal opens
      setGeneratedUrl('');
      setQrCodeUrl('');
    }
  }, [show]);

  const generateQRCode = async () => {
    const fullUrl = `${editableBaseUrl}/${customPath}`;
    setGeneratedUrl(fullUrl);
    
    try {
      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, fullUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Also create data URL for download
        const dataUrl = canvasRef.current.toDataURL();
        setQrCodeUrl(dataUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      alert('URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const openPublicForms = () => {
    window.open(generatedUrl, '_blank');
  };

  // Generate QR code when modal opens
  useEffect(() => {
    if (show) {
      generateQRCode();
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Public Forms QR Code
          </h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={editableBaseUrl}
              onChange={(e) => setEditableBaseUrl(e.target.value)}
              placeholder="https://your-tunnel-domain.trycloudflare.com"
            />
            <p className="text-xs text-gray-500">
              {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? "Cloudflared tunnel URL for public access"
                : "Current domain for public access"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-path">Custom Path</Label>
            <Input
              id="custom-path"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="public-forms"
            />
            <p className="text-xs text-gray-500">
              Default path for public forms access
            </p>
          </div>
          
          <Button onClick={generateQRCode} className="w-full" variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>

          {generatedUrl && (
            <>
              <div className="flex justify-center">
                <canvas 
                  ref={canvasRef} 
                  className="border border-gray-200 rounded-lg max-w-full h-auto"
                  style={{ maxWidth: '256px', width: '100%', height: 'auto' }}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Public URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedUrl}
                    readOnly
                    className="bg-gray-50 text-sm flex-1"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={openPublicForms}
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={downloadQRCode}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">How to use:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Users can scan this QR code with their phones</li>
                  <li>• They'll be directed to the public forms page</li>
                  <li>• No login required for form submission</li>
                  <li>• Forms will appear as pending for review</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
