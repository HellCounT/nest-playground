export const validationConstants = {
  LOGIN_MIN_LENGTH: 6,
  LOGIN_MAX_LENGTH: 30,
  LOGIN_PATTERN: '^[a-zA-Z0-9_-]*$',

  DESCRIPTION_MIN_LENGTH: 4,
  DESCRIPTION_MAX_LENGTH: 1000,

  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 20,
  PASSWORD_PATTERN:
    '^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!"#$%&\'()*+,\\-./:;<=>?@\\[\\]^_`{|}~]).+$',
};
