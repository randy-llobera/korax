const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean) => {
  if (!value) {
    return defaultValue;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  return defaultValue;
};

export const isEmailVerificationEnabled = () =>
  parseBooleanEnv(process.env.EMAIL_VERIFICATION_ENABLED, true);
