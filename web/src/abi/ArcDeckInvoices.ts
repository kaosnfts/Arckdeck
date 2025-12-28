export const ArcDeckInvoicesAbi = [
  { "type":"function", "name":"createInvoice", "stateMutability":"nonpayable",
    "inputs":[
      {"name":"token","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"dueAt","type":"uint64"},
      {"name":"refId","type":"bytes32"},
      {"name":"recipients","type":"address[]"},
      {"name":"bps","type":"uint16[]"}
    ],
    "outputs":[{"type":"uint256"}]
  },
  { "type":"function", "name":"paySandbox", "stateMutability":"nonpayable",
    "inputs":[{"name":"invoiceId","type":"uint256"},{"name":"pixTxId","type":"bytes32"}],
    "outputs":[]
  },
  { "type":"function", "name":"cancelInvoice", "stateMutability":"nonpayable",
    "inputs":[{"name":"invoiceId","type":"uint256"}],
    "outputs":[]
  },
  { "type":"function", "name":"getInvoice", "stateMutability":"view",
    "inputs":[{"name":"invoiceId","type":"uint256"}],
    "outputs":[{"components":[
      {"name":"merchant","type":"address"},
      {"name":"token","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"dueAt","type":"uint64"},
      {"name":"refId","type":"bytes32"},
      {"name":"status","type":"uint8"},
      {"name":"createdAt","type":"uint64"},
      {"name":"paidAt","type":"uint64"},
      {"name":"pixTxId","type":"bytes32"}
    ],"type":"tuple"}]
  },
  { "type":"event", "name":"InvoiceCreated", "anonymous": false,
    "inputs":[
      {"indexed":true,"name":"invoiceId","type":"uint256"},
      {"indexed":true,"name":"merchant","type":"address"},
      {"indexed":true,"name":"token","type":"address"},
      {"indexed":false,"name":"amount","type":"uint256"},
      {"indexed":false,"name":"dueAt","type":"uint64"},
      {"indexed":false,"name":"refId","type":"bytes32"}
    ]
  },
  { "type":"event", "name":"InvoicePaid", "anonymous": false,
    "inputs":[
      {"indexed":true,"name":"invoiceId","type":"uint256"},
      {"indexed":true,"name":"payer","type":"address"},
      {"indexed":false,"name":"amount","type":"uint256"},
      {"indexed":false,"name":"pixTxId","type":"bytes32"},
      {"indexed":false,"name":"paidAt","type":"uint64"}
    ]
  },
  { "type":"event", "name":"InvoiceCancelled", "anonymous": false,
    "inputs":[{"indexed":true,"name":"invoiceId","type":"uint256"}]
  },
  { "type":"event", "name":"SplitPaid", "anonymous": false,
    "inputs":[
      {"indexed":true,"name":"invoiceId","type":"uint256"},
      {"indexed":true,"name":"recipient","type":"address"},
      {"indexed":false,"name":"amount","type":"uint256"}
    ]
  }
] as const;
