export default function CreateLoading() {
  return (
    <main className="cw-shell cw-loading-shell" aria-label="Opening your workspace" aria-busy="true">
      <aside className="cw-loading-sidebar" aria-hidden="true">
        <span className="cw-loading-block is-logo" />
        <span className="cw-loading-block" />
        <span className="cw-loading-block" />
        <span className="cw-loading-block" />
      </aside>
      <section className="cw-loading-main">
        <header><span className="cw-loading-block is-title" /><span className="cw-loading-block is-context" /></header>
        <div className="cw-loading-content">
          <span className="cw-loading-block is-heading" />
          <span className="cw-loading-block is-copy" />
          <span className="cw-loading-block is-composer" />
          <p role="status">Opening your workspace…</p>
        </div>
      </section>
    </main>
  );
}
