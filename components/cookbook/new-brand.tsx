"use client";
import { useRef, useState } from 'react';
import type { BrandProject } from '@/lib/cookbook-projects';
import { json, messageOf, requestJSON } from './types';
export function NewBrand({ onCreated, onClose }: { onCreated: (brand: BrandProject, files: File[]) => void; onClose: () => void }) {
  const [name, setName] = useState(''); const [offer, setOffer] = useState(''); const [website, setWebsite] = useState('');
  const [files, setFiles] = useState<File[]>([]); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const key = useRef(crypto.randomUUID());
  return <form onSubmit={async e => {
    e.preventDefault(); if (pending) return; setPending(true); setError('');
    try { const result = await requestJSON<{brand: BrandProject}>('/api/cookbook/brands', json({name, offer, website, requestId: key.current})); onCreated(result.brand, files); }
    catch (error) { setError(messageOf(error)); } finally { setPending(false); }
  }}>
    <div className="cw-modal-heading"><h2>New brand</h2><button type="button" onClick={onClose} aria-label="Close new brand">×</button></div>
    <p>Start with the basics, then tune Audience Strategy, Brand Positioning, and Brand Voice.</p>
    <label>Brand name<input autoFocus required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
    <label>What do you offer?<textarea required maxLength={2000} value={offer} onChange={e => setOffer(e.target.value)} /></label>
    <label>Website (optional)<input type="url" maxLength={2000} placeholder="https://" value={website} onChange={e => setWebsite(e.target.value)} /></label>
    <label>Brand materials (optional)<input type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={e => {
      const incoming = Array.from(e.target.files || []);
      if (incoming.length > 5 || incoming.reduce((n,f) => n + f.size, 0) > 4 * 1024 * 1024 || incoming.some(f => !f.size || !/\.(pdf|docx|txt|md)$/i.test(f.name))) { setError('Choose up to five nonempty PDF, DOCX, TXT or MD files totaling 4 MB or less.'); e.target.value = ''; setFiles([]); return; }
      setFiles(incoming); setError('');
    }} /></label>
    {error && <p role="alert">{error}</p>}
    <button className="cw-primary" disabled={pending || !name.trim() || !offer.trim()}>{pending ? 'Creating…' : 'Create brand and tune skills'}</button>
  </form>;
}
