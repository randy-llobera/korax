const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset:";

export const getPasswordResetIdentifier = (email: string) =>
  `${PASSWORD_RESET_IDENTIFIER_PREFIX}${email}`;

export const getPasswordResetEmail = (identifier: string) =>
  identifier.startsWith(PASSWORD_RESET_IDENTIFIER_PREFIX)
    ? identifier.slice(PASSWORD_RESET_IDENTIFIER_PREFIX.length)
    : null;

export const isEmailVerificationIdentifier = (identifier: string) =>
  identifier.length > 0 && !identifier.startsWith(PASSWORD_RESET_IDENTIFIER_PREFIX);

export const getAuthTokenIdentifiersForEmail = (email: string) => [
  email,
  getPasswordResetIdentifier(email),
];
