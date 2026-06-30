'use client';
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./UserDashboard.module.css";
import { useUser } from "../../../hooks/useUser";
import { useRouter } from "next/navigation";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "#10b981";
    case "Inactive": return "#f50b0b";
    case "Pending": return "#f50b0b";
    case "Suspended": return "#ef4444";
    case "Verified": return "#3b82f6";
    case "In Progress": return "#f59e0b";
    case "Completed": return "#10b981";
    case "pending": return "#f50b0b";
    case "in progress": return "#f59e0b";
    case "completed": return "#10b981";
    default: return "#6b7280";
  }
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case "Active": return "rgba(16,185,129,0.1)";
    case "Inactive": return "rgba(245,11,11,0.1)";
    case "Pending": return "rgba(245,11,11,0.1)";
    case "Suspended": return "rgba(239,68,68,0.1)";
    case "Verified": return "rgba(59,130,246,0.1)";
    case "In Progress": return "rgba(246, 196, 59, 0.1)";
    case "Completed": return "rgba(16,185,129,0.1)";
    default: return "#f3f4f6";
  }
};

type User = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  status: string;
  requestStatus: string;
  userName: string;
  verified: boolean;
  leadsInitiated: string[];
};

type Lead = {
  _id: string;
  status: string;
  service: string;
  createdAt: string;
};

