// ─── VietQR / EMVCo QR builder ───────────────────────────────────────────────
// Spec: NAPAS Interoperable QR Code Format v1.0 (09/2021)
// https://vietqr.net/portal-service/download/documents/QR_Format_T&C_v1.0_VN_092021.pdf

export interface Bank {
  bin: string;
  name: string;
  shortName: string;
}

export const VIET_BANKS: Bank[] = [
  { bin: '970436', name: 'Ngân hàng Vietcombank', shortName: 'Vietcombank' },
  { bin: '970403', name: 'Ngân hàng Vietinbank', shortName: 'Vietinbank' },
  { bin: '970418', name: 'Ngân hàng BIDV', shortName: 'BIDV' },
  { bin: '970405', name: 'Ngân hàng Agribank', shortName: 'Agribank' },
  { bin: '970407', name: 'Ngân hàng Techcombank', shortName: 'Techcombank' },
  { bin: '970422', name: 'Ngân hàng MB Bank', shortName: 'MB Bank' },
  { bin: '970423', name: 'Ngân hàng TPBank', shortName: 'TPBank' },
  { bin: '970432', name: 'Ngân hàng VPBank', shortName: 'VPBank' },
  { bin: '970416', name: 'Ngân hàng ACB', shortName: 'ACB' },
  { bin: '970443', name: 'Ngân hàng SHB', shortName: 'SHB' },
  { bin: '970448', name: 'Ngân hàng OCB', shortName: 'OCB' },
  { bin: '970437', name: 'Ngân hàng HDBank', shortName: 'HDBank' },
  { bin: '970440', name: 'Ngân hàng SeABank', shortName: 'SeABank' },
  { bin: '970441', name: 'Ngân hàng VIB', shortName: 'VIB' },
  { bin: '970433', name: 'Ngân hàng Sacombank', shortName: 'Sacombank' },
  { bin: '970415', name: 'Ngân hàng Vietbank', shortName: 'Vietbank' },
  { bin: '970454', name: 'Ngân hàng Woori Bank', shortName: 'Woori Bank' },
  { bin: '970408', name: 'Ngân hàng GPBank', shortName: 'GPBank' },
  { bin: '970419', name: 'Ngân hàng NCB', shortName: 'NCB' },
  { bin: '970425', name: 'Ngân hàng ABBank', shortName: 'ABBank' },
];

export interface PhoneQRParams {
  phone: string;
  accountName: string;
  amount?: number;
  description?: string;
  city?: string;
}

// ─── Build VietQR from phone number (QRIBFTTC – inter-bank transfer by phone) ─
export const buildPhoneQR = (params: PhoneQRParams): string => {
  const {
    phone,
    accountName,
    amount,
    description,
    city = 'HANOI',
  } = params;

  // Sub-field 01: Consumer Account Info (no specific bank BIN for phone transfer)
  const consumerAccInfo = tlv('00', '') + tlv('01', phone);

  // Field 38: Merchant Account Information (NAPAS – phone transfer)
  const merchantAccInfo =
    tlv('00', 'A000000727') +
    tlv('01', consumerAccInfo) +
    tlv('02', 'QRIBFTTC');

  const initMethod = amount && amount > 0 ? '12' : '11';
  const merchantName = accountName.trim().slice(0, 25).toUpperCase();
  const merchantCity = city.trim().slice(0, 15).toUpperCase();

  let qr = '';
  qr += tlv('00', '01');
  qr += tlv('01', initMethod);
  qr += tlv('38', merchantAccInfo);
  qr += tlv('52', '0000');
  qr += tlv('53', '704');

  if (amount && amount > 0) {
    qr += tlv('54', Math.round(amount).toString());
  }

  qr += tlv('58', 'VN');
  qr += tlv('59', merchantName);
  qr += tlv('60', merchantCity);

  if (description && description.trim().length > 0) {
    const purpose = description.trim().slice(0, 25);
    qr += tlv('62', tlv('08', purpose));
  }

  qr += '6304';
  qr += crc16ccitt(qr);
  return qr;
};

export interface VietQRParams {
  bankBin: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  description?: string;
  city?: string;
}

// ─── TLV encoder: ID (2 chars) + LENGTH (2 digits) + VALUE ──────────────────
const tlv = (id: string, value: string): string => {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
};

