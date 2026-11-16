"use client";

export function RetryButton() {
  return (
    <button className="btn-light mt-8" onClick={() => window.location.reload()}>
      Try again
    </button>
  );
}
