import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, Check, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { logger } from "../utils/logger";
import { getRovingFocusIndex } from "@/utils/keyboardNavigation";

interface TransactionExportMenuProps {
    disabled?: boolean;
    onExport: (format: "csv" | "pdf") => void;
}

export function TransactionExportMenu({ disabled = false, onExport }: TransactionExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const menuId = "transaction-export-menu";

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openMenu = (focusIndex?: number) => {
        setIsOpen(true);
        if (focusIndex !== undefined) {
            requestAnimationFrame(() => itemRefs.current[focusIndex]?.focus());
        }
    };

    const closeMenu = (restoreFocus = false) => {
        setIsOpen(false);
        if (restoreFocus) {
            requestAnimationFrame(() => triggerRef.current?.focus());
        }
    };

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "ArrowDown" || event.key === "Home") {
            event.preventDefault();
            openMenu(0);
        } else if (event.key === "ArrowUp" || event.key === "End") {
            event.preventDefault();
            openMenu(1);
        } else if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            closeMenu(true);
        }
    };

    const handleItemKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeMenu(true);
            return;
        }
        if (event.key === "Tab") {
            setIsOpen(false);
            return;
        }

        const nextIndex = getRovingFocusIndex(event.key, index, 2, "vertical");
        if (nextIndex !== null) {
            event.preventDefault();
            itemRefs.current[nextIndex]?.focus();
        }
    };

    const handleExportClick = async (format: "csv" | "pdf") => {
        setIsOpen(false);
        setIsExporting(true);
        setExportStatus("idle");

        // Allow UI to render the loading state before starting export
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
            onExport(format);
            setExportStatus("success");
            // Auto hide success banner after 3 seconds
            setTimeout(() => setExportStatus("idle"), 3000);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Export failed";
            logger.error({ format, error }, "Export failed");
            setExportStatus("error");
            setErrorMessage(errMsg);
            // Auto hide error banner after 5 seconds
            setTimeout(() => setExportStatus("idle"), 5000);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <div className="flex flex-col items-end gap-2">
                <button
                    ref={triggerRef}
                    id="export-history-btn"
                    type="button"
                    disabled={disabled || isExporting}
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleTriggerKeyDown}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? menuId : undefined}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase text-[12px] tracking-wider transition-all duration-200 cursor-pointer ${
                        disabled
                            ? "bg-[#11212E] text-[#4B5563] border border-[#2D3748] cursor-not-allowed"
                            : isExporting
                            ? "bg-[#11212E] text-white border border-[#55D6BE]/20"
                            : "bg-[#11212E] text-white border border-[#2A2A2A] hover:border-[#55D6BE] hover:bg-[#1C1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081521]"
                    }`}
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#55D6BE]" />
                            <span>Exporting...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 text-[#55D6BE]" />
                            <span>Export History</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        </>
                    )}
                </button>

                {/* Dropdown menu */}
                {isOpen && !disabled && !isExporting && (
                    <div
                        id={menuId}
                        role="menu"
                        aria-labelledby="export-history-btn"
                        className="absolute right-0 top-14 z-50 w-52 rounded-xl bg-[#0D1D2C] border border-[#263949] p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                        <button
                            ref={(element) => { itemRefs.current[0] = element; }}
                            id="export-csv-btn"
                            type="button"
                            role="menuitem"
                            onClick={() => handleExportClick("csv")}
                            onKeyDown={(event) => handleItemKeyDown(event, 0)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#CBD5E1] hover:bg-[#55D6BE] hover:text-black transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-[#55D6BE] focus-visible:text-black"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Export as CSV</span>
                        </button>
                        <button
                            ref={(element) => { itemRefs.current[1] = element; }}
                            id="export-pdf-btn"
                            type="button"
                            role="menuitem"
                            onClick={() => handleExportClick("pdf")}
                            onKeyDown={(event) => handleItemKeyDown(event, 1)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#CBD5E1] hover:bg-[#55D6BE] hover:text-black transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-[#55D6BE] focus-visible:text-black"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Export as PDF</span>
                        </button>
                    </div>
                )}

                {/* Status Notifications */}
                {exportStatus === "success" && (
                    <div className="absolute right-0 top-14 z-50 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg animate-in fade-in duration-200">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Export Completed!</span>
                    </div>
                )}

                {exportStatus === "error" && (
                    <div className="absolute right-0 top-14 z-50 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="max-w-[200px] truncate">{errorMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
