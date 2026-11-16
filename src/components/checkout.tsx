"use client";
import { useState } from "react";
import Script from "next/script";
declare global {
  interface Window {
    Cashfree: (config: { mode: "sandbox" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget: "_self";
      }) => Promise<unknown>;
    };
  }
}
export function Checkout({
  productId,
  price,
  ready,
  existingOrder,
}: {
  productId: string;
  price: number;
  ready: boolean;
  existingOrder?: string;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sdk, setSdk] = useState(false);
  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onReady={() => setSdk(true)}
        onError={() =>
          setError("Unable to load checkout. Check your connection and retry.")
        }
      />
      <div className="notice">
        Sandbox only. No real money is collected.{" "}
        {ready
          ? "Use Cashfree sandbox payment details."
          : "Checkout is waiting for the merchant’s Cashfree sandbox credentials."}
      </div>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            const fd = new FormData(e.currentTarget);
            let id = existingOrder;
            if (!id) {
              const r = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, phone: fd.get("phone") }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              id = d.id;
            }
            const r = await fetch(`/api/orders/${id}/payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "create" }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            if (d.paid) {
              window.location.assign(
                new URL("/dashboard", window.location.origin),
              );
              return;
            }
            await window
              .Cashfree({ mode: "sandbox" })
              .checkout({
                paymentSessionId: d.session,
                redirectTarget: "_self",
              });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {!existingOrder && (
          <label>
            Indian mobile number
            <input
              name="phone"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              required
              placeholder="10-digit mobile number"
            />
          </label>
        )}
        <label style={{ display: "flex", alignItems: "start" }}>
          <input style={{ width: 18 }} type="checkbox" required />I understand
          this is sandbox testing, and I have read the draft service and
          delivery policies.
        </label>
        <button className="button" disabled={!ready || !sdk || busy}>
          {busy ? "Opening checkout…" : `Test checkout · ₹${price}`}
        </button>
        <p role="status">{error}</p>
      </form>
    </>
  );
}
export function VerifyPayment({ id }: { id: string }) {
  const [state, setState] = useState("Your payment has not been verified yet.");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <p role="status">{state}</p>
      <button
        className="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch(`/api/orders/${id}/payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "verify" }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setState(
              d.paid
                ? "Payment verified. Your invitation is unlocked."
                : d.state === "FAILED"
                  ? "The payment attempt failed. Your invitation remains locked. Retry from My Invitations."
                  : `Payment ${d.state?.toLowerCase() || "pending"}. No features have been unlocked.`,
            );
          } catch (e) {
            setState((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Verifying…" : "Check payment status"}
      </button>
    </>
  );
}
