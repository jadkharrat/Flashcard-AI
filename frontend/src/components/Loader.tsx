function Loader() {
  return (
    <div className="generation-status" role="status" aria-live="polite">
      <span className="generation-status__spinner" aria-hidden="true" />
      <span>
        <strong>Finding the ideas worth remembering…</strong>
        <small>Reading your PDF and writing concise questions</small>
      </span>
    </div>
  );
}

export default Loader;
