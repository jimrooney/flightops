export type SeedField = { label: string; value: string };
export type SeedParticipant = { fields: SeedField[] };
export type SeedItem = {
  productCode: string;
  startTimeLocal: string;
  participants: SeedParticipant[];
};
export type SeedBooking = {
  orderNumber: string;
  status: string;
  supplierId: string;
  items: SeedItem[];
};

export const seedBookings: SeedBooking[] = [
  {
    orderNumber: "MOCK-1001",
    status: "CONFIRMED",
    supplierId: "MOCK-SUPPLIER",
    items: [
      {
        productCode: "PSLMYT",
        startTimeLocal: "2026-03-01T09:00:00+13:00",
        participants: [
          { fields: [{ label: "First Name", value: "Ava" }, { label: "Last Name", value: "Ngata" }, { label: "Barcode", value: "MOCK-1001-P1" }] },
          { fields: [{ label: "First Name", value: "Luca" }, { label: "Last Name", value: "Ngata" }, { label: "Barcode", value: "MOCK-1001-P2" }] }
        ]
      }
    ]
  },
  {
    orderNumber: "MOCK-1002",
    status: "PENDING_SUPPLIER",
    supplierId: "MOCK-SUPPLIER",
    items: [
      {
        productCode: "GLENAIR",
        startTimeLocal: "2026-03-01T11:30:00+13:00",
        participants: [{ fields: [{ label: "First Name", value: "Mia" }, { label: "Last Name", value: "Cooper" }, { label: "Barcode", value: "MOCK-1002-P1" }] }]
      }
    ]
  },
  {
    orderNumber: "MOCK-1003",
    status: "CANCELLED",
    supplierId: "MOCK-SUPPLIER",
    items: [
      {
        productCode: "PSLMYT",
        startTimeLocal: "2026-03-01T14:15:00+13:00",
        participants: [{ fields: [{ label: "First Name", value: "Noah" }, { label: "Last Name", value: "Morris" }, { label: "Barcode", value: "MOCK-1003-P1" }] }]
      }
    ]
  },
  {
    orderNumber: "MOCK-1004",
    status: "CONFIRMED",
    supplierId: "MOCK-SUPPLIER",
    items: [
      {
        productCode: "GLENAIR",
        startTimeLocal: "2026-03-02T08:45:00+13:00",
        participants: [
          { fields: [{ label: "First Name", value: "Isla" }, { label: "Last Name", value: "Carter" }, { label: "Barcode", value: "MOCK-1004-P1" }] },
          { fields: [{ label: "First Name", value: "Eli" }, { label: "Last Name", value: "Carter" }, { label: "Barcode", value: "MOCK-1004-P2" }] }
        ]
      }
    ]
  },
  {
    orderNumber: "MOCK-1005",
    status: "PENDING_SUPPLIER",
    supplierId: "MOCK-SUPPLIER",
    items: [
      {
        productCode: "ALPINE",
        startTimeLocal: "2026-03-02T10:30:00+13:00",
        participants: [
          { fields: [{ label: "First Name", value: "Sophie" }, { label: "Last Name", value: "King" }, { label: "Barcode", value: "MOCK-1005-P1" }] },
          { fields: [{ label: "First Name", value: "Leo" }, { label: "Last Name", value: "King" }, { label: "Barcode", value: "MOCK-1005-P2" }] },
          { fields: [{ label: "First Name", value: "Ruby" }, { label: "Last Name", value: "King" }, { label: "Barcode", value: "MOCK-1005-P3" }] }
        ]
      }
    ]
  }
];
