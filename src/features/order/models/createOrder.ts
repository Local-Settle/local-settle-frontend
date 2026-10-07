export interface CreateOrder {
    offerId: string;
    buyerId: string;
    sellerId: string;
    assetAmount: string;
    fiatAmount: string;
    // Escrow fields for atomic order+escrow creation
    sellerAddress: string;
    buyerAddress: string;
    assetCode: string;
    title?: string;
}
