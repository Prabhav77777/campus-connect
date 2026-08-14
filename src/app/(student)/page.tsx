"use client";

import { useState, useEffect, useCallback } from "react";
import { getOpenRequests } from "@/actions/requests";
import { getActiveTrips } from "@/actions/trips";
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import { TrustScore } from "@/components/ui/TrustScore";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

type TabType = "requests" | "trips";

interface Outlet {
  id: string;
  name: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filterOutlet, setFilterOutlet] = useState("");
  const [filterHostel, setFilterHostel] = useState("");
  const [loading, setLoading] = useState(true);

  const hostels = ["H1", "H2", "Old Boys Hostel", "Girls Hostel", "Guest House"];

  const fetchOutlets = useCallback(async () => {
    try {
      const res = await fetch("/api/outlets");
      const data = await res.json();
      setOutlets(data);
    } catch { /* ignore */ }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOpenRequests(
        filterOutlet || undefined,
        filterHostel || undefined
      );
      if (result && "requests" in result) {
        setRequests(result.requests || []);
      } else if (Array.isArray(result)) {
        setRequests(result);
      }
    } catch { setRequests([]); }
    setLoading(false);
  }, [filterOutlet, filterHostel]);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getActiveTrips();
      if (result && "trips" in result) {
        setTrips(result.trips || []);
      } else if (Array.isArray(result)) {
        setTrips(result);
      }
    } catch { setTrips([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  useEffect(() => {
    if (activeTab === "requests") fetchRequests();
    else fetchTrips();
  }, [activeTab, fetchRequests, fetchTrips]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-surface-raised rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "requests"
              ? "bg-primary text-white shadow-md"
              : "text-text-muted hover:text-text"
          }`}
        >
          Open Requests
        </button>
        <button
          onClick={() => setActiveTab("trips")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "trips"
              ? "bg-primary text-white shadow-md"
              : "text-text-muted hover:text-text"
          }`}
        >
          Active Trips
        </button>
      </div>

      {activeTab === "requests" && (
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterOutlet}
            onChange={(e) => setFilterOutlet(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-raised border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">All Outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <select
            value={filterHostel}
            onChange={(e) => setFilterHostel(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-raised border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">All Hostels</option>
            {hostels.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "requests" ? (
        requests.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">No open requests right now</p>
            <p className="text-sm mt-1">Be the first to post one!</p>
            <Link
              href="/request"
              className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Post a Request
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.map((req: any) => (
              <div
                key={req.id}
                className="bg-surface-raised rounded-xl p-4 shadow-sm border border-border-light hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-text">
                      {req.itemName} {req.quantity > 1 && `×${req.quantity}`}
                    </h3>
                    <p className="text-sm text-text-muted">{req.outlet?.name}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(req.priceEstimate * req.quantity)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <Badge variant="info">{req.deliverToHostel}</Badge>
                  {req.note && (
                    <span className="text-xs text-text-muted italic truncate max-w-32">
                      &ldquo;{req.note}&rdquo;
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-text-muted">
                      {req.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm text-text-muted">{req.user?.name}</span>
                    <TrustScore score={req.user?.trustScore || 0} />
                  </div>
                  <span className="text-xs text-text-light">
                    {formatRelativeTime(req.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : trips.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-3">🚶</p>
          <p className="font-medium">No active trips right now</p>
          <p className="text-sm mt-1">Heading somewhere? Post a trip!</p>
          <Link
            href="/trip"
            className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Post a Trip
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {trips.map((trip: any) => (
            <div
              key={trip.id}
              className="bg-surface-raised rounded-xl p-4 shadow-sm border border-border-light hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-text">{trip.outlet?.name}</h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-sm text-text-muted">
                Leaving at{" "}
                <span className="font-medium text-text">
                  {new Date(trip.leavingTime).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </p>
              {trip.capacity && (
                <p className="text-sm text-text-muted mt-1">
                  Can carry: <span className="font-medium text-text">{trip.capacity} items</span>
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold">
                    {trip.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm text-text-muted">{trip.user?.name}</span>
                  <TrustScore score={trip.user?.trustScore || 0} />
                </div>
                <span className="text-xs text-text-light">
                  {formatRelativeTime(trip.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
