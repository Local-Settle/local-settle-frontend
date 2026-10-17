import { PaymentMethodOption } from "../../paymentMethod/models/paymentMethod";

export interface Offer {
    offerId: string,
    creatorId: string,
    type: string,
    assetCode: string,
    price: string,
    /** Fiat currency used for this offer's price (older API responses omit it). */
    currency?: string,
    fiatCurrency?: string,
    minAmount: string,
    maxAmount: string,
    status: string,
    executed?: boolean,
    payment_methods?: PaymentMethodOption[],
    paymentMethods?: PaymentMethodOption[]
}
