export const journeys = [
  { id: "founder", label: "Founder / Entrepreneur" },
  { id: "independent", label: "Freelancer / Independent" },
  { id: "investor", label: "Investor" },
  { id: "professional", label: "Business Professional" },
  { id: "aspiring", label: "Aspiring Entrepreneur" },
  { id: "other", label: "Other" },
] as const;

export const roles = [
  { id: "founder", label: "Founder" },
  { id: "cofounder", label: "Co-founder" },
  { id: "operator", label: "Operator" },
  { id: "investor", label: "Investor" },
  { id: "creator", label: "Creator" },
  { id: "product", label: "Product" },
  { id: "engineering", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "growth", label: "Growth" },
  { id: "sales", label: "Sales" },
  { id: "other", label: "Other" },
] as const;

export const ambitions = [
  { id: "like-minded", label: "Meet like-minded people" },
  { id: "opportunities", label: "Find business opportunities" },
  { id: "cofounder", label: "Find a co-founder or collaborator" },
  { id: "exchange", label: "Exchange ideas and experiences" },
  { id: "network", label: "Expand my professional network" },
  { id: "activities", label: "Meet people through real-life activities" },
] as const;

const journeyIds = new Set<string>(journeys.map((item) => item.id));
const roleIds = new Set<string>(roles.map((item) => item.id));
const ambitionIds = new Set<string>(ambitions.map((item) => item.id));

export type LeadInput = {
  name: string;
  firstName: string;
  lastName: string;
  city: string;
  journey: string;
  company: string;
  role: string;
  ambitions: string[];
  email: string;
  linkedin: string;
  instagram: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  submissionId: string;
  website: string;
};

export type Lead = {
  firstName: string;
  lastName: string;
  city: string;
  journey: string;
  company: string;
  role: string;
  ambitions: string;
  email: string;
  linkedin: string;
  instagram: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  submissionId: string;
  receivedAt: string;
};

export type FieldErrors = Partial<Record<keyof LeadInput | "form", string>>;

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function validateLead(
  raw: Partial<LeadInput>,
): { honeypot: true } | { lead: Lead } | { errors: FieldErrors } {
  const writtenName =
    clean(raw.name, 120) ||
    [clean(raw.firstName, 60), clean(raw.lastName, 60)].filter(Boolean).join(" ");
  const [firstName = "", ...rest] = writtenName.split(" ");
  const lastName = rest.join(" ");
  const city = clean(raw.city, 80);
  const journey = clean(raw.journey, 40);
  const company = clean(raw.company, 200);
  const role = clean(raw.role, 40);
  const email = clean(raw.email, 120).toLowerCase();
  const linkedin = clean(raw.linkedin, 200);
  const instagram = clean(raw.instagram, 120);
  const website = clean(raw.website, 200);
  const submissionId = clean(raw.submissionId, 80);
  const selected = Array.isArray(raw.ambitions)
    ? raw.ambitions.map((item) => clean(item, 40)).filter((item) => ambitionIds.has(item))
    : [];

  if (website) return { honeypot: true };

  const errors: FieldErrors = {};
  if (writtenName.length < 2) errors.name = "Add your name.";
  if (city.length < 2) errors.city = "Add your city.";
  if (!journeyIds.has(journey)) errors.journey = "Choose what describes you.";
  if (!roleIds.has(role)) errors.role = "Choose your role.";
  if (selected.length === 0) errors.ambitions = "Choose at least one.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";

  if (Object.keys(errors).length > 0) return { errors };

  const journeyLabel = journeys.find((item) => item.id === journey)?.label ?? journey;
  const roleLabel = roles.find((item) => item.id === role)?.label ?? role;
  const ambitionLabel = ambitions
    .filter((item) => selected.includes(item.id))
    .map((item) => item.label)
    .join(", ");

  return {
    lead: {
      firstName,
      lastName,
      city,
      journey: journeyLabel,
      company,
      role: roleLabel,
      ambitions: ambitionLabel,
      email,
      linkedin,
      instagram,
      utmSource: clean(raw.utmSource, 120),
      utmMedium: clean(raw.utmMedium, 120),
      utmCampaign: clean(raw.utmCampaign, 120),
      utmContent: clean(raw.utmContent, 120),
      utmTerm: clean(raw.utmTerm, 120),
      submissionId: submissionId || email,
      receivedAt: new Date().toISOString(),
    },
  };
}
