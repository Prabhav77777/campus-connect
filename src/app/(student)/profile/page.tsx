"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { TrustScore } from "@/components/ui/TrustScore";
import { Badge } from "@/components/ui/Badge";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/profile`)
        .then((r) => r.json())
        .then((data) => {
          setUser(data);
          setName(data.name || "");
          setRoomNumber(data.roomNumber || "");
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session?.user?.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roomNumber }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      {/* Avatar + Trust */}
      <div className="bg-surface-raised rounded-xl p-6 border border-border-light shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3">
          {(user?.name || session?.user?.name)?.[0]?.toUpperCase() || "?"}
        </div>
        <h2 className="text-xl font-bold">{user?.name || session?.user?.name}</h2>
        <p className="text-text-muted text-sm">{user?.email || session?.user?.email}</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <Badge variant="info">{user?.hostel || (session?.user as any)?.hostel}</Badge>
          {user?.roomNumber && (
            <span className="text-sm text-text-muted">Room {user.roomNumber}</span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-text-muted">Trust Score:</span>
          <TrustScore score={user?.trustScore || 0} size="lg" />
        </div>
        {user?.redFlagged && (
          <div className="mt-3 bg-danger-light text-danger rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5">
            🚩 Red Flagged
            <span className="text-xs font-normal text-text-muted">
              — unresolved handoffs
            </span>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border-light space-y-4">
        <h3 className="font-semibold">Edit Profile</h3>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Room Number</label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g., 204"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} isLoading={saving}>
            Save Changes
          </Button>
          {saved && <span className="text-sm text-accent font-medium">✓ Saved!</span>}
        </div>
      </div>

      {/* Sign out */}
      <Button
        variant="ghost"
        fullWidth
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-danger hover:bg-danger-light"
      >
        Sign Out
      </Button>
    </div>
  );
}
