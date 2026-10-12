import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { calculateElectricitySplit } from '@/lib/services/electricity-billing';

export function SubMeterEntryModal({ onClose }: { onClose: () => void }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [previousReading, setPreviousReading] = useState(0);
  const [currentReading, setCurrentReading] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('8.5'); // Default rate
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('rooms').select('*');
      setRooms(data || []);
    }
    loadData();
  }, [supabase]);

  // Load previous reading when room changes
  useEffect(() => {
    async function loadPreviousReading() {
      if (!selectedRoom) return;
      // Get the latest reading for this room
      const { data } = await supabase
        .from('meter_readings')
        .select('current_reading')
        .eq('room_id', selectedRoom)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setPreviousReading(Number(data[0].current_reading));
      } else {
        setPreviousReading(0);
      }
    }
    loadPreviousReading();
  }, [selectedRoom, supabase]);

  const handleSubmit = async () => {
    if (!selectedRoom || !currentReading) return;

    // 1. Calculate active occupants
    const { data: beds } = await supabase
      .from('beds')
      .select('*, bookings(*)')
      .eq('room_id', selectedRoom)
      .eq('is_occupied', true);

    const activeOccupants = beds?.length || 0;

    // 2. Perform calculation
    const current = Number(currentReading);
    const rate = Number(ratePerUnit);

    const split = calculateElectricitySplit(previousReading, current, rate, activeOccupants);

    if (split.requiresManualReview) {
      alert("Current reading is less than previous reading. Manual review required.");
      return;
    }

    // 3. Save reading
    const room = rooms.find(r => r.id === selectedRoom);

    const { data: reading } = await supabase.from('meter_readings').insert({
      tenant_id: room.tenant_id,
      room_id: selectedRoom,
      previous_reading: previousReading,
      current_reading: current,
      rate_per_unit: rate,
      total_cost: split.totalRoomCost,
      split_count: activeOccupants,
      per_head_amount: split.perBedShare
    }).select().single();

    // 4. Append to active invoices for occupants
    if (activeOccupants > 0 && beds) {
      for (const bed of beds) {
        const residentId = bed.bookings?.[0]?.resident_id;
        if (!residentId) continue;

        // Find active invoice
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, total_payable, add_ons_total')
          .eq('resident_id', residentId)
          .neq('status', 'PAID')
          .limit(1);

        if (invoices && invoices.length > 0) {
          const inv = invoices[0];

          // Add invoice item
          await supabase.from('invoice_items').insert({
            invoice_id: inv.id,
            description: `Electricity Share (${split.unitsConsumed} units / ${activeOccupants})`,
            amount: split.perBedShare,
            item_type: 'SERVICE_ADDON'
          });

          // Update invoice totals
          await supabase.from('invoices').update({
            add_ons_total: Number(inv.add_ons_total || 0) + split.perBedShare,
            total_payable: Number(inv.total_payable || 0) + split.perBedShare
          }).eq('id', inv.id);
        }
      }
    }

    alert('Meter reading saved and electricity charges applied successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-bold">Sub-Meter Entry</h2>
        <div className="space-y-4">
          <div>
            <Label>Room</Label>
            <select className="w-full rounded-md border p-2" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
              <option value="">Select Room...</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>Room {r.room_number}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Previous Reading</Label>
            <Input type="number" disabled value={previousReading} className="bg-slate-100" />
          </div>
          <div>
            <Label>Current Reading</Label>
            <Input type="number" value={currentReading} onChange={(e) => setCurrentReading(e.target.value)} />
          </div>
          <div>
            <Label>Rate Per Unit (₹)</Label>
            <Input type="number" step="0.1" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save & Split</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
