export interface BookingRepository {
  upsertMany(input: Array<{
    supplier: string;
    supplierBookingId: string;
    productCode: string;
    status: string;
    startTimeIso: string;
  }>): Promise<number>;
}
