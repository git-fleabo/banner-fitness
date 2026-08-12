import type { ReactNode } from "react";

export type SemanticIconName = "overview" | "clients" | "programmes" | "library" | "exercise-library" | "settings" | "search" | "help" | "review" | "adherence" | "sessions";

export function Icon({ name }: { name: SemanticIconName }) {
  const paths: Record<SemanticIconName, ReactNode> = {
    overview: <path d="m3 10.5 9-7.2 9 7.2v8.2a1.3 1.3 0 0 1-1.3 1.3h-5.1v-6H9.4v6H4.3A1.3 1.3 0 0 1 3 18.7z" />,
    clients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M15 5.5a3 3 0 0 1 0 5.8M17 14.5a4.5 4.5 0 0 1 3.5 4.4V20" /></>,
    programmes: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    library: <><path d="M5 4.5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H5zM19 4.5h-5a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h5z" /></>,
    "exercise-library": <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5M8 10.5h5M10.5 8v5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.6 1z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-.9 1-2 1.3-2 2.9M12 16.8v.1" /></>,
    review: <><path d="M6 3.5h9l3 3v14H6zM14 3.5v4h4M9 12h6M9 16h4" /></>,
    adherence: <><path d="M4 17.5 9 12l3.2 3.2L20 7.5M15.5 7.5H20V12" /></>,
    sessions: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h5" /></>,
  };
  return <svg className="ds-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
