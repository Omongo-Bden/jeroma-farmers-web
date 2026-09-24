/**
 * Jeroma Farmers Mobile Money Payment Gateway Adapter (Uganda)
 * Supports automated digital payouts & collections via MTN MoMo Uganda & Airtel Money Uganda.
 */

const detectUgandaCarrier = (phoneNumber) => {
  if (!phoneNumber) return 'UNKNOWN';
  const clean = phoneNumber.replace(/[\s\-\+]/g, '');
  // Format standard: 25677..., 25678..., 25676... (MTN)
  if (/^256(77|78|76|39)/.test(clean) || /^0(77|78|76|39)/.test(clean)) {
    return 'MTN_UG';
  }
  // Format standard: 25670..., 25675..., 25674... (Airtel)
  if (/^256(70|75|74)/.test(clean) || /^0(70|75|74)/.test(clean)) {
    return 'AIRTEL_UG';
  }
  return 'OTHER';
};

const formatInternationalUgandaPhone = (phone) => {
  const clean = phone.replace(/[\s\-\+]/g, '');
  if (clean.startsWith('256')) return `+${clean}`;
  if (clean.startsWith('0')) return `+256${clean.slice(1)}`;
  return `+${clean}`;
};

/**
 * Disburse grain payout directly to farmer's mobile money wallet.
 */
const disburseFarmerPayout = async ({ phone, amountUGX, receiptNumber, farmerName }) => {
  const carrier = detectUgandaCarrier(phone);
  const formattedPhone = formatInternationalUgandaPhone(phone);

  const apiKey = process.env.MTN_MOMO_API_KEY || process.env.AIRTEL_MONEY_KEY;
  const isSimulated = !apiKey;

  console.log(`[MoMoGateway] Disbursing UGX ${Number(amountUGX).toLocaleString()} to ${farmerName} (${formattedPhone}, Carrier: ${carrier}) for Receipt #${receiptNumber}`);

  if (isSimulated) {
    // Graceful simulation when API keys are not in sandbox/production environment
    return {
      success: true,
      simulated: true,
      carrier,
      transactionId: `TX-UG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      formattedPhone,
      amountUGX,
      receiptNumber,
      message: `Simulated payout of UGX ${Number(amountUGX).toLocaleString()} credited to ${carrier} wallet.`
    };
  }

  // Real production integration hook
  try {
    // When MTN/Airtel API keys are active in Netlify environment variables:
    const endpoint = carrier === 'MTN_UG' 
      ? 'https://proxy.momoapi.mtn.com/disbursement/v1_0/transfer'
      : 'https://openapi.airtel.africa/standard/v1/payments/';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Reference-Id': `JRM-${receiptNumber}-${Date.now()}`
      },
      body: JSON.stringify({
        amount: amountUGX,
        currency: 'UGX',
        externalId: receiptNumber,
        payee: { partyIdType: 'MSISDN', partyId: formattedPhone.replace('+', '') },
        payerMessage: 'Jeroma Farmers Grain Payout',
        payeeNote: `Grain Purchase #${receiptNumber}`
      })
    });

    const data = await res.json();
    return {
      success: res.ok,
      simulated: false,
      carrier,
      transactionId: data.transactionId || `TX-${Date.now()}`,
      data
    };
  } catch (err) {
    console.error('[MoMoGateway] Payout error:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  detectUgandaCarrier,
  formatInternationalUgandaPhone,
  disburseFarmerPayout
};
