'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ClubCard from '@/components/listings/ClubCard';
import { supabase } from '@/lib/supabase';

const ITEMS_PER_PAGE = 12;

export default function SportShootingPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Active filter states
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeDisciplines, setActiveDisciplines] = useState<string[]>([]);
  const [activeFacilities, setActiveFacilities] = useState<string[]>([]);
  const [activeMemberships, setActiveMemberships] = useState<string[]>([]);
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  
  // Pending filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState('alphabetical');

  useEffect(() => {
    fetchClubs();
  }, [currentPage, activeTypes, activeDisciplines, activeFacilities, activeMemberships, activeProvinces, sortBy]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .eq('category', 'clubs-ranges');

      if (activeTypes.length > 0) query = query.in('facility_type', activeTypes);
      if (activeDisciplines.length > 0) query = query.in('disciplines', activeDisciplines);
      if (activeFacilities.length > 0) query = query.in('facilities', activeFacilities);
      if (activeMemberships.length > 0) query = query.in('membership_type', activeMemberships);
      if (activeProvinces.length > 0) query = query.in('province', activeProvinces);

      switch (sortBy) {
        case 'alphabetical': query = query.order('title', { ascending: true }); break;
        case 'recent': query = query.order('created_at', { ascending: false }); break;
        default: query = query.order('title', { ascending: true });
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setClubs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setActiveTypes(selectedTypes);
    setActiveDisciplines(selectedDisciplines);
    setActiveFacilities(selectedFacilities);
    setActiveMemberships(selectedMemberships);
    setActiveProvinces(selectedProvinces);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedDisciplines([]);
    setSelectedFacilities([]);
    setSelectedMemberships([]);
    setSelectedProvinces([]);
    setActiveTypes([]);
    setActiveDisciplines([]);
    setActiveFacilities([]);
    setActiveMemberships([]);
    setActiveProvinces([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Clubs & Ranges</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Shooting <span className="text-[#C9922A]">Club Directory</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button onClick={clearAllFilters} className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">Clear All</button>
            </div>

            {/* Province */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Province</span>
              <div className="flex flex-col gap-2.5">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedProvinces.includes(prov)}
                      onChange={() => setSelectedProvinces(prev => prev.includes(prov) ? prev.filter(p => p !== prov) : [...prev, prov])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Facility Type Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Facility Type</span>
              <div className="flex flex-col gap-2.5">
                {['Shooting Club', 'Shooting Range', 'Club with Range', 'Training Facility'].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.includes(type)}
                      onChange={() => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Disciplines Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Disciplines</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'IPSC / USPSA', 'IDPA', 'Steel Challenge', '3-Gun', 
                  'PRS (Precision Rifle)', 'Long Range', 'Benchrest', 
                  'F-Class', 'Silhouette', 'Cowboy Action', 
                  'Clay Shooting', 'Trap', 'Skeet', 'Sporting Clays',
                  'Practical Shotgun', 'Hunting', 'Casual / Recreational'
                ].map(discipline => (
                  <label key={discipline} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedDisciplines.includes(discipline)}
                      onChange={() => setSelectedDisciplines(prev => prev.includes(discipline) ? prev.filter(d => d !== discipline) : [...prev, discipline])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{discipline}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Facilities Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Facilities</span>
              <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Indoor Range', 'Outdoor Range', 'Covered Range',
                  '25m Range', '50m Range', '100m Range', '200m+ Range',
                  'Pistol Bays', 'Rifle Bays', 'Shotgun Field',
                  'Steel Targets', 'Pro Shop', 'Clubhouse'
                ].map(facility => (
                  <label key={facility} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedFacilities.includes(facility)}
                      onChange={() => setSelectedFacilities(prev => prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{facility}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Membership Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Membership</span>
              <div className="flex flex-col gap-2.5">
                {['Members Only', 'Public Welcome', 'Day Passes Available', 'Membership Required'].map(membership => (
                  <label key={membership} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedMemberships.includes(membership)}
                      onChange={() => setSelectedMemberships(prev => prev.includes(membership) ? prev.filter(m => m !== membership) : [...prev, membership])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{membership}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-[#C9922A] text-black font-bold py-3 rounded-sm uppercase text-[13px] tracking-wider hover:brightness-110 transition-all mt-2"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span className="text-[13px] text-[#8A8E99]">
              Showing <strong className="text-[#F0EDE8]">{totalCount}</strong> registered venues
            </span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] px-4 py-2 rounded-sm outline-none cursor-pointer focus:border-[#C9922A]"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="recent">Recently Active</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]"></div>
            </div>
          ) : clubs.length === 0 ? (
            <div className="bg-[#191C23] border border-white/5 rounded-md p-12 text-center">
              <p className="text-[#8A8E99] text-lg">No clubs found matching your filters.</p>
              <button 
                onClick={clearAllFilters}
                className="mt-4 text-[#C9922A] hover:underline text-sm font-semibold"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {clubs.map(club => (
                  <ClubCard key={club.id} {...club} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &lt;
                  </button>
                  
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-sm font-bold transition-all ${
                          currentPage === pageNum
                            ? 'border-[#C9922A] bg-[#C9922A]/10 text-[#C9922A]'
                            : 'border-white/10 text-[#8A8E99] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && <span className="text-[#8A8E99] px-2">...</span>}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
