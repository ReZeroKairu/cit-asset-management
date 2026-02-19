import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy, QrCode, ExternalLink, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';

interface QRCodeGeneratorProps {
  baseUrl?: string;
}

const QRCodeGenerator = ({ baseUrl }: QRCodeGeneratorProps) => {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [customPath, setCustomPath] = useState<string>('one-time');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [editableBaseUrl, setEditableBaseUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [pendingTokenData, setPendingTokenData] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smart API URL detection
  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    console.log('QR Generator hostname:', hostname);
    
    // Always use the network IP for API calls when accessing from network
    if (hostname === '192.168.110.72') {
      return 'http://192.168.110.72:3001';
    }
    // For localhost access, use localhost API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // Fallback to current origin with port 3001
    return `${window.location.protocol}//${hostname}:3001`;
  };

  const apiBaseUrl = getApiBaseUrl();

  // Detect the appropriate base URL
  const getBaseUrl = () => {
    if (baseUrl) return baseUrl;
    
    // For local development, use network IP for mobile scanning
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://192.168.110.72:5174'; // Use correct frontend network IP and port
    }
    
    return window.location.origin;
  };

  // Initialize editable base URL when component mounts
  useEffect(() => {
    setEditableBaseUrl(getBaseUrl());
  }, []);

  // Generate QR code when canvas is ready and we have token data
  useEffect(() => {
    if (pendingTokenData && canvasRef.current) {
      generateQRCode(pendingTokenData);
    }
  }, [pendingTokenData]);

  const generateQRCode = async (tokenData: any) => {
    const fullUrl = `${editableBaseUrl}/${customPath}?token=${tokenData.token}`;
    console.log('Generating QR code for URL:', fullUrl);
    
    try {
      // Small delay to ensure canvas is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await QRCode.toCanvas(canvasRef.current!, fullUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const dataUrl = canvasRef.current!.toDataURL();
      console.log('QR code data URL generated, length:', dataUrl.length);
      setQrCodeUrl(dataUrl);
      setPendingTokenData(null); // Clear pending data
    } catch (qrError) {
      console.error('Error generating QR code with canvas:', qrError);
      
      // Fallback: generate QR code as data URL
      try {
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        console.log('QR code data URL generated (fallback), length:', dataUrl.length);
        setQrCodeUrl(dataUrl);
        setPendingTokenData(null); // Clear pending data
      } catch (fallbackError) {
        console.error('Error generating QR code with fallback:', fallbackError);
        alert('Error generating QR code: ' + (fallbackError instanceof Error ? fallbackError.message : 'Unknown error'));
        setPendingTokenData(null); // Clear pending data
      }
    }
  };

  const generateOneTimeToken = async () => {
    // Check if there's already a generated QR code
    if (generatedUrl && !isGenerating) {
      const confirmGenerate = window.confirm(
        'A QR code has already been generated. Generating a new one will create an additional valid link. ' +
        'The previous QR code will remain valid until used or expired. Do you want to continue?'
      );
      
      if (!confirmGenerate) {
        return;
      }
    }
    
    setIsGenerating(true);
    console.log('Starting one-time token generation...');
    
    try {
      console.log('Calling API at:', `${apiBaseUrl}/api/one-time-forms/generate-token`);
      console.log('Request body:', JSON.stringify({
        generatedBy: user?.id || 1,
        expiresInHours: 24
      }));
      
      const response = await fetch(`${apiBaseUrl}/api/one-time-forms/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatedBy: user?.id || 1,
          expiresInHours: 24
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (result.success) {
        const fullUrl = `${editableBaseUrl}/${customPath}?token=${result.token}`;
        console.log('Generated full URL:', fullUrl);
        setGeneratedUrl(fullUrl);
        setExpiresAt(new Date(result.expiresAt));
        
        // Clear previous QR code to show loading state
        setQrCodeUrl('');
        
        // Set pending token data for QR code generation
        setPendingTokenData(result);
        
        // Show info message if there was already a QR code
        if (generatedUrl) {
          alert('New QR code generated! Previous QR codes remain valid until used or expired.');
        }
      } else {
        console.error('API returned success=false:', result.message);
        alert('Failed to generate one-time token: ' + result.message);
      }
    } catch (error) {
      console.error('Error generating one-time token:', error);
      alert('Error generating one-time token');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedUrl);
        alert('One-time link copied to clipboard!');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = generatedUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            alert('One-time link copied to clipboard!');
          } else {
            throw new Error('Copy command failed');
          }
        } catch (fallbackError) {
          document.body.removeChild(textArea);
          throw fallbackError;
        }
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Show the URL in an alert as a last resort
      alert(`Failed to copy to clipboard. Here is the link:\n\n${generatedUrl}\n\nPlease copy it manually.`);
    }
  };

  const openOneTimeForm = () => {
    window.open(generatedUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Generate One-Time QR Code for Forms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={editableBaseUrl}
              onChange={(e) => setEditableBaseUrl(e.target.value)}
              placeholder="http://localhost:5173"
            />
            <p className="text-sm text-gray-500">
              Your frontend URL for QR code generation (port 5174)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom-path">Custom Path (optional)</Label>
            <Input
              id="custom-path"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="one-time"
            />
            <p className="text-sm text-gray-500">
              Path for the one-time form link. Default: one-time
            </p>
          </div>
          
          <Button 
            onClick={generateOneTimeToken} 
            className="w-full"
            disabled={isGenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate One-Time QR Code'}
          </Button>
        </CardContent>
      </Card>

      {generatedUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated One-Time QR Code</span>
              {expiresAt && (
                <span className="text-sm font-normal text-orange-600">
                  Expires: {expiresAt.toLocaleString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="border border-gray-200 rounded-lg"
                  style={{ backgroundColor: '#f0f0f0' }}
                />
              ) : (
                <div className="text-center">
                  <canvas 
                    ref={canvasRef} 
                    className="border border-gray-200 rounded-lg mb-2"
                    style={{ backgroundColor: '#f0f0f0' }}
                  />
                  <div className="text-sm text-gray-500">
                    Generating QR code...
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>One-Time Form URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedUrl}
                  readOnly
                  className="bg-gray-50"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={openOneTimeForm}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• This QR code contains a one-time link for form submission</li>
                <li>• Users can scan this QR code with their phones</li>
                <li>• They'll be directed to a special one-time form page</li>
                <li>• The link can only be used once and expires in 24 hours</li>
                <li>• No login required for form submission</li>
                <li>• Forms will be submitted as pending for review</li>
              </ul>
            </div>
            
            {generatedUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Important:</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Each QR code can only be used once</li>
                  <li>• Generating a new QR code creates an additional valid link</li>
                  <li>• Previous QR codes remain valid until used or expired</li>
                  <li>• Keep track of which QR code you share with users</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeGenerator;
