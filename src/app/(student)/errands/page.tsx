"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  getMyMatches,
  confirmMatch,
  rejectMatch,
  markPurchased,
  verifyOtp,
} from "@/actions/matches";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TrustScore } from "@/components/ui/TrustScore";
import { OtpInput } from "@/components/ui/OtpInput";
import { Modal } from "@/components/ui/Modal";
import { getStatusLabel, formatRelativeTime, formatPrice } from "@/lib/utils";
import Link from "next/link";

export default function ErrandsPage() {
  const { data: session } = useSession();
  const [asRunner, setAsRunner] = useState<any[]>([]);
  const [asRequester, setAsRequester] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"runner" | "requester">("requester");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // OTP Modal State for Requester
  const [otpModalMatch, setOtpModalMatch] = useState<any | null>(null);
  const [otpError, setOtpError] = useState("");

  const fetchMatches = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const result = await getMyMatches(session.user.id);
      if (result && "asRequester" in result) {
        setAsRequester(result.asRequester || []);
        setAsRunner(result.asTripGoer || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleConfirm = async (matchId: string) => {
    setActionLoading(matchId);
    await confirmMatch(matchId);
    await fetchMatches();
    setActionLoading(null);
  };

  const handleReject = async (matchId: string) => {
    setActionLoading(matchId);
    await rejectMatch(matchId);
    await fetchMatches();
    setActionLoading(null);
  };

  const handleMarkPurchased = async (matchId: string) => {
    setActionLoading(matchId);
    await markPurchased(matchId);
    await fetchMatches();
    setActionLoading(null);
  };

  const handleVerifyOtpSubmit = async (otp: string) => {
    if (!otpModalMatch) return;
    setOtpError("");
    setActionLoading(otpModalMatch.id);
    const result = await verifyOtp(otpModalMatch.id, otp);
    if (result && "error" in result) {
      setOtpError(result.error as string);
    } else {
      setOtpModalMatch(null);
      await fetchMatches();
    }
    setActionLoading(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING": return "warning" as const;
      case "CONFIRMED": return "info" as const;
      case "PURCHASED": return "success" as const;
      case "DELIVERED_SETTLED": return "success" as const;
      default: return "default" as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">My Errands</h1>

      <div className="flex items-center gap-1 bg-surface-raised rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab("requester")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "requester"
              ? "bg-primary text-white shadow-md"
              : "text-text-muted hover:text-text"
          }`}
        >
          My Requests ({asRequester.length})
        </button>
        <button
          onClick={() => setActiveTab("runner")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "runner"
              ? "bg-primary text-white shadow-md"
              : "text-text-muted hover:text-text"
          }`}
        >
          As Runner ({asRunner.length})
        </button>
      </div>

      {activeTab === "requester" ? (
        asRequester.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium">No requests matched yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {asRequester.map((match: any) => (
              <div
                key={match.id}
                className="bg-surface-raised rounded-xl p-4 border border-border-light shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{match.request.itemName} {match.request.quantity > 1 && `×${match.request.quantity}`}</h3>
                    <p className="text-sm text-text-muted">{match.request.outlet?.name}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(match.status)}>
                    {getStatusLabel(match.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Runner:</span>
                    <span className="font-medium">{match.trip?.user?.name}</span>
                    <TrustScore score={match.trip?.user?.trustScore || 0} />
                  </div>
                  <span className="font-bold text-primary">
                    {formatPrice(match.request.priceEstimate * match.request.quantity)}
                  </span>
                </div>

                {/* Status: PENDING */}
                {match.status === "PENDING" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border-light">
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleConfirm(match.id)}
                      isLoading={actionLoading === match.id}
                    >
                      Confirm Match
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      fullWidth
                      onClick={() => handleReject(match.id)}
                      isLoading={actionLoading === match.id}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {/* Status: CONFIRMED */}
                {match.status === "CONFIRMED" && (
                  <div className="mt-3 p-3 bg-accent-light text-accent rounded-lg text-sm text-center font-medium">
                    ⏳ Match confirmed! Waiting for {match.trip?.user?.name} to buy the item...
                  </div>
                )}

                {/* Status: PURCHASED (Item Bought!) */}
                {match.status === "PURCHASED" && (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-primary-light text-primary-dark rounded-lg text-sm text-center font-medium">
                      🛍️ Item bought! Hand over cash to {match.trip?.user?.name} and enter the OTP they tell you.
                    </div>
                    <Button
                      size="md"
                      fullWidth
                      onClick={() => {
                        setOtpError("");
                        setOtpModalMatch(match);
                      }}
                    >
                      🔑 Receive Item & Enter OTP
                    </Button>
                  </div>
                )}

                {/* Status: DELIVERED_SETTLED */}
                {match.status === "DELIVERED_SETTLED" && (
                  <div className="mt-3 p-2.5 bg-accent-light text-accent rounded-lg text-sm text-center font-bold">
                    ✅ Delivered & Settled
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 text-xs text-text-light">
                  <span>{formatRelativeTime(match.createdAt)}</span>
                  <Link href={`/errands/${match.id}`} className="text-primary hover:underline font-medium">
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : asRunner.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-3xl mb-2">🏃</p>
          <p className="font-medium">No trips to run yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {asRunner.map((match: any) => (
            <div
              key={match.id}
              className="bg-surface-raised rounded-xl p-4 border border-border-light shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{match.request.itemName} {match.request.quantity > 1 && `×${match.request.quantity}`}</h3>
                  <p className="text-sm text-text-muted">{match.request.outlet?.name}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(match.status)}>
                  {getStatusLabel(match.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-sm my-2">
                <Badge variant="info">Deliver to {match.request.deliverToHostel}</Badge>
                {match.request.deliverToRoom && (
                  <span className="text-xs text-text-muted">Room {match.request.deliverToRoom}</span>
                )}
                <span className="text-sm font-bold text-primary ml-auto">
                  {formatPrice(match.request.priceEstimate * match.request.quantity)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <span className="text-xs">Requester:</span>
                <span className="font-medium text-text">{match.request.user?.name}</span>
                <TrustScore score={match.request.user?.trustScore || 0} />
              </div>

              {/* Runner Status: PENDING */}
              {match.status === "PENDING" && (
                <div className="mt-3 p-3 bg-warning-light text-text-muted rounded-lg text-sm text-center">
                  ⏳ Waiting for {match.request.user?.name} to confirm the match...
                </div>
              )}

              {/* Runner Status: CONFIRMED */}
              {match.status === "CONFIRMED" && (
                <div className="mt-3">
                  <Button
                    size="md"
                    variant="success"
                    fullWidth
                    onClick={() => handleMarkPurchased(match.id)}
                    isLoading={actionLoading === match.id}
                  >
                    🛍️ Mark as Bought / Purchased
                  </Button>
                </div>
              )}

              {/* Runner Status: PURCHASED (Shows OTP to Runner) */}
              {match.status === "PURCHASED" && (
                <div className="mt-3 bg-surface border border-accent/30 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-semibold text-text-muted">Your Verification OTP to tell Requester:</p>
                  <div className="flex justify-center gap-2">
                    {match.otp?.split("").map((digit: string, i: number) => (
                      <span
                        key={i}
                        className="w-10 h-12 bg-accent-light border border-accent text-accent font-bold text-xl rounded-lg flex items-center justify-center"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-danger font-medium bg-danger-light p-2 rounded-lg">
                    ⚠️ Tell this OTP to {match.request.user?.name} ONLY after receiving cash payment!
                  </p>
                </div>
              )}

              {/* Runner Status: DELIVERED_SETTLED */}
              {match.status === "DELIVERED_SETTLED" && (
                <div className="mt-3 p-2.5 bg-accent-light text-accent rounded-lg text-sm text-center font-bold">
                  ✅ Delivered & Settled (+1 Trust Earned)
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-2 text-xs text-text-light border-t border-border-light">
                <span>{formatRelativeTime(match.createdAt)}</span>
                <Link href={`/errands/${match.id}`} className="text-primary hover:underline font-medium">
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Verification Modal for Requester */}
      {otpModalMatch && (
        <Modal
          isOpen={true}
          onClose={() => {
            setOtpModalMatch(null);
            setOtpError("");
          }}
          title="Receive Item & Verify OTP"
        >
          <div className="space-y-4 text-center">
            <p className="text-sm text-text-muted">
              Pay <strong>{formatPrice(otpModalMatch.request.priceEstimate * otpModalMatch.request.quantity)}</strong> in cash to{" "}
              <strong>{otpModalMatch.trip?.user?.name}</strong>, then enter the 4-digit OTP they give you:
            </p>
            <OtpInput
              length={4}
              onComplete={handleVerifyOtpSubmit}
              error={otpError}
            />
            {otpError && (
              <p className="text-danger text-sm font-medium">{otpError}</p>
            )}
            {actionLoading === otpModalMatch.id && (
              <p className="text-xs text-primary font-medium">Verifying OTP...</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
