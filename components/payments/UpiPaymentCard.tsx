'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { generateUpiUri } from '@/lib/payments/upi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Upload, CheckCircle2 } from 'lucide-react';

interface UpiPaymentCardProps {
  vpa: string;
  payeeName: string;
  amount: number;
  invoiceId: string;
  transactionRef: string;
  onUploadProof: (utr: string, file: File) => Promise<void>;
}

export function UpiPaymentCard({
  vpa,
  payeeName,
  amount,
  invoiceId,
  transactionRef,
  onUploadProof,
}: UpiPaymentCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [upiUri, setUpiUri] = useState('');
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const uri = generateUpiUri(vpa, payeeName, amount, invoiceId, transactionRef);
    setUpiUri(uri);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, uri, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [vpa, payeeName, amount, invoiceId, transactionRef]);

  const handleUpload = async () => {
    if (!utr || !file) return;
    try {
      setIsUploading(true);
      await onUploadProof(utr, file);
      setUploaded(true);
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pay via UPI</CardTitle>
        <CardDescription>Scan the QR code or pay directly using any UPI app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border">
          <canvas ref={canvasRef}></canvas>
          <div className="mt-2 text-center text-sm font-medium">
            Amount: ₹{amount.toFixed(2)}<br />
            To: {payeeName}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full" asChild>
            <a href={`gpay://upi/pay?pa=${vpa}&pn=${payeeName}&am=${amount}&cu=INR&tn=${invoiceId}`}>
              <Smartphone className="w-4 h-4 mr-2" />
              Google Pay
            </a>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={`phonepe://upi/pay?pa=${vpa}&pn=${payeeName}&am=${amount}&cu=INR&tn=${invoiceId}`}>
              <Smartphone className="w-4 h-4 mr-2" />
              PhonePe
            </a>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={`paytmmp://upi/pay?pa=${vpa}&pn=${payeeName}&am=${amount}&cu=INR&tn=${invoiceId}`}>
              <Smartphone className="w-4 h-4 mr-2" />
              Paytm
            </a>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={upiUri}>
              <Smartphone className="w-4 h-4 mr-2" />
              Other UPI
            </a>
          </Button>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">Upload Payment Proof</h4>

          <div className="space-y-2">
            <Label htmlFor="utr">12-digit UTR / Reference ID</Label>
            <Input
              id="utr"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              disabled={uploaded || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot Receipt</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploaded || isUploading}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleUpload}
          disabled={!utr || !file || uploaded || isUploading}
        >
          {uploaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Proof Uploaded
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" /> Upload Proof
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
