"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import {
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  SquarePen,
  X,
  UploadCloud,
  CalendarDays,
  Eye,
  Check,
  CheckCircle,
  Bell,
  MapPin,
  Settings,
  Shield,
  Download,
  Megaphone,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type SubPage = "menu" | "banners" | "notifications" | "branches" | "general" | "security" | "export";

type Banner = {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  active: boolean;
  clicks: number;
  image: string;
};

type Branch = {
  id: number;
  label: string;
  name: string;
  location: string;
  phone: string;
  email: string;
};

type NotifSetting = { id: string; label: string; description: string; on: boolean };

/* ══════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════ */
const INIT_BANNERS: Banner[] = [
  { id: 1, title: "Summer Special 30% Off", subtitle: "Hot deals on all Jollof Rice combos", ctaText: "Order Now", ctaLink: "/menu", startDate: "2026-04-01", endDate: "2026-05-31", active: true,  clicks: 1247, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=120&q=70" },
  { id: 2, title: "Spicy Wednesdays",        subtitle: "20% off all hot dishes",              ctaText: "View Deals", ctaLink: "/menu", startDate: "2026-04-15", endDate: "2026-06-15", active: true,  clicks: 867,  image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=120&q=70" },
  { id: 3, title: "Free Delivery",           subtitle: "On orders above ₦5,000",             ctaText: "Order Now", ctaLink: "/menu", startDate: "2026-03-01", endDate: "2026-04-30", active: false, clicks: 564,  image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=120&q=70" },
];

const INIT_BRANCHES: Branch[] = [
  { id: 1, label: "Branch 1", name: "Foodies 1", location: "23 Admirality Way, Lekki Phase 1", phone: "09166000666", email: "foodies@gmail.com" },
  { id: 2, label: "Branch 2", name: "Foodies 2", location: "32a Admirality Way, Lekki Phase 1", phone: "09166000777", email: "foodies@gmail.com" },
  { id: 3, label: "Branch 3", name: "Abuja",     location: "AP Filling Station, Ardova Mall, Maitama", phone: "09166000888", email: "foodies@gmail.com" },
];

const INIT_EMAIL_NOTIFS: NotifSetting[] = [
  { id: "email_orders",  label: "New Orders",    description: "Allow new orders to be sent",    on: true  },
  { id: "email_status",  label: "Order Status",  description: "Allow order status to be sent",  on: false },
  { id: "email_stock",   label: "Low Stock",     description: "Allow low stock to be sent",     on: false },
];

const INIT_SMS_NOTIFS: NotifSetting[] = [
  { id: "sms_otp",    label: "OTP",                description: "Allow OTP to be sent",                   on: true  },
  { id: "sms_status", label: "Order Status",       description: "Allow order status to be sent",           on: true  },
  { id: "sms_promo",  label: "Promotions & Offers", description: "Allow promotions & offers to be sent",   on: false },
];

const EMPTY_BANNER = { title: "", subtitle: "", ctaText: "", ctaLink: "", startDate: "", endDate: "", active: true, image: "" };

/* ══════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════ */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      suppressHydrationWarning
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? "var(--color-secondary)" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0,
      }}
    >
      <span suppressHydrationWarning style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SubHeader({ title, subtitle, onBack, action }: { title: string; subtitle: string; onBack: () => void; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", padding: "2px 0", marginTop: 2 }}>
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 560, padding: 28, display: "flex", flexDirection: "column", gap: 18, maxHeight: "92vh", overflowY: "auto" }} className="no-scrollbar">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, marginLeft: 8, flexShrink: 0 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SETTINGS MENU
══════════════════════════════════════════ */
const MENU_ITEMS: { key: SubPage; label: string; description: string; meta: string; icon: React.ElementType }[] = [
  { key: "banners",       label: "Promotions & Banners", description: "Manage carousel, schedule campaigns", meta: "3 active",   icon: Megaphone  },
  { key: "notifications", label: "Notification",         description: "Order alerts, marketing emails",      meta: "Enabled",    icon: Bell       },
  { key: "branches",      label: "Branches",             description: "Manage restaurant locations",         meta: "3 branches", icon: MapPin     },
  { key: "general",       label: "General",              description: "Business info, hours, currency, tax", meta: "₦ NGN",      icon: Settings   },
  { key: "security",      label: "Security",             description: "2FA, password policies",              meta: "2FA On",     icon: Shield     },
  { key: "export",        label: "Data Export",          description: "Export orders, customers, analytics", meta: "",           icon: Download   },
];

function SettingsMenu({ onNavigate }: { onNavigate: (p: SubPage) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
        Manage app configuration and preferences
      </p>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {MENU_ITEMS.map(({ key, label, description, meta }, i) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", border: "none", background: "none", cursor: "pointer",
              borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid var(--color-border)" : "none",
              transition: "background 0.12s", textAlign: "left",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(225,11,28,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle size={16} strokeWidth={1.8} color="var(--color-primary)" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{description}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {meta && <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{meta}</span>}
              <ChevronRight size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BANNERS SUB-PAGE
══════════════════════════════════════════ */
function BannersPage({ onBack }: { onBack: () => void }) {
  const [banners, setBanners]     = useState<Banner[]>(INIT_BANNERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm]           = useState(EMPTY_BANNER);
  const [success, setSuccess]     = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const openAdd = () => { setEditBanner(null); setForm(EMPTY_BANNER); setModalOpen(true); };
  const openEdit = (b: Banner) => {
    setEditBanner(b);
    setForm({ title: b.title, subtitle: b.subtitle, ctaText: b.ctaText, ctaLink: b.ctaLink, startDate: b.startDate, endDate: b.endDate, active: b.active, image: b.image });
    setModalOpen(true);
  };

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, image: url }));
  };

  const handleSave = () => {
    if (!form.title) return;
    if (editBanner) {
      setBanners((p) => p.map((b) => b.id === editBanner.id ? { ...b, ...form } : b));
      toast.success("Banner updated");
      setModalOpen(false);
    } else {
      setBanners((p) => [...p, { id: Date.now(), ...form, clicks: 0, image: form.image || "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=120&q=70" }]);
      setModalOpen(false);
      setSuccess(true);
    }
  };

  return (
    <>
      <SubHeader
        title="Banner Management"
        subtitle="Create and manage promotional banners"
        onBack={onBack}
        action={
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.2} /> Add Banner
          </button>
        }
      />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {banners.map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderBottom: i < banners.length - 1 ? "1px solid var(--color-border)" : "none" }}>
            {/* Thumbnail */}
            <div style={{ width: 72, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
              <Image src={b.image} alt={b.title} width={72} height={56} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{b.title}</p>
                <span className="badge" style={{ background: b.active ? "rgba(34,197,94,0.12)" : "var(--color-bg-soft)", color: b.active ? "#16a34a" : "var(--color-text-muted)" }}>
                  {b.active ? "Active" : "Offline"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{b.subtitle}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  <CalendarDays size={11} strokeWidth={1.8} />{b.startDate} - {b.endDate}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  <Eye size={11} strokeWidth={1.8} />{b.clicks.toLocaleString()} clicks
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={() => openEdit(b)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 6, borderRadius: 6 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
              >
                <SquarePen size={15} strokeWidth={1.8} />
              </button>
              <button onClick={() => { setBanners((p) => p.filter((x) => x.id !== b.id)); toast.success("Banner removed"); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 6, borderRadius: 6 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Modal */}
      {modalOpen && (
        <Modal
          title={editBanner ? "Edit Banner" : "Create Promotional Banner"}
          subtitle="Design a new banner for the app carousel"
          onClose={() => setModalOpen(false)}
        >
          {/* Image upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Banner Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `1.5px dashed ${dragOver ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: 10, padding: "24px 20px", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
                background: dragOver ? "rgba(225,11,28,0.03)" : "var(--color-bg-soft)", minHeight: 100,
              }}
            >
              {form.image
                ? <Image src={form.image} alt="Preview" width={80} height={60} style={{ borderRadius: 8, objectFit: "cover" }} />
                : <>
                    <UploadCloud size={22} strokeWidth={1.6} color="var(--color-text-muted)" />
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Click or drag to upload image</p>
                  </>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Title + Subtitle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Title",    key: "title"    as const, placeholder: "Summer Special 30% Off" },
              { label: "Subtitle", key: "subtitle" as const, placeholder: "Hot deals on all combos" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={form[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "CTA Button Text", key: "ctaText" as const, placeholder: "Order Now" },
              { label: "CTA Link",        key: "ctaLink" as const, placeholder: "/menu"      },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={form[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Start Date", key: "startDate" as const },
              { label: "End Date",   key: "endDate"   as const },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" type="date" value={form[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          {/* Activate toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Activate Banner</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Make this banner visible immediately</p>
            </div>
            <Toggle on={form.active} onToggle={() => setForm((f) => ({ ...f, active: !f.active }))} />
          </div>

          <button className="btn btn-primary" onClick={handleSave}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem" }}>
            {editBanner ? "Save Changes" : "Create Banner"}
          </button>
        </Modal>
      )}

      {/* Success Modal */}
      {success && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 340, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={24} strokeWidth={2.2} color="#16a34a" />
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>Success!</h3>
              <p style={{ margin: 0, fontSize: "0.855rem", color: "var(--color-text-muted)" }}>Banner created successfully.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setSuccess(false)}
              style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: 4 }}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   NOTIFICATIONS SUB-PAGE
══════════════════════════════════════════ */
function NotifSection({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: NotifSetting[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </p>
      {items.map((n) => (
        <div key={n.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{n.label}</p>
            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{n.description}</p>
          </div>
          <Toggle on={n.on} onToggle={() => onToggle(n.id)} />
        </div>
      ))}
    </div>
  );
}

function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState<NotifSetting[]>(INIT_EMAIL_NOTIFS);
  const [sms, setSms]     = useState<NotifSetting[]>(INIT_SMS_NOTIFS);

  const toggleEmail = (id: string) =>
    setEmail((p) => p.map((n) => n.id === id ? { ...n, on: !n.on } : n));

  const toggleSms = (id: string) =>
    setSms((p) => p.map((n) => n.id === id ? { ...n, on: !n.on } : n));

  return (
    <>
      <SubHeader title="Notification Settings" subtitle="Send messages to your customers" onBack={onBack} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <NotifSection title="Email" items={email} onToggle={toggleEmail} />
        <NotifSection title="SMS"   items={sms}   onToggle={toggleSms}   />
        <button className="btn btn-primary" onClick={() => toast.success("Notification settings saved")}
          style={{ alignSelf: "flex-start", padding: "10px 24px" }}>
          Save Settings
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   BRANCHES SUB-PAGE
══════════════════════════════════════════ */
function BranchesPage({ onBack }: { onBack: () => void }) {
  const [branches, setBranches] = useState<Branch[]>(INIT_BRANCHES);
  const [addOpen, setAddOpen]   = useState(false);
  const [pickup, setPickup]     = useState(true);
  const [newBranch, setNewBranch] = useState({ name: "", location: "", phone: "", email: "" });

  const updateBranch = (id: number, key: keyof Branch, val: string) =>
    setBranches((p) => p.map((b) => b.id === id ? { ...b, [key]: val } : b));

  return (
    <>
      <SubHeader
        title="Branch Locations"
        subtitle="Manage branch"
        onBack={onBack}
        action={
          <button className="btn btn-primary" onClick={() => setAddOpen(true)} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.2} /> Add Location
          </button>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {branches.map((b) => (
          <div key={b.id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{b.label}</p>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Location Name", key: "name"     as const },
                  { label: "Location",      key: "location" as const },
                  { label: "Phone",         key: "phone"    as const },
                  { label: "Email",         key: "email"    as const },
                ].map(({ label, key }) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>{label}</label>
                    <input className="input" value={b[key]} onChange={(e) => updateBranch(b.id, key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-primary" onClick={() => toast.success("Branch locations saved")}
          style={{ alignSelf: "flex-start", padding: "10px 24px" }}>
          Save Changes
        </button>
      </div>

      {/* Add Location Modal */}
      {addOpen && (
        <Modal title="Add New Location" subtitle="Set up a new restaurant branch" onClose={() => setAddOpen(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Location Name", key: "name"     as const, placeholder: "Lekki Main Branch" },
              { label: "Location",      key: "location" as const, placeholder: "enter address..."   },
              { label: "Phone",         key: "phone"    as const, placeholder: "enter phone number" },
              { label: "Email",         key: "email"    as const, placeholder: "enter email ..."    },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={newBranch[key]}
                  onChange={(e) => setNewBranch((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Enable Pickup</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Allow customers to pick up orders</p>
            </div>
            <Toggle on={pickup} onToggle={() => setPickup((v) => !v)} />
          </div>

          <button className="btn btn-primary"
            onClick={() => {
              if (!newBranch.name) return;
              setBranches((p) => [...p, { id: Date.now(), label: `Branch ${p.length + 1}`, ...newBranch }]);
              setAddOpen(false);
              setNewBranch({ name: "", location: "", phone: "", email: "" });
              toast.success("Location added");
            }}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem" }}>
            Add Location
          </button>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   PLACEHOLDER SUB-PAGES
══════════════════════════════════════════ */
function PlaceholderPage({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <>
      <SubHeader title={title} subtitle={subtitle} onBack={onBack} />
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Coming soon </p>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function SettingsPage() {
  const [page, setPage] = useState<SubPage>("menu");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {page === "menu"          && <SettingsMenu onNavigate={setPage} />}
      {page === "banners"       && <BannersPage onBack={() => setPage("menu")} />}
      {page === "notifications" && <NotificationsPage onBack={() => setPage("menu")} />}
      {page === "branches"      && <BranchesPage onBack={() => setPage("menu")} />}
      {page === "general"       && <PlaceholderPage title="General" subtitle="Business info, hours, currency, tax" onBack={() => setPage("menu")} />}
      {page === "security"      && <PlaceholderPage title="Security" subtitle="2FA, password policies" onBack={() => setPage("menu")} />}
      {page === "export"        && <PlaceholderPage title="Data Export" subtitle="Export orders, customers, analytics" onBack={() => setPage("menu")} />}
    </div>
  );
}