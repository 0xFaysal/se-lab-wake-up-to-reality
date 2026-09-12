export const queryKeys = {
  auth: { me: ["auth", "me"] as const, sessions: ["auth", "sessions"] as const },
  vehicles: { all: ["vehicles"] as const, detail: (id: string) => ["vehicles", id] as const },
  properties: { all: (filters: object = {}) => ["properties", filters] as const, root: ["properties"] as const, detail: (id: string) => ["properties", "detail", id] as const },
  propertyImages: { byProperty: (id: string) => ["property-images", id] as const },
  propertyGuards: { byProperty: (id: string) => ["property-guards", id] as const },
  ownerGuardAssignments: { all: (filters: object = {}) => ["guard-assignments", "provider", filters] as const, root: ["guard-assignments", "provider"] as const, detail: (id: string) => ["guard-assignments", "provider", id] as const },
  guardMemberships: { all: (filters: object = {}) => ["guard-memberships", filters] as const, root: ["guard-memberships"] as const },
  guardAssignments: { all: (filters: object = {}) => ["guard-assignments", "guard", filters] as const, root: ["guard-assignments", "guard"] as const, detail: (id: string) => ["guard-assignments", "guard", id] as const },
  adminProperties: { pending: (filters: { page: number; limit: number }) => ["admin", "properties", "pending", filters] as const, pendingRoot: ["admin", "properties", "pending"] as const, detail: (id: string) => ["admin", "properties", id] as const },
  managerDelegations: { provider: ["manager-delegations", "provider"] as const, manager: ["manager-delegations", "manager"] as const },
};
