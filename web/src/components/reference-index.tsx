import Link from "next/link";

import type { GlossaryReferenceTerm } from "@/lib/content/repository";

import styles from "./reference-index.module.css";

function statusLabel(status: GlossaryReferenceTerm["status"]) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function ReferenceIndex({ terms, query = "", selectedSlug, ownerPreview }: { terms: GlossaryReferenceTerm[]; query?: string; selectedSlug?: string; ownerPreview: boolean }) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTerms = normalizedQuery
    ? terms.filter((term) => `${term.term} ${term.definition}`.toLowerCase().includes(normalizedQuery))
    : terms;
  const selectedTerm = terms.find((term) => term.slug === selectedSlug) ?? visibleTerms[0];

  return (
    <div className={styles.shell} id="top">
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/learn" aria-label="PT Learning Lab home"><span className={styles.brandMark} aria-hidden="true">PL</span><span><strong>PT Learning Lab</strong><small>Human Movement Studio</small></span></Link>
        <div className={styles.headerActions}><Link href="/learn">Learning path</Link>{ownerPreview && <span className={styles.draftBadge}>Owner draft preview</span>}</div>
      </header>

      <main className={styles.main} id="main-content">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/learn">Learning path</Link><span aria-hidden="true">/</span><span>Reference</span></nav>
        <section className={styles.intro} aria-labelledby="reference-heading">
          <p className={styles.eyebrow}>Reference</p>
          <h1 id="reference-heading">Find the movement language you need.</h1>
          <p>Use this quick glossary during revision or return to a lesson when you want the fuller explanation. Definitions are short, source-aware and separate from the lesson mastery promise.</p>
        </section>

        <form className={styles.search} method="get">
          <label htmlFor="reference-search">Search terms</label>
          <div><input id="reference-search" name="q" type="search" defaultValue={query} placeholder="Try flexion, medial or axis" /><button type="submit">Search</button></div>
        </form>

        {terms.length === 0 ? <section className={styles.empty}><h2>No published reference terms yet</h2><p>The owner is still reviewing the first reference package.</p></section> : (
          <div className={styles.referenceGrid}>
            <nav className={styles.termList} aria-label="Glossary terms">
              <div className={styles.listHeading}><span>{visibleTerms.length} {visibleTerms.length === 1 ? "term" : "terms"}</span>{normalizedQuery && <Link href="/reference">Clear search</Link>}</div>
              {visibleTerms.length === 0 ? <p className={styles.noMatch}>No terms match “{query}”. Try a shorter search.</p> : <ul>{visibleTerms.map((term) => <li key={term.slug}><Link href={`/reference?term=${term.slug}${normalizedQuery ? `&q=${encodeURIComponent(query)}` : ""}`} aria-current={selectedTerm?.slug === term.slug ? "page" : undefined} className={selectedTerm?.slug === term.slug ? styles.selected : undefined}><strong>{term.term}</strong><small>{statusLabel(term.status)} · v{term.versionNumber}</small></Link></li>)}</ul>}
            </nav>

            {selectedTerm && <article className={styles.detail} aria-labelledby="term-heading"><p className={styles.eyebrow}>Definition</p><h2 id="term-heading">{selectedTerm.term}</h2><p className={styles.definition}>{selectedTerm.definition}</p><div className={styles.source}><span>Source record</span><strong>{selectedTerm.sourceTitle ?? "Source record pending"}</strong>{selectedTerm.sourceLocation && <small>{selectedTerm.sourceLocation}</small>}</div>{ownerPreview && <p className={styles.draftNote}>This is a draft reference term. Learners will only see published versions.</p>}</article>}
          </div>
        )}
      </main>
    </div>
  );
}
