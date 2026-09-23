import { APP_SETTINGS } from "../../../constants/settings";

const RECEIPT_WIDTH = 29;

export function labelValue(label, value, labelWidth = 9) {
    return String(label).padEnd(labelWidth, " ") + ": " + String(value ?? "");
}

export function wrapWords(text, width = RECEIPT_WIDTH) {
    const words = String(text ?? "").split(" ").filter(Boolean);
    const lines = [];
    let cur = "";
    words.forEach((w) => {
        const test = cur ? cur + " " + w : w;
        if (test.length > width) {
            if (cur) lines.push(cur);
            cur = w.length > width ? w.slice(0, width) : w;
        } else {
            cur = test;
        }
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
}

export function centerText(text, width = RECEIPT_WIDTH) {
    const t = String(text ?? "");
    if (t.length >= width) return t;
    const totalPad = width - t.length;
    const left = Math.floor(totalPad / 2);
    return " ".repeat(left) + t;
}

export function centerBlock(text, width = RECEIPT_WIDTH) {
    return wrapWords(text, width).map((line) => centerText(line, width)).join("\n");
}

export function money(n) {
    return Math.round(Number(n) || 0).toLocaleString("id-ID");
}

export function buildReprintReceiptBlocks(selectedTransaction) {
    if (!selectedTransaction) return null;

    const header = [
        centerBlock(String(APP_SETTINGS.ORG_NAME || "").toUpperCase(), RECEIPT_WIDTH),
        APP_SETTINGS.ORG_SUBTEXT ? centerBlock(String(APP_SETTINGS.ORG_SUBTEXT).toUpperCase(), RECEIPT_WIDTH) : null,
        APP_SETTINGS.ORG_REGION ? centerBlock(String(APP_SETTINGS.ORG_REGION).toUpperCase(), RECEIPT_WIDTH) : null,
        "=".repeat(RECEIPT_WIDTH),
    ].filter(Boolean).join("\n");

    const dateObj = selectedTransaction.created_at?.toDate
        ? selectedTransaction.created_at.toDate()
        : new Date(selectedTransaction.created_at || Date.now());

    const info = [
        labelValue("NOTA", selectedTransaction.invoice_number || selectedTransaction.id || "-"),
        labelValue(
            "TGL",
            dateObj.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
        ),
        labelValue("PLG", selectedTransaction.member_name || "NON-MEMBER"),
        labelValue("KASIR", selectedTransaction.cashier_name || selectedTransaction.created_by_name || "KASIR"),

        centerBlock("*** SALINAN NOTA ***"),
        "-".repeat(RECEIPT_WIDTH),
    ].join("\n");

    const itemsList = selectedTransaction.items || selectedTransaction.cart || [];
    const itemLines = itemsList.flatMap((item) => {
        const name = String(item.product_name || item.name || "-").toUpperCase();
        const qty = Number(item.qty || 0);
        const price = Math.round(item.sell_price || item.current_sell_price || item.price || 0);
        const lineTotal = qty * price;

        const nameLines = wrapWords(name, RECEIPT_WIDTH);
        const qtyLine = `   ${qty} x ${money(price)} = ${money(lineTotal)}`;

        return [...nameLines, qtyLine];
    });

    const items = (itemLines.length ? itemLines : ["(tidak ada item)"]).concat("-".repeat(RECEIPT_WIDTH)).join("\n");

    const totalsLines = [
        labelValue("SUBTOTAL", "Rp " + money(selectedTransaction.total_amount || selectedTransaction.subtotal)),
    ];
    if (Number(selectedTransaction.discount_amount) > 0) {
        totalsLines.push(labelValue("DISKON", "-Rp " + money(selectedTransaction.discount_amount)));
    }
    totalsLines.push(
        "-".repeat(RECEIPT_WIDTH),
        labelValue("TOTAL", "Rp " + money(selectedTransaction.grand_total || selectedTransaction.total_amount)),
        "-".repeat(RECEIPT_WIDTH),
        labelValue("BAYAR", "Rp " + money(selectedTransaction.paid_amount || selectedTransaction.cash_paid)),
        labelValue("KEMBALI", "Rp " + money(selectedTransaction.change_amount || selectedTransaction.change))
    );
    const totals = totalsLines.join("\n");

    const footer = [
        "=".repeat(RECEIPT_WIDTH),
        centerText("TERIMA KASIH"),
        centerBlock("*** SALINAN NOTA ***"),
    ].join("\n");

    return { header, info, items, totals, footer };
}

export const preBase = {
    margin: 0,
    fontFamily: "'Courier New', Courier, monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textTransform: "none",
};