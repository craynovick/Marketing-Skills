"use client";
import { useRef, useState } from 'react';
import type { BrandProject } from '@/lib/cookbook-projects';
import { json, messageOf, requestJSON } from './types';
export function NewBrand({ onCreated, onClose }: { onCreated: (brand: BrandProject, files: File[]) => void; onClose: () => void }) {
  const [seed, setSeed] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const key = useRef(crypto.randomUUID());
  return <form onSubmit={async e => {
    e.preventDefault(); if (pending) return; setPending(true); setError('');
    try { const result = await requestJSON<{brand: BrandProject}>('/api/cookbook/brands', json({seed, requestId: key.current})); onCreated(result.brand, []); }
    catch (error) { setError(messageOf(error)); } finally { setPending(false); }
  }}>
    <div className="cw-modal-heading"><h2>New brand</h2><button type="button" onClick={onClose} aria-label="Close new brand">×</button></div>
    <p>Enter a public website or brand name. Cookbook will find the official site, research it, and fill in the brand basics for you.</p>
    <label>Website or brand name<input autoFocus required maxLength={2000} placeholder="cookbook.to or Cookbook" value={seed} onChange={e => setSeed(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <button className="cw-primary" disabled={pending || !seed.trim()}>{pending ? 'Finding and researching…' : 'Find brand and continue'}</button>
  </form>;
}
