import type { ReactNode } from "react";
import Brand from "./Brand";

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Product introduction">
        <Brand light />

        <div className="auth-story__copy">
          <p className="eyebrow eyebrow--light">AI-powered study workspace</p>
          <h1>Turn dense PDFs into knowledge that sticks.</h1>
          <p>
            Upload your reading and get a focused deck of questions in seconds—ready
            for active recall, not another passive reread.
          </p>
        </div>

        <div className="transform-preview" aria-hidden="true">
          <div className="document-preview">
            <span className="document-preview__tag">PDF</span>
            <span className="document-preview__line document-preview__line--long" />
            <span className="document-preview__line" />
            <span className="document-preview__line document-preview__line--short" />
            <span className="document-preview__line document-preview__line--long" />
            <span className="document-preview__line" />
          </div>
          <div className="transform-preview__arrow">
            <span />
            <svg viewBox="0 0 24 24">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </div>
          <div className="mini-deck">
            <div className="mini-card mini-card--back" />
            <div className="mini-card">
              <span>Q</span>
              <p>What is the key idea?</p>
              <small>Tap to reveal</small>
            </div>
          </div>
        </div>

        <div className="auth-proof">
          <span>PDF parsing</span>
          <span>AI generation</span>
          <span>Active recall</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__mobile-brand">
          <Brand />
        </div>
        {children}
      </section>
    </main>
  );
}

export default AuthLayout;
