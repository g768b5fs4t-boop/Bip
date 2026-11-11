import type {
  ChatMessage,
  Client,
  Company,
  Conversation,
  DemoUser,
  Product,
  Quote,
  Supplier,
} from "./types";

export const demoCompany: Company = {
  id: "co_demo",
  name: "Martin Automatismes",
  address: "12 rue des Artisans",
  city: "Lyon",
  postalCode: "69003",
  phone: "04 78 00 00 00",
  email: "contact@martin-automatismes.fr",
  siret: "812 345 678 00012",
  paymentTerms: "Acompte 30 % à la commande, solde à la réception des travaux.",
  hourlyRateHt: 55,
  travelFeeHt: 45,
  defaultMarginPercent: 35,
  vatRates: [5.5, 10, 20],
  defaultVatRate: 20,
  legalMentions:
    "TVA selon article 293 B du CGI si applicable. Devis valable selon la durée indiquée. Réserve de propriété jusqu'au paiement complet.",
  quoteValidityDays: 30,
};

export const demoUser: DemoUser = {
  id: "user_demo",
  email: "demo@devisrapide.fr",
  name: "Jean Martin",
  companyId: demoCompany.id,
};

export const demoSuppliers: Supplier[] = [
  {
    id: "sup_somfy",
    companyId: demoCompany.id,
    name: "Somfy Pro",
    email: "pro@somfy.example",
    phone: "01 00 00 00 01",
    notes: "Catalogue moteurs et automatismes",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "sup_nice",
    companyId: demoCompany.id,
    name: "Nice France",
    email: "b2b@nice.example",
    phone: "01 00 00 00 02",
    notes: "Télécommandes et accessoires",
    createdAt: "2026-01-12T10:00:00.000Z",
  },
];

export const demoProducts: Product[] = [
  {
    id: "prod_mot123",
    companyId: demoCompany.id,
    supplierId: "sup_somfy",
    reference: "MOT123",
    designation: "Moteur tubulaire 20 Nm",
    unit: "u",
    purchasePriceHt: 89.5,
    marginPercent: 40,
    salePriceHt: null,
    updatedAt: "2026-02-01T09:00:00.000Z",
  },
  {
    id: "prod_tel456",
    companyId: demoCompany.id,
    supplierId: "sup_nice",
    reference: "TEL456",
    designation: "Télécommande 4 canaux",
    unit: "u",
    purchasePriceHt: 22,
    marginPercent: null,
    salePriceHt: 39,
    updatedAt: "2026-02-05T09:00:00.000Z",
  },
  {
    id: "prod_rail789",
    companyId: demoCompany.id,
    supplierId: "sup_somfy",
    reference: "RAIL789",
    designation: "Rail de guidage 3 m",
    unit: "u",
    purchasePriceHt: 34,
    marginPercent: 30,
    salePriceHt: null,
    updatedAt: "2026-02-08T09:00:00.000Z",
  },
  {
    id: "prod_bat001",
    companyId: demoCompany.id,
    supplierId: "sup_nice",
    reference: "BAT001",
    designation: "Piles CR2032 (lot de 2)",
    unit: "u",
    purchasePriceHt: 3.2,
    marginPercent: 50,
    salePriceHt: null,
    updatedAt: "2026-02-10T09:00:00.000Z",
  },
];

export const demoClients: Client[] = [
  {
    id: "cli_martin",
    companyId: demoCompany.id,
    name: "Monsieur Martin",
    address: "8 avenue des Lilas",
    city: "Villeurbanne",
    postalCode: "69100",
    phone: "06 12 34 56 78",
    email: "m.martin@email.fr",
    createdAt: "2026-01-20T10:00:00.000Z",
  },
  {
    id: "cli_dupont",
    companyId: demoCompany.id,
    name: "Madame Dupont",
    address: "3 place Bellecour",
    city: "Lyon",
    postalCode: "69002",
    phone: "06 98 76 54 32",
    email: "dupont@email.fr",
    createdAt: "2026-01-22T10:00:00.000Z",
  },
];

export const demoQuotes: Quote[] = [];

const welcome: ChatMessage = {
  id: "msg_welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis l'assistant DevisRapide IA.\n\nDécrivez-moi le devis à préparer, par exemple :\n« Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement. »\n\nJe chercherai uniquement dans **votre** catalogue, sans inventer de prix.",
  createdAt: new Date().toISOString(),
};

export const demoConversations: Conversation[] = [
  {
    id: "conv_demo",
    companyId: demoCompany.id,
    title: "Nouvelle conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [welcome],
  },
];
