import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

export function PaymentVerificationPanel() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadInvoices() {
      // Find invoices that have payment_reference but are not PAID
      const { data } = await supabase
        .from('invoices')
        .select('*, profiles(full_name)')
        .not('payment_reference', 'is', null)
        .neq('status', 'PAID');
      setInvoices(data || []);
    }
    loadInvoices();
  }, [supabase]);

  const handleApprove = async (id: string) => {
    await supabase.from('invoices').update({ status: 'PAID' }).eq('id', id);
    setInvoices(invoices.filter(i => i.id !== id));
  };

  if (invoices.length === 0) {
    return <div className="text-sm text-slate-500">No payments pending verification.</div>;
  }

  return (
    <div className="space-y-4">
      {invoices.map(inv => (
        <div key={inv.id} className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-white dark:bg-slate-900">
          <div>
            <h4 className="font-semibold">{inv.profiles?.full_name}</h4>
            <p className="text-sm text-slate-500">Amount: ₹{inv.total_payable}</p>
            <p className="text-xs text-indigo-600 mt-1">Ref: {inv.payment_reference}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(inv.id)}>
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