const StatusCard = ({ title, isActive }: { title: string, isActive: boolean }) => {
  let icon = <circle cx="12" cy="12" r="10"></circle>;
  if (title === 'In Progress') {
    icon = <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>;
  } else if (title === 'Completed') {
    icon = <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></>;
  }
  
  return (
    <div className={isActive ? styles.statCard : `${styles.statCard} ${styles.statCardInactive}`}>
      <div className={styles.statHeader}>
      <div className={`${styles.statMainValue}`} style={{ color: isActive ? getStatusColor(title.toLowerCase()) : '#6b7280' }}>
        {title}
      </div>
        <div className={styles.statIcon} style={{ background: getStatusColor(title.toLowerCase()) }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default function UserDashboard() {
  const { user, loading, setUser } = useUser() as { user: User | null, loading: boolean, setUser: (u: any) => void };
  const [activeTab, setActiveTab] = useState('Status');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [initiatedLeads, setInitiatedLeads] = useState<Lead[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!user) return;
    const [first, ...rest] = (user.userName || '').split(' ');
    setFirstName(first || '');
    setLastName(rest.join(' ') || '');
    setEmail(user.email || '');
    setPreviewUrl(user.profilePicture || null);

    if (user.leadsInitiated && user.leadsInitiated.length > 0) {
      const fetchLeads = async () => {
        try {
          const res = await fetch(`/api/lead/listByIds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: user.leadsInitiated }),
          });
          if (res.ok) {
            const data = await res.json();
            setInitiatedLeads(data.leads);
          }
        } catch (error) {
          console.error("Failed to fetch initiated leads", error);
        }
      };
      fetchLeads();
    } else {
      setInitiatedLeads([]);
    }
  }, [user]);

  useEffect(() => {
    console.log("UserDashboard mounted", { user, loading });
  }, [user, loading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/user/refresh-leads', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user); // Update user context with the latest data
      }
    } catch (error) {
      console.error("Failed to refresh leads", error);
    }
    setIsRefreshing(false);
  };
  
  if (loading) {
    return <div style={{ color: '#b40068', textAlign: 'center', marginTop: 100, fontSize: 24 }}>Loading...</div>;
  }
  if (!user) return null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.jpe?g$/i.test(file.name)) {
      setImageError('Only .jpg or .jpeg files are allowed');
      return;
    }
    if (file.size > 50 * 1024) {
      setImageError('File size must be less than 50KB');
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDirty(true);
  }

  function handleCancel() {
    if (!user) return;
    const [first, ...rest] = (user.userName || '').split(' ');
    setFirstName(first || '');
    setLastName(rest.join(' ') || '');
    setEmail(user.email || '');
    setPreviewUrl(user.profilePicture || null);
    setImageFile(null);
    setImageError('');
    setDirty(false);
  }

  function handlePencilClick() {
    fileInputRef.current?.click();
  }

  function handleRemoveImage() {
    if (user) {
      setImageFile(null);
      setPreviewUrl(user.profilePicture || null);
      setDirty(firstName !== (user.userName?.split(' ')[0] || '') || lastName !== (user.userName?.split(' ').slice(1).join(' ') || ''));
      setImageError('');
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setImageError('');
    if (imageFile && imageFile.size > 50 * 1024) {
      setImageError('File size must be less than 50KB');
      return;
    }
    const formData = new FormData();
    formData.append('userName', `${firstName} ${lastName}`.trim());
    formData.append('email', email);
    if (imageFile) formData.append('profilePicture', imageFile);
    const res = await fetch('/api/user/update-profile', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      setImageError('Failed to update profile');
    } else {
      setDirty(false);
      // Optionally show success or refresh user data
    }
  }

  async function handleLogout() {
    await fetch('/api/user/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/');
  }

  return (
    <div className={styles.dashboard}>
      <button className={styles.sidebarToggle} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.profileSection}>
          <div className={styles.profileIcon} >
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" style={{ width: 54, height: 54,  borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24"  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" fill="#b40068" /><path fill="#b40068" d="M5.5 21v-2A4.5 4.5 0 0 1 10 14h4a4.5 4.5 0 0 1 4.5 4.5v2"/></svg>
            )}
          </div>
          <div className={styles.profileName} style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{user.userName}</div>
          <div className={styles.profileEmail} style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>{user.email}</div>
          <div className={styles.profileButtons}>
            <Link href="/" className={styles.profileBtn} target="_self" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Home
            </Link>
            <button className={`${styles.profileBtn} ${styles.logoutBtn}`} onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </div>
        <nav className={styles.nav}>
          {[ 'Status', 'My Profile' ].map(tab => (
            <button
              key={tab}
              className={`${styles.navItem} ${activeTab === tab ? styles.active : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "Status" ? "Service Status" : tab}
            </button>
          ))}
        </nav>
        <div className={styles.closeSpace} style={{display: isSidebarOpen ? 'block' : 'none'}} onClick={() => setIsSidebarOpen(false)}></div>
      </div>
      <div className={styles.content} >
        {activeTab === "Status" && (
          <>
            <div className={styles.statusStatSection} style={{ marginBottom: 0}}>
                {/* Header and stats remain unchanged */}
               <div className={styles.leadsHeader} style={{paddingLeft: isMobile ? '10px' : 'auto'}}>
                  <div className={styles.headerLeft}>
                    <h2>Account Status</h2>
                    <p>Track and view the current status of your Account and Requests.</p>
                  </div>
                </div>
                <div className={styles.statsContainer} style={{flexDirection: isMobile ? 'column' : 'row', paddingLeft: isMobile ? '10px' : 'auto', paddingRight: isMobile ? '10px' : 'auto'}}>
                {/* Card 1: PROFILE STATUS */}
                <div className={ styles.statCard} >
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>PROFILE STATUS</span>
                    <div className={styles.statIcon + ' ' + styles.statIconGreen} style={{display: 'flex'}}>
                      <svg width="20" height="20" className={styles.statIconSvg} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="16 8 11 13 8 10"/>
                      </svg>
                    </div>
                  </div>
                  <div className={ `${styles.statMainValue} ${styles.statMainValueActive}` }>{user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}</div>
                  
                </div>
                {/* Card 2: VERIFICATION */}
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>VERIFICATION</span>
                    <div className={styles.statIcon} style={{ background: '#3b82f6', display: 'flex' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className={styles.statIconSvg} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="16 8 11 13 8 10"/>
                        <path d="M4.93 4.93a10 10 0 0 1 14.14 0"></path>
                        <path d="M19.07 19.07a10 10 0 0 1-14.14 0"></path>
                      </svg>
                    </div>
                  </div>
                  <div className={ `${styles.statMainValue} ${styles.statMainValueVerified}` }>{user.verified ? 'Verified' : 'Unverified'}</div>
                  
                </div>
              </div>
            </div>
            
            <hr style={{ color: 'rgb(206, 0, 69)', height: 1, width: isMobile ? '86%' : '96%', marginLeft: 'auto', marginRight: 'auto' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
              <h2 className={styles.statusStatSection} style={{   fontSize: 32, fontWeight: 700, color: '#1e293b', marginLeft: isMobile ? '16px' : '20px', marginBottom: 0 }}>Your requested services</h2>
              <button onClick={handleRefresh} disabled={isRefreshing} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', cursor: isRefreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', alignSelf: isMobile ? 'flex-start' : 'auto', gap: '8px', opacity: isRefreshing ? 0.6 : 1, marginLeft: isMobile ? '40px' : 'auto' }}>
                <span style={{ fontWeight: 600, fontSize: 24, color: isRefreshing ? '#1a1a1a/50' : '#1a1a1a', marginTop: '-4px' }}>⟲</span>                
                <span style={{ fontWeight: 500, color: isRefreshing ? '#1a1a1a/50' : '#1a1a1a' }}>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            {initiatedLeads.length > 0 ? (
              [...initiatedLeads].reverse().map((lead, index) => (
                <div key={lead._id} className={styles.statusStatSection} style={{ paddingTop: 0 }}>
                  <div className={styles.leadsHeader}>
                    <div className={styles.headerLeft}>
                      <h2>Request for service : {lead.service}</h2>
                      <p>Service {lead.service} requested on {new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={styles.statsContainer}>
                    <StatusCard title="Pending" isActive={lead.status === 'pending'} />
                    <StatusCard title="In Progress" isActive={lead.status === 'in progress'} />
                    <StatusCard title="Completed" isActive={lead.status === 'completed'} />
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.statusStatSection} style={{ paddingTop: 0 }}>
                <div className={styles.leadsHeader}>
                  <div className={styles.headerLeft}>
                    <h2>No service was requested yet.</h2>
                    <p>Please signin and request a service - click the button below.</p>
                    <button className={styles.newLeadBtn} style={{color: "white", backgroundColor: "#b40068", border: "none", marginTop: 10}} onClick={() => router.push('/contact')}>Contact Us</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === "My Profile" && (
          <div className={styles.leadsContainer} style={{ minHeight: 'calc(100vh - 120px)', background: 'inherit', boxShadow: 'none', border: 'none', padding: 0 }}>
            {/* Header and stats remain unchanged */}
            <div className={`${styles.leadsHeader} ${styles.leadsHeaderProfile}`}>
              <div className={styles.headerLeft}>
                <h2>My Profile</h2>
                <p>Update your personal information and profile picture.</p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'center',
              alignItems: 'stretch',
              width: '100%',
              minHeight: 'calc(100vh - 365px)',
              background: 'inherit',
              margin: '0',
              padding: '0 0 0 0',
              boxShadow: 'none',
              border: 'none',
            }}>
              {/* Left: Avatar and Basic Info */}
              <div style={{
                flex: isMobile ? '1' : '0 0 340px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '0 0 0 0',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #b40068 0%, #a0005e 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 80,
                  fontWeight: 700,
                  marginBottom: 32,
                  marginTop: 32,
                  border: '5px solid #e1e3e6',
                  boxShadow: '0 2px 8px rgba(180,0,104,0.08)',
                  position: 'relative',
                }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2A4.5 4.5 0 0 1 10 14h4a4.5 4.5 0 0 1 4.5 4.5v2"/></svg>
                  )}
                  {/* Pencil or X Button Overlay */}
                  {imageFile ? (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2px solid rgb(180,0,104)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(180,0,104,0.08)',
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                      aria-label="Remove selected image"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b40068" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePencilClick}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2px solid rgb(180,0,104)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(180,0,104,0.08)',
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                      aria-label="Change profile picture"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b40068" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 2 21l1.5-5L16.5 3.5z" />
                      </svg>
                    </button>
                  )}
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    id="profilePicture"
                    name="profilePicture"
                    type="file"
                    accept=".jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
                {/* Name and Verified */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 32, color: '#1e293b' }}>{user.userName}</span>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                </div>
                <div style={{ color: '#64748b', fontSize: 20, fontWeight: 500, marginBottom: 12 }}>{user.email}</div>
                {/* Show image error below avatar if any */}
                {imageError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>{imageError}</div>}
              </div>
              {/* Divider */}
              {!isMobile && <div style={{ width: 2, background: '#e5e7eb', margin: '48px 0' }} />}
              {/* Right: Details */}
              <div style={{ flex: 1, padding: isMobile ? '2rem 1rem' : '48px 48px 0 40px', display: 'flex', flexDirection: 'column', gap: 28, justifyContent: 'center', fontFamily: 'inherit' }}>
                <form className={styles.profileForm} onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 18, margin: '0 auto', background: 'white', borderRadius: 12, padding: 40, boxShadow: 'none' }}>
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" style={{ fontWeight: 500, color: '#374151', fontSize: 15 }}>First Name</label>
                    <input id="firstName" name="firstName" type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setDirty(true); }} className={styles.input} required style={{ width: '100%', marginTop: 6, marginBottom: 0 }} />
                  </div>
                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" style={{ fontWeight: 500, color: '#374151', fontSize: 15 }}>Last Name</label>
                    <input id="lastName" name="lastName" type="text" value={lastName} onChange={e => { setLastName(e.target.value); setDirty(true); }} className={styles.input} required style={{ width: '100%', marginTop: 6, marginBottom: 0 }} />
                  </div>
                  {/* Email (block, not editable, styled like a field) */}
                  <div>
                    <label htmlFor="email" style={{ fontWeight: 500, color: '#374151', fontSize: 15 }}>Email</label>
                    <div className={styles.input} style={{ width: '100%', marginTop: 6, marginBottom: 0, background: '#f3f4f6', color: '#64748b', cursor: 'not-allowed', border: '1px solid #e5e7eb' }}>{email}</div>
                  </div>
                  {/* File Upload (hidden, handled by pencil button) - removed visible input */}
                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="submit" className={styles.saveBtn} style={{ maxWidth:120, flex: 1, padding: '12px 0', background: dirty ? '#b40068' : '#e5e7eb', color: dirty ? 'white' : '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: dirty ? 'pointer' : 'not-allowed', transition: 'all 0.2s', margin: 0, }} disabled={!dirty}>Save</button>
                    <button type="button" className={styles.cancelBtn} style={{ maxWidth:120,  flex: 1, background: '#f3f4f6', color: '#64748b', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer', margin: 0 }} onClick={handleCancel}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
