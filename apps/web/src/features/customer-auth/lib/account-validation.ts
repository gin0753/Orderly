export function profileErrors(name: string, phone: string, nameChanged: boolean) {
  const errors: { name?: string; phone?: string } = {};
  if (nameChanged && (!name.trim() || Array.from(name.trim()).length > 120))
    errors.name = "Enter a name of up to 120 characters.";
  if (phone.trim() && !/^[+()\d\s-]{7,20}$/.test(phone.trim()))
    errors.phone = "Enter a valid phone number, or leave this blank.";
  return errors;
}

export function passwordErrors(current: string, next: string, confirmation: string) {
  const errors: { current?: string; next?: string; confirmation?: string } = {};
  if (!current) errors.current = "Enter your current password.";
  if (Array.from(next).length < 15) errors.next = "Use at least 15 characters.";
  else if (new Blob([next]).size > 72) errors.next = "Use no more than 72 UTF-8 bytes.";
  if (next !== confirmation) errors.confirmation = "Your passwords don’t match.";
  return errors;
}
