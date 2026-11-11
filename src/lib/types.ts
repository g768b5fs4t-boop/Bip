export type Unit = "u" | "h" | "m" | "m²" | "forfait" | "kg";

export interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  siret: string;
  logoUrl?: string;
  paymentTerms: string;
  hourlyRateHt: number;
  travelFeeHt: number;
  defaultMarginPercent: number;
  vatRates: number[];
  defaultVatRate: number;
  legalMentions: string;
  quoteValidityDays: number;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  supplierId: string;
  reference: string;
  designation: string;
  unit: Unit;
  purchasePriceHt: number;
  marginPercent: number | null;
  salePriceHt: number | null;
  updatedAt: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export type QuoteStatus =
  | "brouillon"
  | "valide"
  | "envoye"
  | "accepte"
  | "refuse"
  | "archive";

export interface QuoteLine {
  id: string;
  type: "produit" | "main_doeuvre" | "deplacement" | "remise" | "divers";
  reference?: string;
  designation: string;
  quantity: number;
  unit: Unit;
  unitPriceHt: number;
  vatRate: number;
  productId?: string;
}

export interface Quote {
  id: string;
  number: string;
  companyId: string;
  clientId: string;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
  lines: QuoteLine[];
  notes?: string;
  conversationId?: string;
}

export interface QuoteTotals {
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  byVatRate: { rate: number; baseHt: number; vat: number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  quoteDraftId?: string;
}

export interface Conversation {
  id: string;
  companyId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  draftQuoteId?: string;
}

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
}
