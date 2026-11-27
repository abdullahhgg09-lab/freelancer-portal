import React, { useState, useRef } from 'react';
import { usePortal } from '../context/PortalContext';
import { avatarFreelancerProImg, avatarClientExecImg } from '../assets/images';
import {
  User,
  Camera,
  Upload,
  Check,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Layers,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface UserProfilePageProps {
  onBack: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onBack }) => {
  const { currentUser, updateUserProfile, currency, setIsDebitModalOpen, setSelectedPlanForPayment } = usePortal();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [company, setCompany] = useState(currentUser?.company || '');
  const [bio, setBio] = useState(currentUser?.bio || 'Full-Stack Freelance Professional & UI/UX Specialist');
  const [address, setAddress] = useState(currentUser?.address || 'Lahore, Pakistan');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [headline, setHeadline] = useState(currentUser?.headline || 'Full-Stack Freelancer & Digital Specialist');
  const [category, setCategory] = useState(currentUser?.category || 'Web Development');
  const [skillsText, setSkillsText] = useState(
    currentUser?.skills?.join(', ') || 'React, TypeScript, UI/UX Design, Client Portal'
  );
  const [hourlyRatePkr, setHourlyRatePkr] = useState<number>(currentUser?.hourlyRatePkr || 3500);
  const [availability, setAvailability] = useState<'available' | 'busy' | 'unavailable'>(
    currentUser?.availability || 'available'
  );
  const [isListedInDirectory, setIsListedInDirectory] = useState<boolean>(
    currentUser?.isListedInDirectory !== false
  );

  const [savedNotification, setSavedNotification] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preset avatar choices for quick 1-click selection
  const avatarPresets = [
    avatarFreelancerProImg,
    avatarClientExecImg,
  ];

  // Handle local file upload (converts to base64 so it works anywhere without external host!)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Please upload an image smaller than 5MB.');
      setTimeout(() => setUploadError(null), 3500);
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      updateUserProfile({ avatarUrl: base64 });
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateUserProfile({
      name,
      username,
      email,
      phone,
      company,
      bio,
      address,
      avatarUrl,
      headline: headline.trim(),
      category,
      skills: parsedSkills,
      hourlyRatePkr: Number(hourlyRatePkr) || 3500,
      availability,
      isListedInDirectory,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </button>

        {savedNotification && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile and picture updated successfully!</span>
          </div>
        )}
        {uploadError && (
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Profile Hero Header */}
        <div className="h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 flex justify-end items-start relative">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
              Role: {currentUser?.role || 'User'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 font-mono">
              Plan: {currentUser?.plan || 'PRO'}
            </span>
          </div>
        </div>

        {/* Avatar & Basic Info Bar */}
        <div className="px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-6">
            
            {/* Avatar Circle with Upload Trigger */}
            <div className="relative group">
              <img
                src={avatarUrl || avatarFreelancerProImg}
                alt={name}
                className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-slate-100"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-3xl bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 cursor-pointer"
                title="Change Profile Photo"
              >
                <Camera className="w-5 h-5" />
                <span>Upload</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 sm:pl-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{name || 'Your Name'}</h1>
              <p className="text-xs text-slate-500 font-mono">@{username || 'username'} • {email}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForPayment('pro');
                  setIsDebitModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade with Debit Card</span>
              </button>
            </div>
          </div>

          {/* Picture Selector / Presets Section */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Change Profile Picture</h3>
                <p className="text-[11px] text-slate-500">
                  Apne computer ya mobile se apni picture upload karein ya neeche diye gaye presets mein se select karein.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Image from Device</span>
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="flex items-center gap-3 pt-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-slate-400">Quick Presets:</span>
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(preset);
                    updateUserProfile({ avatarUrl: preset });
                  }}
                  className={`relative rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                    avatarUrl === preset ? 'border-indigo-600 ring-2 ring-indigo-600/30' : 'border-transparent hover:scale-105'
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx}`} className="w-10 h-10 object-cover" />
                  {avatarUrl === preset && (
                    <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setAvatarUrl('');
                  updateUserProfile({ avatarUrl: '' });
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 text-[11px] font-medium"
              >
                Remove Photo
              </button>
            </div>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Studio Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Digital Studio"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Lahore, Pakistan"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Professional Bio &amp; Headline</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your freelance services or client role..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {(currentUser?.role === 'freelancer' || currentUser?.role === 'admin') && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm">
                      Public Find-Freelancers Directory Listing
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Clients search karte waqt aap ki specialty, skills aur hourly rate dekh kar hire kar sakte hain.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isListedInDirectory}
                      onChange={(e) => setIsListedInDirectory(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Show in Directory</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prof-headline" className="block font-semibold text-slate-700 mb-1">Service Headline</label>
                    <input
                      id="prof-headline"
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Senior React & Next.js Developer"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-category" className="block font-semibold text-slate-700 mb-1">Primary Category</label>
                    <select
                      id="prof-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Branding">Branding</option>
                      <option value="SaaS Architecture">SaaS Architecture</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="prof-rate" className="block font-semibold text-slate-700 mb-1">Hourly Rate (PKR)</label>
                    <input
                      id="prof-rate"
                      type="number"
                      min={500}
                      value={hourlyRatePkr}
                      onChange={(e) => setHourlyRatePkr(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-availability" className="block font-semibold text-slate-700 mb-1">Availability</label>
                    <select
                      id="prof-availability"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as 'available' | 'busy' | 'unavailable')}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="available">Available Now</option>
                      <option value="busy">In Active Sprint (Limited)</option>
                      <option value="unavailable">Booked / Unavailable</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="prof-skills" className="block font-semibold text-slate-700 mb-1">Skills (comma separated)</label>
                  <input
                    id="prof-skills"
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g. React, TypeScript, Figma, Node.js"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                All profile updates sync instantly to your invoices, projects, and avatar headers.
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
              >
                Save Profile Changes
              </button>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
};
