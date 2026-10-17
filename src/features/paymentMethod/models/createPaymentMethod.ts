export interface CreatePaymentMethod {
    userId: string;
    providerId: string;
    accountIdentifier: string;
    beneficiaryName?: string;
    identificationNumber?: string;
    description?: string;
}
