# Banner Fitness PT-client data governance

This document is the operating checklist for the paid pilot. It describes the product controls currently implemented and the checks that must be confirmed before encouraging PTs to enter real client information. It is not legal advice or a substitute for the owner’s privacy, contractual and professional obligations.

## Data in scope

PT-client records may contain contact details, body information, goals, training experience, activity, sleep, stress, screening responses, pain or limitation notes, programme prescriptions, performance baselines, workout results and PT decisions. Treat all of this as confidential client information. Do not use case-study fixtures as real client records.

## Access control

- PT workspace routes require a signed-in owner account.
- Every PT-client, programme, workout, performance, location, preference and template query is scoped to the authenticated owner profile.
- Learner accounts cannot access the PT designer routes.
- Client deletion requires the exact confirmation phrase `DELETE CLIENT` and is performed only after an owner-scoped lookup.
- Review screening, quality acknowledgement and programme status changes are recorded with the owner actor and programme event history.
- Before pilot launch, run a separate-account test covering owner access, learner denial, a second-owner denial and sign-out/session expiry.

## Export and deletion

- The client workspace provides an owner-scoped JSON export containing the current client record, assessment, goals, preferences, location, performance records, programme history, quality review, timeline and workout history.
- The export is marked private and non-cacheable and must be handled as confidential data after download.
- Permanent client deletion removes the client profile and related assessment, goals, preferences, locations, programmes, programme events, quality reviews, acknowledgements, sessions, prescriptions, workout results, workout sets and performance records through the database cascade relationships.
- Deletion is intentionally not reversible in the UI. Confirm the export requirement with the PT before deletion.
- The product currently has no automated retention purge. A retention period and legal/contractual hold process must be chosen and documented by the operator before real-client use.

## Retention and minimisation

- Collect only information needed for screening, programming, review, progression or the client relationship.
- Keep records only while there is a documented programming, contractual, professional or legal reason to retain them.
- Review inactive and archived clients at an agreed interval. Record any retention hold before postponing deletion.
- Do not place client health information in screenshots, case-study fixtures, source control, prompt examples or public URLs.
- Do not send more client information to an external AI tool than is necessary for the PT’s stated task; redact identity and contact details where they are not needed.

## Backup and recovery assumptions

- The application stores PT data in the configured Neon database; Cloudflare hosts the application worker and static assets, not the authoritative PT-client database.
- Confirm Neon backup, point-in-time recovery, access logging and restoration ownership before the paid pilot. These settings are deployment-provider controls and are not proven by this repository.
- Test a restore using a non-production copy before relying on backups. Never test destructive recovery against live client data.
- Keep deployment credentials, database credentials and exported client files out of source control and shared devices.

## Incident response

1. Stop the suspected disclosure or access path and preserve the relevant timestamps, account and deployment information.
2. Revoke or rotate affected credentials and suspend the affected account where appropriate.
3. Determine which client records and recipients may be involved without copying unnecessary health information into the incident record.
4. Notify the operator and follow the applicable contractual, privacy and professional notification process within its required timescale.
5. Record the cause, containment, decisions and corrective action. Do not silently delete evidence of the incident.
6. After resolution, test the affected access boundary and update this procedure.

## Pilot sign-off checklist

- [ ] Operator has completed a privacy and contractual review for the intended jurisdiction and client relationships.
- [ ] Neon backup and restore settings have been confirmed and a non-production restore test completed.
- [ ] Owner, learner, second-owner, sign-out and session-expiry access tests have passed.
- [ ] JSON export has been opened and checked without exposing more data than intended.
- [ ] Client deletion has been tested using a disposable client, not a real client record.
- [ ] Retention period, review cadence and legal/contractual hold process are recorded.
- [ ] Incident contacts, escalation route and notification process are recorded.
