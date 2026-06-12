export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export function getTaskPublicUrl(taskId: string) {
  return `${getBaseUrl()}/o/${taskId}`;
}
