import "server-only";

export {
  getCurrentSession,
  requireSession,
  requirePermission,
  assertRole,
  revokeUserSessions,
  syncUserCredentialAccount,
  syncCredentialByEmailIfValid,
  signInInternalUser,
  changeOwnPassword,
  isValidPbkdf2Hash,
  VerifiedSessionUserSchema,
  LoginInputSchema,
  ChangePasswordInputSchema,
  type VerifiedSessionUser,
} from "./auth";

export {
  PermissionSchema,
  UserRoleSchema,
  ROLE_PERMISSIONS,
  hasPermission,
  type Permission,
  type DalRole,
} from "./permissions";

export {
  DalError,
  DAL_ERROR_CATALOG,
  isDalError,
  toHttpErrorResponse,
  type DalErrorCode,
} from "./errors";

export {
  assertStageTransitionAllowed,
  shouldMaskPeerEvaluations,
  filterEvaluationsBlind,
  maskApplicationBlindScorecard,
  assertCanApproveRequisition,
  assertCanActivateJobStatus,
  assertCanCloseJobStatus,
} from "./gates";

export * from "./schemas";
export * from "./users";
export * from "./jobs";
export * from "./scorecards";
export * from "./pipeline";
export * from "./applications";
export * from "./interviews";
export * from "./talent-pool";
export * from "./analytics";
