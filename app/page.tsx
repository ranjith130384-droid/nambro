'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/dictionaries';
import { UpiPaymentCard } from '@/components/payments/UpiPaymentCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Utensils, ShieldCheck, Globe, Bed, Wrench, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomAllocationModal } from '@/components/admin/RoomAllocationModal';
import { PaymentVerificationPanel } from '@/components/admin/PaymentVerificationPanel';
import { SubMeterEntryModal } from '@/components/admin/SubMeterEntryModal';

export default function Home() {
  const { t, locale, changeLocale, formatCurrency } = useTranslation();
  const [activeTab, setActiveTab] = useState<'admin' | 'resident'>('admin');
  const [showRoomAllocation, setShowRoomAllocation] = useState(false);
  const [showSubMeter, setShowSubMeter] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    meals: { veg: 0, nonVeg: 0, skipped: 0 },
    collections: { total: 0, collected: 0, overdueCount: 0 }
  });

  const [residentData, setResidentData] = useState<{
    profile: any;
    booking: any;
    bed: any;
    room: any;
    invoice: any;
    mealLog: any;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch Beds
      const { data: bedsData } = await supabase.from('beds').select('is_occupied');
      const totalBeds = bedsData?.length || 0;
      const occupiedBeds = bedsData?.filter(b => b.is_occupied).length || 0;

      // Fetch Meals for today
      const today = new Date().toISOString().split('T')[0];
      const { data: mealsData } = await supabase
        .from('meal_daily_logs')
        .select('diet_override')
        .eq('date', today);

      const meals = { veg: 0, nonVeg: 0, skipped: 0 };
      mealsData?.forEach(m => {
        if (m.diet_override === 'VEG') meals.veg++;
        else if (m.diet_override === 'NON_VEG') meals.nonVeg++;
        else if (m.diet_override === 'SKIP') meals.skipped++;
      });

      // Fetch Invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('total_payable, status');

      const collections = { total: 0, collected: 0, overdueCount: 0 };
      invoicesData?.forEach(inv => {
        collections.total += Number(inv.total_payable);
        if (inv.status === 'PAID') {
          collections.collected += Number(inv.total_payable);
        } else if (inv.status === 'OVERDUE') {
          collections.overdueCount++;
        }
      });

      setDashboardData({
        totalBeds,
        occupiedBeds,
        meals,
        collections
      });
    }

    if (activeTab === 'admin') {
      fetchDashboardData();
    }
  }, [activeTab, supabase]);

  useEffect(() => {
    async function fetchResidentData() {
      // In a real app we would get the auth user ID here,
      // but for this MVP, we fetch the first resident profile
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'RESIDENT').limit(1);
      if (!profiles || profiles.length === 0) return;
      const profile = profiles[0];

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('resident_id', profile.id)
        .eq('status', 'ACTIVE')
        .limit(1);
      const booking = bookings?.[0];

      let bed, room;
      if (booking?.bed_id) {
        const { data: beds } = await supabase.from('beds').select('*').eq('id', booking.bed_id).single();
        bed = beds;
        if (bed?.room_id) {
          const { data: rooms } = await supabase.from('rooms').select('*').eq('id', bed.room_id).single();
          room = rooms;
        }
      }

      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('resident_id', profile.id)
        .in('status', ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'])
        .order('due_date', { ascending: true })
        .limit(1);
      const invoice = invoices?.[0];

      const today = new Date().toISOString().split('T')[0];
      const { data: mealLogs } = await supabase
        .from('meal_daily_logs')
        .select('*')
        .eq('resident_id', profile.id)
        .eq('date', today)
        .limit(1);
      const mealLog = mealLogs?.[0];

      setResidentData({ profile, booking, bed, room, invoice, mealLog });
    }

    if (activeTab === 'resident') {
      fetchResidentData();
    }
  }, [activeTab, supabase]);

  const toggleMealPreference = async (pref: 'VEG' | 'NON_VEG' | 'SKIP') => {
    if (!residentData?.profile) return;
    const today = new Date().toISOString().split('T')[0];

    if (residentData.mealLog) {
      await supabase
        .from('meal_daily_logs')
        .update({ diet_override: pref })
        .eq('id', residentData.mealLog.id);
    } else {
      await supabase
        .from('meal_daily_logs')
        .insert({
          tenant_id: residentData.profile.tenant_id,
          resident_id: residentData.profile.id,
          date: today,
          diet_override: pref
        });
    }

    // Refresh resident data
    const { data: mealLogs } = await supabase
      .from('meal_daily_logs')
      .select('*')
      .eq('resident_id', residentData.profile.id)
      .eq('date', today)
      .limit(1);

    setResidentData({ ...residentData, mealLog: mealLogs?.[0] });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">StayMen PG</h1>
              <p className="text-xs text-slate-500">Enterprise Multi-Tenant PG Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="hidden sm:flex rounded-lg border bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setActiveTab('admin')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeTab === 'admin' ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600'
                }`}
              >
                Owner Portal
              </button>
              <button
                onClick={() => setActiveTab('resident')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeTab === 'resident' ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600'
                }`}
              >
                Resident View
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 shadow-sm dark:bg-slate-800">
              <Globe className="h-4 w-4 text-slate-500" />
              <select
                value={locale}
                onChange={(e) => changeLocale(e.target.value as Locale)}
                className="bg-transparent text-xs font-semibold focus:outline-none"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिन्दी (HI)</option>
                <option value="ta">தமிழ் (TA)</option>
                <option value="ml">മലയാളം (ML)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === 'admin' ? (
          <div className="space-y-8">
            <div className="flex gap-4 pb-4">
              <Button onClick={() => setShowRoomAllocation(true)} className="bg-indigo-600 hover:bg-indigo-700">Allocate Room</Button>
              <Button onClick={() => setShowSubMeter(true)} variant="outline">Enter Meter Reading</Button>
            </div>

            {showRoomAllocation && <RoomAllocationModal onClose={() => setShowRoomAllocation(false)} />}
            {showSubMeter && <SubMeterEntryModal onClose={() => setShowSubMeter(false)} />}

            {/* Stat Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('dashboard.roomMatrix')}</CardDescription>
                  <CardTitle className="text-2xl font-bold">{dashboardData.occupiedBeds} / {dashboardData.totalBeds} Beds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-emerald-600">{dashboardData.occupiedBeds} {t('dashboard.occupied')}</Badge>
                    <Badge variant="secondary">{dashboardData.totalBeds - dashboardData.occupiedBeds} {t('dashboard.available')}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('dashboard.messCounter')}</CardDescription>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-indigo-500" /> Today's Dinner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                      {dashboardData.meals.veg} {t('dashboard.veg')}
                    </Badge>
                    <Badge variant="outline" className="text-rose-700 border-rose-300">
                      {dashboardData.meals.nonVeg} {t('dashboard.nonVeg')}
                    </Badge>
                    <Badge variant="outline" className="text-slate-500">
                      {dashboardData.meals.skipped} {t('dashboard.skipped')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Collections</CardDescription>
                  <CardTitle className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(dashboardData.collections.total)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">
                    {dashboardData.collections.total > 0 ? Math.round((dashboardData.collections.collected / dashboardData.collections.total) * 100) : 0}% Collected • {dashboardData.collections.overdueCount} Overdue Invoices
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Verification Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Payment Verifications</CardTitle>
                <CardDescription>Review and approve pending payments.</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentVerificationPanel />
              </CardContent>
            </Card>

            {/* Visual Bed Matrix Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-indigo-600" /> Visual Room & Bed Matrix
                </CardTitle>
                <CardDescription>Real-time occupancy across floors and room tiers (AC / Non-AC).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {[101, 102, 103, 104, 201, 202, 203, 204, 301, 302, 303, 304].map((room) => (
                    <div key={room} className="rounded-lg border p-3 bg-white dark:bg-slate-900 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Room {room}</span>
                        <Badge variant="outline" className="text-[10px]">AC</Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="h-4 w-4 rounded-full bg-emerald-500" title="Bed A Occupied" />
                        <span className="h-4 w-4 rounded-full bg-emerald-500" title="Bed B Occupied" />
                        <span className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700" title="Bed C Vacant" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Resident Self-Service Portal View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Resident Pass */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" /> {t('portal.identityPass')}
                </CardTitle>
                <CardDescription>Verified resident identity card & room credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-indigo-100">Resident</p>
                      <h3 className="text-xl font-bold">{residentData?.profile?.full_name || 'Loading...'}</h3>
                      <p className="text-xs text-indigo-100">{residentData?.profile?.phone || 'Loading...'}</p>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                      {residentData?.profile?.kyc_status === 'VERIFIED' ? 'KYC Verified' : 'KYC Pending'}
                    </Badge>
                  </div>
                  <div className="mt-6 flex justify-between text-xs border-t border-white/20 pt-4">
                    <div>
                      <span className="text-indigo-200">Room / Bed</span>
                      <p className="font-semibold text-base">
                        {residentData?.room?.room_number ? `Room ${residentData.room.room_number}` : 'No Room'} •
                        {residentData?.bed?.bed_label ? `Bed ${residentData.bed.bed_label}` : 'No Bed'}
                      </p>
                    </div>
                    <div>
                      <span className="text-indigo-200">{t('portal.checkInDate')}</span>
                      <p className="font-semibold">{residentData?.booking?.start_date || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-2">Today's Meal Preference</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={residentData?.mealLog?.diet_override === 'VEG' ? 'default' : 'outline'}
                      onClick={() => toggleMealPreference('VEG')}
                      className={`flex-1 ${residentData?.mealLog?.diet_override === 'VEG' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                      Veg
                    </Button>
                    <Button
                      variant={residentData?.mealLog?.diet_override === 'NON_VEG' ? 'default' : 'outline'}
                      onClick={() => toggleMealPreference('NON_VEG')}
                      className={`flex-1 ${residentData?.mealLog?.diet_override === 'NON_VEG' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                    >
                      Non-Veg
                    </Button>
                    <Button
                      variant={residentData?.mealLog?.diet_override === 'SKIP' ? 'default' : 'outline'}
                      onClick={() => toggleMealPreference('SKIP')}
                      className={`flex-1 ${residentData?.mealLog?.diet_override === 'SKIP' ? 'bg-slate-600 hover:bg-slate-700' : ''}`}
                    >
                      Skip
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-600" /> {t('portal.maintenance')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instant 1-Tap UPI Payment Card */}
            <div>
              {residentData?.invoice ? (
                <UpiPaymentCard
                  vpa="staymen@icici"
                  payeeName="StayMen Mens Hostel"
                  amount={residentData.invoice.total_payable}
                  invoiceId={residentData.invoice.id}
                  transactionRef={`TXN-${Date.now()}`}
                  onUploadProof={async (utr, file) => {
                    alert(`Payment proof uploaded successfully! UTR: ${utr}, File: ${file.name}`);
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Ledger</CardTitle>
                    <CardDescription>No pending payments at this time.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
