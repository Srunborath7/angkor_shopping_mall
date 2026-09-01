import { api } from "../api/api";
import { generateAbaQrApi, checkAbaStatusApi, simulateAbaPayApi } from "./abaPaymentService";
import { getCleanStoreSettings } from "../hooks/useStoreSettings";

/**
 * Calculate CRC16-CCITT (polynomial 0x1021, initial 0xFFFF) for NBC Bakong KHQR EMVCo standard
 * @param {string} data
 * @returns {string} 4-character uppercase Hex CRC
 */
export function calculateKhqrCrc16(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Format standard TLV (Tag-Length-Value) string for EMVCo
 * @param {string} tag 2-digit tag
 * @param {string|number} value
 * @returns {string}
 */
export function formatTlv(tag, value) {
  if (value === undefined || value === null || value === "") return "";
  const strVal = String(value);
  const len = strVal.length.toString().padStart(2, "0");
  return `${tag}${len}${strVal}`;
}

/**
 * Get active Bakong Merchant / Account Configuration from Store Settings or .env
 */
export function getActiveBakongConfig() {
  const store = getCleanStoreSettings() || {};
  
  const bakongId =
    import.meta.env.VITE_BAKONG_ACCOUNT_ID ||
    import.meta.env.VITE_ABA_ACCOUNT_ID ||
    store.bakongMerchantId ||
    store.abaMerchantId ||
    "angkor_shopping_mall@abaa";

  const merchantName =
    store.bakongMerchantName ||
    store.storeName ||
    import.meta.env.VITE_ABA_PAYWAY_STORE_LABEL ||
    "Angkor Shopping Mall";

  const merchantCity = store.storeCity || "Phnom Penh";

  return {
    bakongId: bakongId.trim(),
    merchantName: merchantName.trim(),
    merchantCity: merchantCity.trim()
  };
}

/**
 * Generate official NBC Bakong KHQR EMVCo 2.0 Dynamic / Static QR String
 * @param {Object} options
 * @param {string} [options.bakongId] - Registered Bakong ID (e.g. your_account@abaa, phone_number@aclb)
 * @param {string} [options.merchantName] - Store or Owner Name
 * @param {string} [options.merchantCity] - City (default: Phnom Penh)
 * @param {number} [options.amount] - Payment amount (0 for static QR)
 * @param {string} [options.currency='USD'] - 'USD' (840) or 'KHR' (116)
 * @param {string} [options.billNumber] - Order Number or Reference
 * @param {string} [options.storeLabel] - Store label tag
 * @param {string} [options.terminalLabel] - Terminal label (e.g. POS-01)
 * @returns {string} Fully compliant NBC Bakong KHQR String
 */
export function generateKhqrString(options = {}) {
  const activeConfig = getActiveBakongConfig();
  const bakongId = (options.bakongId || activeConfig.bakongId || "angkor_mall@aba").trim();
  const merchantName = (options.merchantName || activeConfig.merchantName || "Angkor Shopping Mall").slice(0, 25).trim();
  const merchantCity = (options.merchantCity || activeConfig.merchantCity || "Phnom Penh").slice(0, 15).trim();
  
  const isKhr = (options.currency || "USD").toUpperCase() === "KHR";
  const currCode = isKhr ? "116" : "840";
  const numAmount = parseFloat(options.amount) || 0;
  const formattedAmount = isKhr ? Math.round(numAmount).toString() : numAmount.toFixed(2);

  // Tag 00: Payload Format Indicator
  let raw = formatTlv("00", "01");

  // Tag 01: Point of Initiation Method (12 = Dynamic with Amount, 11 = Static)
  raw += formatTlv("01", numAmount > 0 ? "12" : "11");

  // Tag 29: Individual Bakong Account Identifier
  // Subtag 00: Bakong Account ID (e.g. name@abaa, 012345678@abaa)
  const tag29Sub00 = formatTlv("00", bakongId);
  raw += formatTlv("29", tag29Sub00);

  // Tag 52: Merchant Category Code (General Retail)
  raw += formatTlv("52", "5999");

  // Tag 53: Transaction Currency (840 = USD, 116 = KHR)
  raw += formatTlv("53", currCode);

  // Tag 54: Transaction Amount
  if (numAmount > 0) {
    raw += formatTlv("54", formattedAmount);
  }

  // Tag 58: Country Code (KH)
  raw += formatTlv("58", "KH");

  // Tag 59: Merchant Name
  raw += formatTlv("59", merchantName);

  // Tag 60: Merchant City
  raw += formatTlv("60", merchantCity);

  // Tag 62: Additional Data Field
  let tag62Sub = "";
  if (options.billNumber || options.orderNumber || options.orderId) {
    const bill = String(options.billNumber || options.orderNumber || `ORD-${options.orderId}`).slice(0, 25);
    tag62Sub += formatTlv("01", bill);
  }
  if (options.storeLabel || merchantName) {
    tag62Sub += formatTlv("03", (options.storeLabel || merchantName).slice(0, 25));
  }
  if (options.terminalLabel) {
    tag62Sub += formatTlv("07", String(options.terminalLabel).slice(0, 25));
  }
  if (tag62Sub) {
    raw += formatTlv("62", tag62Sub);
  }

  // Tag 63: CRC16 Checksum
  const stringToCrc = raw + "6304";
  const crc = calculateKhqrCrc16(stringToCrc);
  return stringToCrc + crc;
}

export const generateKhqrApi = generateAbaQrApi;
export const checkKhqrStatusApi = checkAbaStatusApi;
export const simulateKhqrPayApi = simulateAbaPayApi;
