export type MoneyTransferCreateType = {
  senderId: string;
  recipientId: string;
  amount: string;
  idempotencyKey: string;
  // status: string;
};
