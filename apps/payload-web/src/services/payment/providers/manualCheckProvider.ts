import type { RecordManualPaymentParams } from "../types"
import { ulid } from "ulid"

export class ManualCheckProvider {
  processManualPayment(params: RecordManualPaymentParams): {
    paymentId: string
    providerTransactionId: string
    amount: number
    status: "completed"
  } {
    return {
      paymentId: ulid(),
      providerTransactionId: params.providerTransactionId || `CHK-${ulid().slice(-8)}`,
      amount: params.amount,
      status: "completed",
    }
  }
}