// ─── CRC-16/CCITT (polynomial 0x1021, initial 0xFFFF) ───────────────────────
const crc16ccitt = (str: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8; // eslint-disable-line no-bitwise
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) { // eslint-disable-line no-bitwise
        crc = ((crc << 1) ^ 0x1021) & 0xffff; // eslint-disable-line no-bitwise
      } else {
        crc = (crc << 1) & 0xffff; // eslint-disable-line no-bitwise
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

// ─── Build VietQR string ─────────────────────────────────────────────────────
export const buildVietQR = (params: VietQRParams): string => {
  const {
    bankBin,
    accountNumber,
    accountName,
    amount,
    description,
    city = 'HANOI',
  } = params;

  // Field 38 > Sub-field 01: Beneficiary Organization
  const benOrg = tlv('00', bankBin) + tlv('01', accountNumber);

  // Field 38: Merchant Account Information (NAPAS)
  const merchantAccInfo =
    tlv('00', 'A000000727') +
    tlv('01', benOrg) +
    tlv('02', 'QRIBFTTA');

  // Point of Initiation Method: 12 = dynamic (with amount), 11 = static
  const initMethod = amount && amount > 0 ? '12' : '11';

  // Merchant name: max 25 chars, uppercase per spec
  const merchantName = accountName.trim().slice(0, 25).toUpperCase();
  const merchantCity = city.trim().slice(0, 15).toUpperCase();

  let qr = '';
  qr += tlv('00', '01');             // ID 00 – Payload Format Indicator
  qr += tlv('01', initMethod);       // ID 01 – Point of Initiation Method
  qr += tlv('38', merchantAccInfo);  // ID 38 – Merchant Account Information
  qr += tlv('52', '0000');           // ID 52 – Merchant Category Code
  qr += tlv('53', '704');            // ID 53 – Transaction Currency (VND)

  if (amount && amount > 0) {
    qr += tlv('54', Math.round(amount).toString()); // ID 54 – Amount
  }

  qr += tlv('58', 'VN');             // ID 58 – Country Code
  qr += tlv('59', merchantName);     // ID 59 – Merchant Name
  qr += tlv('60', merchantCity);     // ID 60 – Merchant City

  if (description && description.trim().length > 0) {
    const purpose = description.trim().slice(0, 25);
    qr += tlv('62', tlv('08', purpose)); // ID 62 > ID 08 – Purpose of Transaction
  }

  qr += '6304'; // ID 63 – CRC placeholder (4-char value appended after)
  const crc = crc16ccitt(qr);
  qr += crc;

  return qr;
};

// ─── EMVCo TLV parser ────────────────────────────────────────────────────────
const parseTLV = (str: string): Map<string, string> => {
  const map = new Map<string, string>();
  let i = 0;
  while (i + 4 <= str.length) {
    const id = str.substring(i, i + 2);
    const len = parseInt(str.substring(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > str.length) { break; }
    map.set(id, str.substring(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return map;
};

export interface ParsedQR {
  phone?: string;
  name?: string;
  amount?: number;
  description?: string;
  isVietQR: boolean;
}

// ─── Parse a VietQR string back to its components ────────────────────────────
export const parsePhoneQR = (qr: string): ParsedQR => {
  try {
    // Strip CRC (last 4 chars = "63044XXX" → just remove trailing 4-char CRC value)
    const body = qr.endsWith('6304') ? qr : qr.slice(0, -4) + '6304';
    const fields = parseTLV(body.replace(/6304.*$/, ''));

    const result: ParsedQR = { isVietQR: false };

    // Field 38: Merchant Account Information
    const f38 = fields.get('38');
    if (f38) {
      const sub38 = parseTLV(f38);
      const service = sub38.get('02');
      if (service === 'QRIBFTTC' || service === 'QRIBFTTA') {
        result.isVietQR = true;
        const accInfo = sub38.get('01');
        if (accInfo) {
          const accFields = parseTLV(accInfo);
          result.phone = accFields.get('01');
        }
      }
    }

    // Field 54: Amount
    const f54 = fields.get('54');
    if (f54) { result.amount = parseInt(f54, 10); }

    // Field 59: Merchant/Recipient name
    const f59 = fields.get('59');
    if (f59) { result.name = f59; }

    // Field 62 > 08: Purpose / description
    const f62 = fields.get('62');
    if (f62) {
      const sub62 = parseTLV(f62);
      result.description = sub62.get('08');
    }

    return result;
  } catch {
    return { isVietQR: false };
  }
};
