"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  getMatchDetail,
  confirmMatch,
  rejectMatch,
  markPurchased,
  verifyOtp,
  flagMatch,
} from "@/actions/matches";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { OtpInput } from "@/components/ui/OtpInput";
import { TrustScore } from "@/components/ui/TrustScore";
import { formatPrice, getStatusLabel } from "@/lib/utils";

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [showFlagConfirm, setShowFlagConfirm] = useState(false);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const result = await getMatchDetail(matchId);
      if (result && "match" in result) {
        setMatch(result.match);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const isRequester = match?.request?.userId === session?.user?.id;
  const isRunner = match?.trip?.userId === session?.user?.id;

  const handleConfirm = async () => {
    setActionLoading(true);
    await confirmMatch(matchId);
    await fetchMatch();
    setActionLoading(false);
  };

  const handleReject = async () => {
    setActionLoading(true);
    await rejectMatch(matchId);
    router.push("/errands");
  };

  const handleMarkPurchased = async () => {
    setActionLoading(true);
    await markPurchased(matchId);
    await fetchMatch();
    setActionLoading(false);
  };

  const handleVerifyOtp = async (otp: string) => {
    setOtpError("");
    setActionLoading(true);
    const result = await verifyOtp(matchId, otp);
    if (result && "error" in result) {
      setOtpError(result.error as string);
    } else {
      await fetchMatch();
    }
    setActionLoading(false);
  };

  const handleFlag = async () => {
    setActionLoading(true);
    await flagMatch(matchId);
    await fetchMatch();
    setActionLoading(false);
    setShowFlagConfirm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-3xl mb-2">🔍</p>
        <p className="font-medium">Match not found</p>
      </div>
    );
  }

  const statusIndex = ["PENDING", "CONFIRMED", "PURCHASED", "DELIVERED_SETTLED"].indexOf(match.status);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => router.push("/errands")}
        className="text-text-muted hover:text-text transition-colors text-sm"
      >
        ← Back to Errands
      </button>

      <div className="bg-surface-raised rounded-xl p-5 border border-border-light shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">
              {match.request.itemName} {match.request.quantity > 1 && `×${match.request.quantity}`}
            </h1>
            <p className="text-text-muted">{match.request.outlet?.name || match.trip.outlet?.name}</p>
          </div>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(match.request.priceEstimate * match.request.quantity)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted text-xs mb-1">Requester</p>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{match.request.user?.name}</span>
              <TrustScore score={match.request.user?.trustScore || 0} />
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {match.request.deliverToHostel}
              {match.request.deliverToRoom && `, Room ${match.request.deliverToRoom}`}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-xs mb-1">Runner</p>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{match.trip.user?.name}</span>
              <TrustScore score={match.trip.user?.trustScore || 0} />
            </div>
          </div>
        </div>

        {match.request.note && (
          <div className="mt-4 bg-warning-light rounded-lg px-3 py-2 text-sm">
            <span className="text-text-muted">Note:</span> {match.request.note}
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <StatusTimeline currentStatus={match.status} />

      {/* Actions based on role and status */}
      <div className="space-y-4">
        {/* REQUESTER: PENDING → Confirm / Reject */}
        {isRequester && match.status === "PENDING" && (
          <div className="bg-surface-raised rounded-xl p-5 border border-border-light space-y-3">
            <p className="text-sm text-text-muted">
              <strong>{match.trip.user?.name}</strong> wants to pick up your item. Confirm this match?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirm} isLoading={actionLoading} fullWidth>
                Confirm Match
              </Button>
              <Button
                onClick={handleReject}
                variant="danger"
                isLoading={actionLoading}
                fullWidth
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* REQUESTER: CONFIRMED → Waiting */}
        {isRequester && match.status === "CONFIRMED" && (
          <div className="bg-accent-light rounded-xl p-5 text-center">
            <p className="text-sm text-text-muted">
              Waiting for <strong>{match.trip.user?.name}</strong> to purchase your item...
            </p>
          </div>
        )}

        {/* REQUESTER: PURCHASED → Enter OTP */}
        {isRequester && match.status === "PURCHASED" && (
          <div className="bg-surface-raised rounded-xl p-5 border border-border-light space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg">Enter OTP</h3>
              <p className="text-sm text-text-muted mt-1">
                Your item has been purchased. Enter the OTP that{" "}
                <strong>{match.trip.user?.name}</strong> tells you after you pay.
              </p>
            </div>
            <OtpInput
              length={4}
              onComplete={handleVerifyOtp}
              error={otpError}
            />
            {otpError && (
              <p className="text-danger text-sm text-center">{otpError}</p>
            )}
            <div className="border-t border-border-light pt-3">
              {!showFlagConfirm ? (
                <button
                  onClick={() => setShowFlagConfirm(true)}
                  className="text-sm text-danger hover:text-red-700 transition-colors w-full text-center"
                >
                  ⚠ Flag as unresolved
                </button>
              ) : (
                <div className="bg-danger-light rounded-lg p-3 space-y-2">
                  <p className="text-sm text-danger font-medium">
                    Are you sure? This will flag the match and affect trust scores.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleFlag}
                      isLoading={actionLoading}
                    >
                      Yes, flag it
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowFlagConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RUNNER: PENDING → Waiting for confirmation */}
        {isRunner && match.status === "PENDING" && (
          <div className="bg-warning-light rounded-xl p-5 text-center">
            <p className="text-sm text-text-muted">
              Waiting for <strong>{match.request.user?.name}</strong> to confirm this match...
            </p>
          </div>
        )}

        {/* RUNNER: CONFIRMED → Mark as Purchased */}
        {isRunner && match.status === "CONFIRMED" && (
          <div className="bg-surface-raised rounded-xl p-5 border border-border-light space-y-3">
            <p className="text-sm text-text-muted">
              Match confirmed! Buy the item and mark it as purchased.
            </p>
            <Button
              onClick={handleMarkPurchased}
              isLoading={actionLoading}
              variant="success"
              fullWidth
              size="lg"
            >
              ✓ Mark as Purchased
            </Button>
          </div>
        )}

        {/* RUNNER: PURCHASED → Show OTP */}
        {isRunner && match.status === "PURCHASED" && (
          <div className="bg-surface-raised rounded-xl p-5 border border-border-light space-y-4">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-3">Your verification OTP</p>
              <div className="flex justify-center gap-3">
                {match.otp?.split("").map((digit: string, i: number) => (
                  <div
                    key={i}
                    className="w-14 h-16 bg-accent-light border-2 border-accent rounded-xl flex items-center justify-center text-2xl font-bold text-accent"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-danger-light border border-danger/20 rounded-xl p-4">
              <p className="text-sm text-danger font-semibold flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>
                  Only tell this OTP to the requester <strong>after you have received the money in hand</strong>.
                  Do not share it before payment.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* DELIVERED & SETTLED — Both users */}
        {match.status === "DELIVERED_SETTLED" && (
          <div className="bg-accent-light rounded-xl p-6 text-center space-y-2">
            <p className="text-4xl">✅</p>
            <h3 className="font-bold text-lg text-accent">Delivered & Settled!</h3>
            <p className="text-sm text-text-muted">
              {isRunner
                ? "You earned +1 trust score. Great job!"
                : "Transaction complete. Thank you!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
