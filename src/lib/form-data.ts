/** Læs formularfelt — håndterer evt. præfiks fra React/Next serialisering. */
export function getFormField(formData: FormData, key: string) {
  const direct = formData.get(key);
  if (direct != null && String(direct).length > 0) {
    return String(direct);
  }

  for (const [name, value] of formData.entries()) {
    if (name === key || name.endsWith(`_${key}`)) {
      const text = String(value);
      if (text.length > 0) return text;
    }
  }

  return "";
}
