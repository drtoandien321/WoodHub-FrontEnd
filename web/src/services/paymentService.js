/*
 * Giả lập dịch vụ thanh toán.
 * V1: sẽ redirect sang cổng thanh toán thật (VNPay/MoMo).
 * Demo MVP: luôn trả về thành công sau một khoảng thời gian chờ.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const paymentService = {
  processPayment: async ({ method, amount }) => {
    // FE tuyệt đối không nhập/lưu số thẻ thật.
    console.log(`Bắt đầu thanh toán ${amount} qua ${method}...`);
    
    // Giả lập mạng / giao tiếp với cổng thanh toán
    await delay(1500);

    return {
      success: true,
      transactionId: `TXN_${Date.now()}`
    };
  }
};
