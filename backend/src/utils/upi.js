const buildUpiPaymentUrl = ({ upiId, merchantName, amount, note }) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
};

const getUpiConfig = () => ({
  upiId: process.env.UPI_ID || "luvkush@okaxis",
  merchantName: process.env.UPI_MERCHANT_NAME || "Luv Kush Classes",
});

module.exports = { buildUpiPaymentUrl, getUpiConfig };