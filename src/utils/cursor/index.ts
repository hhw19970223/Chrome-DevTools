export function X7c() {
  const i = new Uint8Array(16);
  return (
    crypto.getRandomValues(i),
    Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("")
  );
}
export function Q7c() {
  const i = new Uint8Array(8);
  return (
    crypto.getRandomValues(i),
    Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("")
  );
}

export const traceparent = `00-${X7c()}-${Q7c()}-00`;