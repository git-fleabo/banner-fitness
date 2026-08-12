"use client";

import { useEffect, useMemo, useState } from "react";

type TeamMember = { id: string; email: string; displayName: string | null; role: "owner" | "pt" | "learner"; status: "invited" | "active" | "blocked" };
type TeamClient = { id: string; firstName: string; lastName: string; ownerProfileId: string };
type TeamData = { members: TeamMember[]; clients: TeamClient[]; invitations: Array<{ id: string; email: string; status: string; createdAt: string }> };

export function TeamAccess({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<TeamData | null>(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const members = useMemo(() => data?.members ?? [], [data]);
  const assignees = useMemo(() => members.filter((member) => (member.role === "owner" || member.role === "pt") && member.status === "active"), [members]);

  async function load() {
    const response = await fetch("/api/designer/team", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Team access could not be loaded");
    setData(await response.json() as TeamData);
  }
  useEffect(() => {
    fetch("/api/designer/team", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<TeamData> : Promise.reject(new Error("Team access could not be loaded")))
      .then(setData)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Team access could not be loaded"));
  }, []);
  async function invite() {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/designer/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }), credentials: "same-origin" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Invitation could not be created");
      setEmail(""); setNotice("Invitation created. Ask the PT to sign in with this exact email address."); await load();
    } catch (inviteError) { setError(inviteError instanceof Error ? inviteError.message : "Invitation could not be created"); }
    finally { setSaving(false); }
  }
  async function updateMember(memberId: string, status: "active" | "blocked") {
    setError("");
    const response = await fetch("/api/designer/team", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId, status }), credentials: "same-origin" });
    if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error || "PT account could not be updated"); return; }
    await load();
  }
  async function assign(clientId: string, ownerProfileId: string) {
    setError("");
    const response = await fetch("/api/designer/team", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId, ownerProfileId }), credentials: "same-origin" });
    if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error || "Client assignment could not be updated"); return; }
    setNotice("Client assignment saved"); await load();
  }
  return <div className="modal-backdrop"><section className="team-access-modal" role="dialog" aria-modal="true" aria-labelledby="team-access-heading"><header><div><p className="eyebrow">WORKSPACE ADMIN</p><h2 id="team-access-heading">Team access</h2><p>Owners can see the whole workspace. PT accounts can see and edit only the clients assigned to them.</p></div><button className="close-button" onClick={onClose}>×</button></header>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="team-notice" role="status">{notice}</p>}<section className="team-section"><div className="team-section-heading"><div><p className="eyebrow">INVITE A PT</p><h3>Add a practitioner</h3></div><span>Owner only</span></div><div className="team-invite-row"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pt@example.com" aria-label="PT email address" /><button className="primary-button" onClick={invite} disabled={saving || !email.trim()}>{saving ? "Creating…" : "Create invitation"}</button></div><small>The invitation is claimed when the practitioner signs in with the same email. No existing client data is changed.</small>{data?.invitations.map((invitation) => <div className="team-invite" key={invitation.id}><span>{invitation.email}</span><small>Pending · created {new Date(invitation.createdAt).toLocaleDateString("en-GB")}</small></div>)}</section><section className="team-section"><div className="team-section-heading"><div><p className="eyebrow">PRACTITIONERS</p><h3>Account status</h3></div><span>{members.filter((member) => member.role === "pt").length} PT account{members.filter((member) => member.role === "pt").length === 1 ? "" : "s"}</span></div>{members.filter((member) => member.role === "owner" || member.role === "pt").map((member) => <div className="team-member-row" key={member.id}><div><strong>{member.displayName || member.email}</strong><small>{member.role === "owner" ? "Owner · full workspace" : `${member.email} · assigned clients only`}</small></div><span className={`status-pill status-${member.status}`}>{member.status}</span>{member.role === "pt" && <button className="text-button" onClick={() => updateMember(member.id, member.status === "blocked" ? "active" : "blocked")}>{member.status === "blocked" ? "Reactivate" : "Block access"}</button>}</div>)}</section><section className="team-section"><div className="team-section-heading"><div><p className="eyebrow">CLIENT ASSIGNMENTS</p><h3>Choose who owns each client</h3></div><span>{data?.clients.length ?? 0} client{data?.clients.length === 1 ? "" : "s"}</span></div>{data?.clients.map((client) => <label className="team-client-row" key={client.id}><span><strong>{client.firstName} {client.lastName}</strong><small>Current workspace owner</small></span><select value={client.ownerProfileId} onChange={(event) => assign(client.id, event.target.value)} aria-label={`Assign ${client.firstName} ${client.lastName}`}><option value="" disabled>Choose practitioner</option>{assignees.map((member) => <option value={member.id} key={member.id}>{member.displayName || member.email}{member.role === "owner" ? " · Owner" : " · PT"}</option>)}</select></label>)}</section><footer><button className="secondary-button" onClick={onClose}>Close</button></footer></section></div>;
}
