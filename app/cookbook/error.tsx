"use client";
export default function CookbookError({ reset }: { reset: () => void }) {
  return <main className="wrap saved-cookbook-page"><h1>Could not load your account.</h1><p role="alert">Please try again in a moment.</p><button className="cookbook-action" onClick={reset}>Try again</button></main>;
}
