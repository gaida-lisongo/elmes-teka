export type AccountType = "TENANT" | "SALER";

export interface AdminShellContextValue {
  user: {
    id: string;
    pseudo: string;
    email: string;
    telephone: string;
    matricule: string;
    photo?: string | null;
  };
  account: {
    type: AccountType;
    tenantId?: string;
    salerId?: string;
    storeId?: string;
    designation?: string;
    logo?: string | null;
    storeDesignation?: string | null;
  };
  permissions: string[];
}
