"use client";

import { useState } from "react";
import { User, Landmark, Copy, Check, Shield, Globe, ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react";

export interface TradeDetailsProps {
    role: "buyer" | "seller";
    amount: number;
    assetCode: string;
    unitPrice: number;
    total: number;
    fiatCurrency?: string;
    escrowDuration?: string;
    paymentMethod: string;
    paymentType?: "platform" | "web" | "bank";
    accountIdentifier?: string;
    accountOwner?: string;
    counterpartyName?: string;
    counterpartyRate?: string;
    counterpartyKyc?: boolean;
    counterpartyProfileImageUrl?: string;
}

export function TradeDetails({ 
    role, 
    amount, 
    assetCode, 
    unitPrice, 
    total, 
    fiatCurrency = "EUR",
    escrowDuration = "15 Minutes",
    paymentMethod,
    paymentType = "bank",
    accountIdentifier = "N/A",
    accountOwner = "QuantVortex_LP",
    counterpartyName = "QuantVortex_LP",
    counterpartyRate = "99.8%",
    counterpartyKyc = true,
    counterpartyProfileImageUrl
}: TradeDetailsProps) {
    const isBuyer = role === "buyer";
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que se active el acordeón
        navigator.clipboard.writeText(accountIdentifier);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderPaymentIcon = () => {
        switch (paymentType) {
            case "platform":
                return <Shield className="w-5 h-5 text-[#C2C7D0]" />;
            case "web":
                return <Globe className="w-5 h-5 text-[#C2C7D0]" />;
            case "bank":
            default:
                return <Landmark className="w-5 h-5 text-[#C2C7D0]" />;
        }
    };

    // ==========================================
    // VISTA DE VENDEDOR / RESUMEN (image_9a2247.png)
    // ==========================================
    if (!isBuyer) {
        return (
            <div className="bg-[#11212E] w-full h-full rounded-xl flex flex-col justify-between p-8 font-space shrink-0 select-none border border-white/[0.02]">
                <div className="flex flex-col w-full h-full justify-between">
                    {/* Header y Bloque de Conversión */}
                    <div className="flex flex-col gap-6">
                        <p className="text-[#C2C7D0] text-[12px] leading-4 tracking-[1.2px] uppercase font-normal">
                            TRANSACTION SUMMARY
                        </p>
                        
                        <div className="flex flex-row justify-between items-center w-full px-1">
                            {/* Crypto Side */}
                            <div className="flex flex-col gap-1">
                                <h2 className="text-white font-bold text-[36px] leading-10 tracking-[-0.9px]">
                                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[#55D6BE] font-bold text-[18px] leading-7">
                                    {assetCode}
                                </span>
                            </div>

                            {/* Intercambio Icon */}
                            <div className="flex items-center justify-center w-[30px] h-[27px]">
                                <ArrowLeftRight className="w-7 h-7 text-[#55D6BE]" />
                            </div>

                            {/* Fiat Side */}
                            <div className="flex flex-col items-end gap-1">
                                <h2 className="text-white font-bold text-[36px] leading-10 tracking-[-0.9px] text-right">
                                    {fiatCurrency === "EUR" ? "€" : "$"}{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[#C2C7D0] font-bold text-[18px] leading-7 text-right">
                                    {fiatCurrency}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filas de Información de la Transacción */}
                    <div className="border-t border-[rgba(69,73,50,0.2)] pt-6 flex flex-col gap-4 w-full">
                        {/* Contraparte */}
                        <div className="flex flex-row justify-between items-center w-full">
                            <span className="text-[#C2C7D0] text-[14px] font-manrope font-normal">
                                Counterparty
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#35343A] flex items-center justify-center overflow-hidden shrink-0">
                                    {counterpartyProfileImageUrl ? (
                                        <img src={counterpartyProfileImageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span className="text-white font-bold text-[16px] font-space">
                                    {counterpartyName}
                                </span>
                                {counterpartyKyc && (
                                    <span className="w-4 h-4 rounded-full bg-[#55D6BE] flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 text-black stroke-[4px]" />
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Método de pago */}
                        <div className="flex flex-row justify-between items-center w-full">
                            <span className="text-[#C2C7D0] text-[14px] font-manrope font-normal">
                                Payment Method
                            </span>
                            <span className="text-white font-medium text-[16px] font-space">
                                {paymentMethod}
                            </span>
                        </div>

                        {/* Duración de depósito en garantía */}
                        <div className="flex flex-row justify-between items-center w-full">
                            <span className="text-[#C2C7D0] text-[14px] font-manrope font-normal">
                                Escrow Duration
                            </span>
                            <span className="text-white font-medium text-[16px] font-space">
                                {escrowDuration}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VISTA DE COMPRADOR (image_9a25b1.png)
    // ==========================================
    return (
        <div className="bg-[#0D1D2C] w-[616.2px] h-[571.5px] border-l-4 border-[#55D6BE] rounded-r-[12px] flex flex-col justify-between p-8 font-space shrink-0 select-none">
            {/* Top row */}
            <div className="flex flex-row justify-between items-start w-full h-[60px] shrink-0">
                <div className="flex flex-col gap-1">
                    <p className="text-[#C2C7D0] text-[12px] leading-4 tracking-[1.2px] uppercase font-normal">
                        OPERATION TYPE
                    </p>
                    <h2 className="text-white font-bold text-[30px] leading-9 tracking-[-0.75px] uppercase">
                        BUYING
                    </h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <p className="text-[#C2C7D0] text-[12px] leading-4 tracking-[1.2px] uppercase font-normal text-right">
                        ASSET AMOUNT
                    </p>
                    <h2 className="text-[#55D6BE] font-extrabold text-[36px] leading-[40px] tracking-[-1.8px] text-right">
                        {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {assetCode}
                    </h2>
                </div>
            </div>
            
            {/* Inputs body */}
            <div className="flex flex-col gap-4 flex-grow justify-center mt-2 shrink-0">
                {/* Unit Price */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-[#9BABB7] text-[10px] font-bold tracking-[1px] uppercase">
                        UNIT PRICE
                    </p>
                    <div className="bg-[#081521] text-white w-full h-[62px] px-4 flex items-center justify-between font-bold rounded-none border border-[rgba(69,73,50,0.2)]">
                        <span className="text-[20px] leading-7 font-bold text-white">
                            {unitPrice.toFixed(4)}
                        </span>
                        <span className="text-[#C2C7D0] text-[12px] font-bold leading-4">
                            USD/{assetCode}
                        </span>
                    </div>
                </div>
                
                {/* Total Asset Value */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-[#9BABB7] text-[10px] font-bold tracking-[1px] uppercase">
                        TOTAL ASSET VALUE
                    </p>
                    <div className="bg-[#081521] text-[#55D6BE] w-full h-[62px] px-4 flex items-center justify-between font-bold rounded-none border border-[rgba(69,73,50,0.2)]">
                        <span className="text-[20px] leading-7 font-bold text-[#55D6BE]">
                            {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[#C2C7D0] text-[12px] font-bold leading-4">
                            USD
                        </span>
                    </div>
                </div>

                {/* Counterparty Block */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-[#9BABB7] text-[10px] font-bold tracking-[1px] uppercase">
                        COUNTERPARTY
                    </p>
                    <div className="flex items-center gap-3 h-[40px]">
                        <div className="w-8 h-8 rounded-[12px] bg-[#35343A] flex items-center justify-center border border-white/[0.04] shrink-0 overflow-hidden">
                            {counterpartyProfileImageUrl ? (
                                <img src={counterpartyProfileImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold text-[14px] leading-5 truncate">
                                    {counterpartyName}
                                </span>
                                {counterpartyKyc && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#55D6BE] flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 text-black stroke-[4px]" />
                                    </span>
                                )}
                            </div>
                            <span className="text-[#55D6BE] text-[10px] font-bold leading-[15px] tracking-[0.5px] uppercase">
                                Verified Merchant • {counterpartyRate} completion
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Method - Accordion Collapsible Box */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-[#9BABB7] text-[10px] font-bold tracking-[1px] uppercase">
                        PAYMENT METHOD
                    </p>
                    <div 
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className={`bg-[#11212E] text-white w-full flex flex-col font-medium rounded-none border border-white/[0.02] cursor-pointer transition-all duration-300 ${
                            isAccordionOpen ? "p-4 gap-3.5" : "h-[52px] px-4 flex-row items-center justify-between"
                        }`}
                    >
                        {/* Header of the Accordion */}
                        <div className={`flex items-center justify-between w-full ${isAccordionOpen ? "" : "h-full"}`}>
                            <div className="flex items-center gap-3">
                                {renderPaymentIcon()}
                                <span className="text-[14px] leading-5 text-[#D7E0E6] font-medium font-manrope">
                                    {paymentMethod}
                                </span>
                            </div>
                            
                            {/* Copy button & Toggle Arrow */}
                            <div className="flex items-center gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCopy}
                                    className="p-1 rounded hover:bg-white/[0.04] active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    {copied ? (
                                        <>
                                            <span className="text-[9px] text-[#55D6BE] uppercase font-extrabold tracking-wider">Copied!</span>
                                            <Check className="w-4 h-4 text-[#55D6BE] stroke-[3px]" />
                                        </>
                                    ) : (
                                        <Copy className="w-4 h-4 text-[#C2C7D0] hover:text-white transition-colors" />
                                    )}
                                </button>
                                {isAccordionOpen ? (
                                    <ChevronUp className="w-4 h-4 text-[#C2C7D0]" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-[#C2C7D0]" />
                                )}
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {isAccordionOpen && (
                            <div className="border-t border-[rgba(69,73,50,0.15)] pt-3 flex flex-col gap-3 animate-fadeIn">
                                {/* Account Identifier */}
                                <div className="flex flex-col gap-1">
                                    <p className="text-[#9BABB7] text-[9px] font-bold tracking-[1px] uppercase">
                                        ACCOUNT IDENTIFIER
                                    </p>
                                    <span className="text-white text-[12px] font-mono select-all bg-[#081521] px-3 py-2 border border-white/[0.03] rounded">
                                        {accountIdentifier}
                                    </span>
                                </div>
                                {/* Account Owner */}
                                <div className="flex flex-col gap-1">
                                    <p className="text-[#9BABB7] text-[9px] font-bold tracking-[1px] uppercase">
                                        ACCOUNT OWNER
                                    </p>
                                    <span className="text-white text-[12px] font-semibold pl-1">
                                        {accountOwner}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}