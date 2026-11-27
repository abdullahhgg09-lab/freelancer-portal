import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { FreelancerProfileSummary } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  Search,
  MessageSquare,
  Send,
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  ArrowRight,
  Copy,
  Check,
  UserPlus
} from 'lucide-react';

interface FindFreelancersViewProps {
  onOpenAuth?: () => void;
  onNavigateView?: (view: string) => void;
  compactHeader?: boolean;
}

const CATEGORIES = [
  'All',
  'Web Development',
  'Mobile App',
  'UI/UX Design',
  'Branding',
  'SaaS Architecture',
];

export const FindFreelancersView: React.FC<FindFreelancersViewProps> = ({
  onOpenAuth,
  onNavigateView,
  compactHeader = false,
}) => {
  const {
    currentUser,
    directoryFreelancers,
    currency,
    startInquiryChatWithFreelancer,
    addClient,
    addProject,
    switchRole,
    openProjectChat,
  } = usePortal();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Targeted Hire Modal state
  const [hiringFreelancer, setHiringFreelancer] = useState<FreelancerProfileSummary | null>(null);
  const [clientFullName, setClientFullName] = useState(currentUser?.role === 'client' ? currentUser.name : '');
  const [clientCompany, setClientCompany] = useState(currentUser?.company || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.role === 'client' ? currentUser.email : '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || '');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectBudget, setProjectBudget] = useState(120000);
  const [projectBrief, setProjectBrief] = useState('');
  const [submittedLink, setSubmittedLink] = useState<string | null>(null);
  const [createdProjId, setCreatedProjId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!hiringFreelancer) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHiringFreelancer(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hiringFreelancer]);

  const filteredFreelancers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return directoryFreelancers.filter((f) => {
      if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
      if (availableOnly && f.availability !== 'available') return false;
      if (!q) return true;
      const haystack = [
        f.name,
        f.headline,
        f.category,
        f.company || '',
        f.address || '',
        f.bio || '',
        ...f.skills,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [directoryFreelancers, searchQuery, selectedCategory, availableOnly]);

  const openTargetedHire = (freelancer: FreelancerProfileSummary) => {
    setSubmittedLink(null);
    setCreatedProjId(null);
    setProjectTitle('');
    setProjectBrief('');
    setProjectBudget(Math.max(25000, freelancer.hourlyRatePkr * 25));
    if (currentUser?.role === 'client') {
      setClientFullName(currentUser.name);
      setClientEmail(currentUser.email);
      setClientCompany(currentUser.company || '');
      setClientPhone(currentUser.phone || '');
    }
    setHiringFreelancer(freelancer);
  };

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiringFreelancer) return;

    const clientUserId =
      currentUser?.role === 'client' ? currentUser.id : `user-client-${Date.now()}`;

    if (currentUser?.role !== 'client') {
      addClient({
        userId: clientUserId,
        name: clientFullName.trim(),
        email: clientEmail.trim().toLowerCase(),
        company: clientCompany.trim() || 'Direct Client',
        phone: clientPhone.trim(),
        freelancerId: hiringFreelancer.id,
        status: 'active',
      });
    }

    const newProj = addProject({
      name: projectTitle.trim(),
      freelancerId: hiringFreelancer.id,
      freelancerName: hiringFreelancer.name,
      clientId: clientUserId,
      clientName: `${clientFullName.trim()}${clientCompany.trim() ? ` (${clientCompany.trim()})` : ''}`,
      budget: Number(projectBudget),
      currency: 'PKR',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      description: projectBrief.trim(),
      progress: 10,
      status: 'pending',
      category: hiringFreelancer.category,
      tasks: [
        { id: 't-1', title: 'Project Brief Review & Scope Alignment', completed: true },
        { id: 't-2', title: 'Initial Concept & Milestone Plan', completed: false },
        { id: 't-3', title: 'Core Build & Deliverables', completed: false },
        { id: 't-4', title: 'Final Review & Sign-Off', completed: false },
      ],
    });

    const magicLink = `${window.location.origin}/?view=client&projId=${newProj.id}`;
    setSubmittedLink(magicLink);
    setCreatedProjId(newProj.id);
    if (currentUser?.role !== 'client') {
      switchRole('client', clientUserId);
    }
  };

  const handleCopyLink = () => {
    if (!submittedLink) return;
    navigator.clipboard.writeText(submittedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDirectMessage = (freelancer: FreelancerProfileSummary) => {
    startInquiryChatWithFreelancer(freelancer);
  };

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      {!compactHeader && (
        <div className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">
              Talent Directory
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Find Verified Freelancers &amp; Start Collaborating Directly
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Skills, category, aur availability ke mutabiq freelancer talash karein — seedha project brief bhejein ya real-time chat room mein sawal poochein.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentUser?.role === 'freelancer' || currentUser?.role === 'admin' ? (
              <button
                type="button"
                onClick={() => onNavigateView && onNavigateView('profile')}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-indigo-50 text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                <span>Update My Directory Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (onOpenAuth ? onOpenAuth() : undefined)}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-indigo-50 text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                <span>Join as Freelancer</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search freelancers by name, skill (React, Figma, Node.js), or specialty..."
              aria-label="Search freelancers by name, skill, or specialty"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden text-xs sm:text-sm text-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={() => setAvailableOnly((prev) => !prev)}
            aria-pressed={availableOnly}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              availableOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Available Now Only</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div role="group" aria-label="Filter by specialization category" className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredFreelancers.length} {filteredFreelancers.length === 1 ? 'freelancer' : 'freelancers'} listed
          </span>
        </div>
      </div>

      {/* Freelancer Directory Grid */}
      {filteredFreelancers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base">No Matching Freelancers Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try clearing your search filter or register a new freelancer account to get listed in the talent directory.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setAvailableOnly(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Reset Filters
            </button>
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Register as Freelancer
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFreelancers.map((freelancer) => {
            const showFallbackAvatar = !freelancer.avatarUrl || failedImages[freelancer.id];
            const initials = freelancer.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <motion.article
                key={freelancer.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="flex items-start gap-3.5">
                    {showFallbackAvatar ? (
                      <div
                        aria-hidden="true"
                        className="w-12 h-12 rounded-xl bg-slate-900 text-white font-display font-bold text-sm flex items-center justify-center shrink-0"
                      >
                        {initials || 'FP'}
                      </div>
                    ) : (
                      <img
                        src={freelancer.avatarUrl}
                        alt={`Portrait of ${freelancer.name}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [freelancer.id]: true }))
                        }
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-base text-slate-950 truncate">
                        {freelancer.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-700 truncate">
                        {freelancer.headline}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                        <span>{freelancer.category}</span>
                        {freelancer.address && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" aria-hidden="true" />
                              {freelancer.address}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {freelancer.bio}
                  </p>

                  {/* Unboxed Skills Metadata */}
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Skills: </span>
                    <span>{freelancer.skills.join(' · ')}</span>
                  </div>
                </div>

                {/* Metrics + Actions */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Hourly Rate</span>
                      <span className="font-mono font-bold text-slate-950 tabular-nums">
                        {formatCurrency(freelancer.hourlyRatePkr, currency)}
                        <span className="text-[11px] font-sans font-normal text-slate-500"> / hr</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Availability</span>
                      {freelancer.availability === 'available' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Available</span>
                        </span>
                      ) : freelancer.availability === 'busy' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>In Sprint</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Booked</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectMessage(freelancer)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openTargetedHire(freelancer)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Hire Freelancer</span>
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Targeted Hire & Project Brief Modal */}
      <AnimatePresence>
        {hiringFreelancer && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 md:p-6">
            <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.16 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="hire-specific-title"
                className="relative bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
              >
                <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                  <div>
                    <h3 id="hire-specific-title" className="font-display font-bold text-sm sm:text-base text-white">
                      Hire {hiringFreelancer.name}
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      {hiringFreelancer.headline} · {hiringFreelancer.category}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setHiringFreelancer(null)}
                    aria-label="Close hire dialog"
                    className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                  {submittedLink ? (
                    <div className="text-center py-4 space-y-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-bold text-slate-900">
                          Project Sent to {hiringFreelancer.name}!
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Aap ka project create ho gaya hai aur direct {hiringFreelancer.name} ke workspace mein assign ho chuka hai.
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left">
                        <div className="text-[11px] font-semibold text-slate-600">Private Client Portal Link:</div>
                        <div className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                          {submittedLink}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                          </button>
                          {createdProjId && (
                            <button
                              type="button"
                              onClick={() => {
                                setHiringFreelancer(null);
                                if (onNavigateView) onNavigateView('client');
                                openProjectChat(createdProjId);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Start Chat Now</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setHiringFreelancer(null);
                              if (onNavigateView) onNavigateView('client');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <span>Open Client Portal</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleHireSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="dir-client-name" className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                          <input
                            id="dir-client-name"
                            type="text"
                            required
                            placeholder="e.g. Asad Malik"
                            value={clientFullName}
                            onChange={(e) => setClientFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="dir-client-company" className="block font-semibold text-slate-700 mb-1">Company / Brand</label>
                          <input
                            id="dir-client-company"
                            type="text"
                            placeholder="e.g. PeakStudio Media"
                            value={clientCompany}
                            onChange={(e) => setClientCompany(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="dir-client-email" className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                          <input
                            id="dir-client-email"
                            type="email"
                            required
                            placeholder="client@company.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="dir-client-phone" className="block font-semibold text-slate-700 mb-1">WhatsApp / Phone</label>
                          <input
                            id="dir-client-phone"
                            type="text"
                            placeholder="+92 300 1234567"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="dir-project-title" className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                          <input
                            id="dir-project-title"
                            type="text"
                            required
                            placeholder="e.g. SaaS Web App Launch"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="dir-project-budget" className="block font-semibold text-slate-700 mb-1">Estimated Budget (PKR) *</label>
                          <input
                            id="dir-project-budget"
                            type="number"
                            required
                            min={1000}
                            value={projectBudget}
                            onChange={(e) => setProjectBudget(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="dir-project-brief" className="block font-semibold text-slate-700 mb-1">Project Requirements *</label>
                        <textarea
                          id="dir-project-brief"
                          rows={4}
                          required
                          placeholder={`Describe what you'd like ${hiringFreelancer.name} to build...`}
                          value={projectBrief}
                          onChange={(e) => setProjectBrief(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>Send Brief &amp; Assign to {hiringFreelancer.name}</span>
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
