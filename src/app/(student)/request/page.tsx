"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/actions/requests";
import { Button } from "@/components/ui/Button";
import { HOSTELS } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Outlet {
  id: string;
  name: string;
  hasFixedMenu: boolean;
  menuItems: MenuItem[];
}

export default function PostRequestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [step, setStep] = useState(1);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [customItem, setCustomItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceEstimate, setPriceEstimate] = useState(0);
  const [deliverToHostel, setDeliverToHostel] = useState("");
  const [deliverToRoom, setDeliverToRoom] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/outlets")
      .then((r) => r.json())
      .then(setOutlets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.user?.hostel) {
      setDeliverToHostel(session.user.hostel);
    }
  }, [session]);

  const handleOutletSelect = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setSelectedItem("");
    setCustomItem("");
    setPriceEstimate(0);
    setQuantity(1);
    setStep(2);
  };

  const handleMenuItemSelect = (item: MenuItem) => {
    setSelectedItem(item.name);
    setPriceEstimate(item.price);
  };

  const handleSubmit = async () => {
    if (!selectedOutlet) return;
    setSubmitting(true);
    setError("");

    const itemName = selectedOutlet.hasFixedMenu ? selectedItem : customItem;
    if (!itemName.trim()) {
      setError("Please select or enter an item");
      setSubmitting(false);
      return;
    }
    if (priceEstimate <= 0) {
      setError("Please enter a valid price");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createRequest({
        outletId: selectedOutlet.id,
        itemName,
        quantity,
        priceEstimate,
        deliverToHostel,
        deliverToRoom: deliverToRoom || undefined,
        note: note || undefined,
      });

      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Post a Request</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s
                  ? "bg-primary text-white"
                  : "bg-secondary text-text-muted"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Outlet picker */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-text-muted text-sm">Pick an outlet</p>
          <div className="grid grid-cols-2 gap-3">
            {outlets.map((outlet) => (
              <button
                key={outlet.id}
                onClick={() => handleOutletSelect(outlet)}
                className="bg-surface-raised border border-border-light rounded-xl p-4 text-left hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <p className="font-semibold text-text group-hover:text-primary transition-colors">
                  {outlet.name}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {outlet.hasFixedMenu
                    ? `${outlet.menuItems.length} items`
                    : "Free-text order"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Item selection */}
      {step === 2 && selectedOutlet && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(1)}
              className="text-text-muted hover:text-text transition-colors"
            >
              ← Back
            </button>
            <span className="text-sm font-medium text-primary">
              {selectedOutlet.name}
            </span>
          </div>

          {selectedOutlet.hasFixedMenu ? (
            <div className="space-y-2">
              <p className="text-text-muted text-sm">Select an item</p>
              {selectedOutlet.menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemSelect(item)}
                  className={`w-full bg-surface-raised border rounded-xl p-4 text-left transition-all ${
                    selectedItem === item.name
                      ? "border-primary shadow-md ring-2 ring-primary/20"
                      : "border-border-light hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-bold text-primary">₹{item.price}</span>
                  </div>
                </button>
              ))}
              {selectedItem && (
                <div className="pt-2">
                  <label className="block text-sm text-text-muted mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 rounded-lg border border-border bg-surface-raised text-center focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <p className="text-sm text-text-muted mt-2">
                    Total: <span className="font-bold text-primary">₹{priceEstimate * quantity}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">
                {selectedOutlet.name === "Main Gate"
                  ? "Describe what's waiting at the gate"
                  : "Describe what you need"}
              </p>
              <textarea
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                placeholder="e.g., a Parle-G packet and a bottle of water"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-raised focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px] resize-none"
              />
              <div>
                <label className="block text-sm text-text-muted mb-1">
                  Estimated price (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={priceEstimate || ""}
                  onChange={(e) => setPriceEstimate(parseInt(e.target.value) || 0)}
                  placeholder="50"
                  className="w-32 px-3 py-2 rounded-lg border border-border bg-surface-raised focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {(selectedItem || customItem) && (
            <Button onClick={() => setStep(3)} fullWidth>
              Continue →
            </Button>
          )}
        </div>
      )}

      {/* Step 3: Delivery details */}
      {step === 3 && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(2)}
            className="text-text-muted hover:text-text transition-colors text-sm"
          >
            ← Back
          </button>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Deliver to hostel
            </label>
            <select
              value={deliverToHostel}
              onChange={(e) => setDeliverToHostel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-raised focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {HOSTELS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Room number (optional)
            </label>
            <input
              type="text"
              value={deliverToRoom}
              onChange={(e) => setDeliverToRoom(e.target.value)}
              placeholder="e.g., 204"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-raised focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Any special instructions..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-raised focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px] resize-none"
            />
            <p className="text-xs text-text-light mt-1">{note.length}/200</p>
          </div>

          {/* Summary card */}
          <div className="bg-primary-light rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm text-primary-dark">Order Summary</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-text-muted">From:</span> {selectedOutlet?.name}</p>
              <p><span className="text-text-muted">Item:</span> {selectedOutlet?.hasFixedMenu ? selectedItem : customItem} {quantity > 1 && `×${quantity}`}</p>
              <p><span className="text-text-muted">Total:</span> <span className="font-bold">₹{priceEstimate * quantity}</span></p>
              <p><span className="text-text-muted">Deliver to:</span> {deliverToHostel} {deliverToRoom && `Room ${deliverToRoom}`}</p>
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger-light px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button onClick={handleSubmit} isLoading={submitting} fullWidth size="lg">
            Post Request
          </Button>
        </div>
      )}
    </div>
  );
}
