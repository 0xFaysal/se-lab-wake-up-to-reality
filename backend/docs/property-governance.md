# Property Governance and Supply-Side Authority

## Domain boundaries

`Property` is the canonical physical building. `createdByUserId` records who
created the database record; it never grants permanent building-wide authority.

Commercial participation comes from `PropertyProvider`. Only memberships whose
status is `ACTIVE` and whose verification status is `VERIFIED` count toward
governance or grant Provider authority.

Governance mode is derived at request time:

- zero or one active verified Provider: `SINGLE_PROVIDER`
- two or more active verified Providers: `MULTI_PROVIDER`

It is intentionally not stored on `Property`.

## Authority matrix

| Action | Sole Provider | Multi-provider member | Building Manager | Delegated Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Provider commercial scope | Yes | Own scope only | No | Explicit permission and grantor scope | Administrative only |
| Common Property rules | Yes | Proposal only | Yes | No | Fallback |
| Temporary closure | Yes | Proposal only | Yes | No | Fallback |
| Shared Property images | Yes | No direct mutation | Yes | `IMAGE_MANAGE` only in single-provider mode | Yes |
| View Property Guard directory | Yes | Yes | No | `GUARD_VIEW` | Yes |
| Add Property Guard | Yes | Yes | No | `GUARD_ADD_TO_PROPERTY` | Administrative removal only |
| Provider Guard assignment | Own scope | Own scope | No | `GUARD_ASSIGN` for grantor scope | No implicit commercial authority |
| Manager delegation changes | Yes | Own delegation only | No | Never | Controlled account creation only |

A global `MANAGER` role grants no business authority. Building Manager is a
separate Property-scoped assignment and grants only common-rule and temporary
closure authority.

## Lifecycle rules

- A second verified Provider immediately removes sole-provider common authority.
- An active single-provider Building Manager becomes `PENDING_RECONFIRMATION`.
- All current active verified Providers must approve a multi-provider Building
  Manager or shared Property change.
- A rejection requires a reason and resolves the nomination/proposal.
- When only one verified Provider remains, that Provider regains controller
  authority. A Building Manager must be reconfirmed by that Provider.
- Provider departure ends that Provider's live Manager delegations and Guard
  assignments in the same transaction.
- Property Guard membership is shared. Provider Guard assignments remain isolated
  by `providerMembershipId`.
- Only Admin can remove a Guard from a Property, and only after every live Provider
  Guard assignment has ended.

## Concurrency and privacy

Property mutations use transaction-scoped PostgreSQL advisory locks. Property
updates and proposals use optimistic `version` checks. Delegation and Guard
assignment transitions use scoped locks plus conditional updates. Partial unique
indexes protect current assignments, delegations, and Building Manager state.

Exact addresses and access instructions remain AES-256-GCM encrypted. Duplicate
detection uses a dedicated HMAC-SHA256 address fingerprint. API DTOs never return
ciphertext, IVs, authentication tags, token hashes, or Guard security state.

## Role migration and compatibility

The migration renames the PostgreSQL enum value `PARKING_OWNER` to `PROVIDER`, so
existing role rows retain their meaning without duplicate semantic roles. Auth
loads roles from the live database on every request, so old access-token role
claims do not grant stale authority. Registration temporarily accepts
`PARKING_OWNER` as a deprecated input alias and normalizes it to `PROVIDER`.

Canonical Property routes use `/api/v1/provider`. The existing
`/api/v1/owner/properties` mount remains temporarily as a compatibility alias;
authorization on both routes uses current Provider membership, never
`createdByUserId`.

Before starting the updated application, set a unique
`PROPERTY_ADDRESS_FINGERPRINT_SECRET` of at least 32 characters, apply the
migration, and regenerate the Prisma client.
