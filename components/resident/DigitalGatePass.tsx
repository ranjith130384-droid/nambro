'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateGatePassToken } from '@/lib/services/gate-pass';
import { Timer } from 'lucide-react';

export function DigitalGatePass({ residentId }: { residentId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [token, setToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const refreshToken = () => {
      const newToken = generateGatePassToken(residentId);
      setToken(newToken);
      setTimeLeft(60);

      const payload = JSON.stringify({ residentId, token: newToken, timestamp: Date.now() });

      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, payload, {
          width: 250,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
      }
    };

    refreshToken();

    const interval = setInterval(refreshToken, 60000);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [residentId]);

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden">
      <CardHeader className="bg-indigo-600 text-white pb-6">
        <CardTitle>Digital Gate Pass</CardTitle>
        <CardDescription className="text-indigo-100">Scan at the security desk to exit or enter.</CardDescription>
      </CardHeader>
      <CardContent className="-mt-4 p-6 bg-white rounded-t-2xl relative flex flex-col items-center">
        <div className="absolute top-4 right-4 flex items-center space-x-1 text-sm font-medium text-slate-500">
          <Timer className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>

        <div className="mt-8 border-4 border-indigo-50 p-2 rounded-xl inline-block">
          <canvas ref={canvasRef}></canvas>
        </div>

        <div className="mt-6 flex flex-col items-center space-y-2 text-center">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Dynamic Token</span>
          <Badge variant="secondary" className="text-lg tracking-widest font-mono">
            {token.substring(0, 3)} {token.substring(3)}
          </Badge>
          <span className="text-xs text-red-500 font-medium">Never share this code. Screenshots are blocked.</span>
        </div>
      </CardContent>
    </Card>
  );
}
