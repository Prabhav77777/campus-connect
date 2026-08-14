"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTrip, getOpenRequestsForOutlet, acceptRequests } from "@/actions/trips";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";
import { formatPrice } from "@/lib/utils";

interface Outlet {
  id: string;
  name: string;
  hasFixedMenu: boolean;
  menuItems: { id: string; name: string; price: number }[];
}

export default function PostTripPage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [leavingTime, setLeavingTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetch("/api/outlets")
      .then((r) => r.json())
      .then(setOutlets)
      .catch(() => {});
  }, []);

  const handleOutletSelect = async (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setSelectedRequests([]);
    setLoadingRequests(true);
    try {
      const result = await getOpenRequestsForOutlet(outlet.id);
      if (result && "requests" in result) {
        setOpenRequests(result.requests || []);
      } else if (Array.isArray(result)) {
        setOpenRequests(result);
      } else {
        setOpenRequests([]);
      }
    } catch {
      setOpenRequests([]);
    }
    setLoadingRequests(false);
  };

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedOutlet || !leavingTime) return;
    setSubmitting(true);
    setError("");

    try {
      // Create the trip
      const now = new Date();
      const [hours, minutes] = leavingTime.split(":").map(Number);
      const leavingDate = new Date(now);
      leavingDate.setHours(hours, minutes, 0, 0);
      if (leavingDate < now) leavingDate.setDate(leavingDate.getDate() + 1);

      const tripResult = await createTrip({
        outletId: selectedOutlet.id,
        leavingTime: leavingDate.toISOString(),
        capacity: capacity ? parseInt(capacity) : undefined,
      });

      if (tripResult && "error" in tripResult) {
        setError(tripResult.error as string);
        setSubmitting(false);
        return;
      }

      // Accept selected requests if any
      if (selectedRequests.length > 0 && tripResult && "trip" in tripResult) {
        const acceptResult = await acceptRequests(
          (tripResult as any).trip.id,
          selectedRequests
        );
        if (acceptResult && "error" in acceptResult) {
          setError(acceptResult.error as string);
          setSubmitting(false);
          return;
        }
      }

      router.push("/errands");
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Post a Trip</h1>

      {/* Outlet picker */}
      <div className="space-y-3">
        <p className="text-text-muted text-sm font-medium">Where are you going?</p>
        <div className="grid grid-cols-2 gap-3">
          {outlets.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => handleOutletSelect(outlet)}
              className={`bg-surface-raised border rounded-xl p-4 text-left transition-all ${
                selectedOutlet?.id === outlet.id
                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                  : "border-border-light hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <p className="font-semibold text-text">{outlet.name}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedOutlet && (
        <>
          {/* Trip details */}
          <div className="space-y-4 bg-surface-raised rounded-xl p-4 border border-border-light">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                When are you leaving?
              </label>
              <input
                type="time"
                value={leavingTime}
                onChange={(e) => setLeavingTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                How many items can you carry? (optional)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g., 5"
                className="w-24 px-3 py-2 rounded-lg border border-border bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Open requests for this outlet */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              Open requests for {selectedOutlet.name}
            </h2>
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : openRequests.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center bg-surface-raised rounded-xl">
                No open requests for this outlet yet
              </p>
            ) : (
              <div className="space-y-2">
                {openRequests.map((req: any) => (
                  <label
                    key={req.id}
                    className={`flex items-start gap-3 bg-surface-raised border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedRequests.includes(req.id)
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border-light hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(req.id)}
                      onChange={() => toggleRequest(req.id)}
                      className="mt-1 accent-primary w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{req.itemName} {req.quantity > 1 && `×${req.quantity}`}</span>
                        <span className="font-bold text-primary text-sm">{formatPrice(req.priceEstimate * req.quantity)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="info">{req.deliverToHostel}</Badge>
                        {req.deliverToRoom && (
                          <span className="text-xs text-text-muted">Room {req.deliverToRoom}</span>
                        )}
                      </div>
                      {req.note && (
                        <p className="text-xs text-text-muted mt-1 italic">&ldquo;{req.note}&rdquo;</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-text-muted">{req.user?.name}</span>
                        <TrustScore score={req.user?.trustScore || 0} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger-light px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={!leavingTime}
            fullWidth
            size="lg"
          >
            {selectedRequests.length > 0
              ? `Post Trip & Accept ${selectedRequests.length} Request${selectedRequests.length > 1 ? "s" : ""}`
              : "Post Trip"}
          </Button>
        </>
      )}
    </div>
  );
}
