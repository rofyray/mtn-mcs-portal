export const addressCodePartMinLength = 3;
export const addressCodePartMaxLength = 4;

export function normalizeAddressPart(value: string) {
  return value.replace(/\D/g, "").slice(0, addressCodePartMaxLength);
}

export function parseAddressCode(value?: string) {
  const [prefix = "", area = "", unique = ""] = (value ?? "").split("-");
  return { prefix, area, unique };
}

export function buildAddressCode(prefix: string, area: string, unique: string) {
  if (!prefix) {
    return "";
  }
  const areaPart = normalizeAddressPart(area);
  const uniquePart = normalizeAddressPart(unique);
  return `${prefix}-${areaPart}-${uniquePart}`;
}

export function isAddressCodeComplete(value?: string) {
  const { prefix, area, unique } = parseAddressCode(value);
  return (
    prefix.length >= 2 &&
    area.length >= addressCodePartMinLength &&
    unique.length >= addressCodePartMinLength
  );
}
