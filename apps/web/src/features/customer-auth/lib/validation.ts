export type AuthFormValues = { name: string; email: string; password: string; confirmation: string };
export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

export function customerAuthFormErrors(values: AuthFormValues, register: boolean): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const email = values.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) errors.email = "Enter a valid email address (up to 160 characters).";
  if (!values.password) errors.password = "Enter your password.";
  else if (new Blob([values.password]).size > 72) errors.password = "Use a password no longer than 72 UTF-8 bytes. Some characters use more than one byte.";
  else if (register && Array.from(values.password).length < 15) errors.password = "Use at least 15 characters.";
  if (register) {
    if (!values.name.trim() || Array.from(values.name.trim()).length > 120) errors.name = "Enter your name (up to 120 characters).";
    if (values.confirmation !== values.password) errors.confirmation = "Your passwords don’t match.";
  }
  return errors;
}
