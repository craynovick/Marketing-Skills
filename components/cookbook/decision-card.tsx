"use client";
import { useId, useRef, useState } from 'react';
import { answerText, type DecisionAnswer, type DecisionCardData } from '@/lib/cookbook-experience';
export function DecisionCard({ card, answer, busy, onAnswer, onBack }: { card: DecisionCardData; answer?: DecisionAnswer | null; busy?: boolean; onAnswer: (answer: DecisionAnswer) => Promise<void>; onBack?: () => void }) {
  const id = useId();
  const [selected, setSelected] = useState(answer?.optionId || '');
  const [text, setText] = useState(answer?.text || '');
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function submit(value: DecisionAnswer) {
    if (lock.current || busy) return;
    lock.current = true; setPending(true); setError('');
    try { answerText(card, value); await onAnswer(value); setEditing(false); }
    catch (error) { setError(error instanceof Error ? error.message : 'Your answer could not be saved. Try again.'); }
    finally { lock.current = false; setPending(false); }
  }
  const disabled = busy || pending;
  return <section className="cw-decision" aria-labelledby={`${id}-question`} aria-busy={pending}>
    <div className="cw-decision-heading"><h3 id={`${id}-question`}>{card.prompt}</h3>{card.step && card.total && <span>{card.step} of {card.total}</span>}</div>
    {answer && !editing ? <div className="cw-decision-summary"><p>{answerText(card, answer)}</p><button disabled={disabled} onClick={() => setEditing(true)}>Edit answer</button></div> : <>
      {editing && <p className="cw-decision-note">Changing this answer will prompt a review of later work. Approved documents stay unchanged.</p>}
      {!!card.options.length && <fieldset className="cw-decision-options"><legend className="cw-sr-only">Choose an answer</legend>{card.options.map((option, index) => <label key={option.id} className={`cw-decision-option ${selected === option.id ? 'is-selected' : ''}`}>
        <input type="radio" name={id} value={option.id} checked={selected === option.id} disabled={disabled} onChange={() => setSelected(option.id)} />
        <span className="cw-decision-number" aria-hidden="true">{index + 1}</span><span><strong>{option.label}</strong>{option.recommended && <small className="cw-recommended">Recommended</small>}<span className="cw-decision-description">{option.description}</span>{option.recommended && <span className="cw-decision-rationale">{option.rationale}</span>}</span>
      </label>)}</fieldset>}
      <label className="cw-decision-free" htmlFor={`${id}-text`}>{card.freeTextLabel || 'Add details or write a different answer'}<textarea id={`${id}-text`} value={text} maxLength={2500} rows={2} disabled={disabled} onChange={e => setText(e.target.value)} placeholder="Your answer…" /></label>
      <div className="cw-decision-actions">{onBack && <button disabled={disabled} onClick={onBack}>← Back</button>}{editing && <button disabled={disabled} onClick={() => setEditing(false)}>Cancel</button>}<button disabled={disabled} onClick={() => void submit({ skipped: true })}>Skip</button><button className="cw-primary" disabled={disabled || (!selected && !text.trim())} onClick={() => void submit({ ...(selected ? { optionId: selected } : {}), ...(text.trim() ? { text: text.trim() } : {}) })}>{pending ? 'Saving…' : editing ? 'Save and review' : 'Continue →'}</button></div>
    </>}{error && <p role="alert" className="cw-error">{error}</p>}
  </section>;
}
