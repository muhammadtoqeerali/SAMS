export type CountryBadge = {
  flag: string;
  label: string;
  code: "PK" | "BD" | "IT" | "OTHER";
};

export function countryBadge(nationality: string): CountryBadge {
  const value = nationality.trim().toLowerCase();

  if (value.includes("pakistan") || value.includes("pakistani")) {
    return { flag: "🇵🇰", label: "Pakistan", code: "PK" };
  }
  if (value.includes("bangladesh") || value.includes("bangladeshi")) {
    return { flag: "🇧🇩", label: "Bangladesh", code: "BD" };
  }
  if (value.includes("italy") || value.includes("italian")) {
    return { flag: "🇮🇹", label: "Italy", code: "IT" };
  }

  return { flag: "🌍", label: nationality || "Other", code: "OTHER" };
}
