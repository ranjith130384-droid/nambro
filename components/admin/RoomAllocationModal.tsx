import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export function RoomAllocationModal({ onClose }: { onClose: () => void }) {
  const [beds, setBeds] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedBed, setSelectedBed] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [stayType, setStayType] = useState('MONTHLY');
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: b } = await supabase.from('beds').select('*, room:rooms(*)').eq('is_occupied', false);
      setBeds(b || []);
      const { data: p } = await supabase.from('profiles').select('*').eq('role', 'RESIDENT');
      setProfiles(p || []);
    }
    loadData();
  }, [supabase]);

  const handleAllocate = async () => {
    if (!selectedBed || !selectedProfile) return;

    const bed = beds.find(b => b.id === selectedBed);
    const profile = profiles.find(p => p.id === selectedProfile);
    if (!bed || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const baseRent = stayType === 'MONTHLY' ? bed.room.base_rent_monthly : bed.room.base_rent_weekly;

    // 1. Create booking
    const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
      tenant_id: profile.tenant_id,
      resident_id: profile.id,
      bed_id: bed.id,
      stay_type: stayType,
      start_date: today,
      fixed_base_rent: baseRent,
      security_deposit: baseRent * 2,
      status: 'ACTIVE'
    }).select().single();

    if (bookingError || !booking) {
      console.error(bookingError);
      alert('Error creating booking');
      return;
    }

    // 2. Mark bed occupied
    await supabase.from('beds').update({ is_occupied: true }).eq('id', bed.id);

    // 3. Generate cycle invoice (using RPC)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await supabase.rpc('generate_cycle_invoice', {
      p_tenant_id: profile.tenant_id,
      p_booking_id: booking.id,
      p_resident_id: profile.id,
      p_cycle_start: today,
      p_cycle_end: endDate.toISOString().split('T')[0],
      p_base_rent: baseRent,
      p_add_ons_total: 0,
      p_total_payable: baseRent + (baseRent * 2) // rent + deposit
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-bold">Allocate Room & Bed</h2>
        <div className="space-y-4">
          <div>
            <Label>Resident</Label>
            <select className="w-full rounded-md border p-2" value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)}>
              <option value="">Select Resident...</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Available Bed</Label>
            <select className="w-full rounded-md border p-2" value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)}>
              <option value="">Select Bed...</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>Room {b.room?.room_number} - Bed {b.bed_label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Stay Type</Label>
            <select className="w-full rounded-md border p-2" value={stayType} onChange={(e) => setStayType(e.target.value)}>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAllocate}>Allocate & Invoice</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
