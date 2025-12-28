// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Like {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

/// @title Arckdeck PixFlow — ArcDeckInvoices
/// @notice Cobranças (invoices) + split + recibo para demonstração em testnet.
/// @dev Projeto demonstrativo. "Pix" é marca registrada do Banco Central do Brasil.
/// @author kAosNFTs (Twitter/X) • kaosnft1 (Discord)
contract ArcDeckInvoices {
    // Credits (verificável onchain)
    string public constant PROJECT = "Arckdeck PixFlow";
    string public constant AUTHOR_TWITTER = "kAosNFTs";
    string public constant AUTHOR_DISCORD = "kaosnft1";

    uint16 public constant MAX_BPS = 10_000;

    enum Status { NONE, PENDING, PAID, CANCELLED }

    struct Split {
        address recipient;
        uint16 bps; // 10000 = 100%
    }

    struct Invoice {
        address merchant;
        address token;
        uint256 amount;
        uint64 dueAt;        // 0 = sem vencimento
        bytes32 refId;       // hash/identificador do pedido
        Status status;
        uint64 createdAt;
        uint64 paidAt;
        bytes32 pixTxId;     // identificador simulado
    }

    uint256 public nextInvoiceId = 1;

    mapping(uint256 => Invoice) private invoices;
    mapping(uint256 => Split[]) private invoiceSplits;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed merchant,
        address indexed token,
        uint256 amount,
        uint64 dueAt,
        bytes32 refId
    );

    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount,
        bytes32 pixTxId,
        uint64 paidAt
    );

    event SplitPaid(uint256 indexed invoiceId, address indexed recipient, uint256 amount);
    event InvoiceCancelled(uint256 indexed invoiceId);

    function createInvoice(
        address token,
        uint256 amount,
        uint64 dueAt,
        bytes32 refId,
        address[] calldata recipients,
        uint16[] calldata bps
    ) external returns (uint256 invoiceId) {
        require(token != address(0), "token=0");
        require(amount > 0, "amount=0");
        require(recipients.length == bps.length, "split len");

        uint256 totalBps = 0;
        for (uint256 i = 0; i < bps.length; i++) {
            require(recipients[i] != address(0), "recipient=0");
            require(bps[i] > 0, "bps=0");
            totalBps += bps[i];
            invoiceSplits[nextInvoiceId].push(Split({recipient: recipients[i], bps: bps[i]}));
        }
        require(totalBps <= MAX_BPS, "bps>100%");

        invoiceId = nextInvoiceId++;

        invoices[invoiceId] = Invoice({
            merchant: msg.sender,
            token: token,
            amount: amount,
            dueAt: dueAt,
            refId: refId,
            status: Status.PENDING,
            createdAt: uint64(block.timestamp),
            paidAt: 0,
            pixTxId: bytes32(0)
        });

        emit InvoiceCreated(invoiceId, msg.sender, token, amount, dueAt, refId);
    }

    /// @notice Pagamento sandbox: puxa tokens do pagador, aplica split e envia restante ao merchant.
    function paySandbox(uint256 invoiceId, bytes32 pixTxId) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status == Status.PENDING, "not pending");
        if (inv.dueAt != 0) require(block.timestamp <= inv.dueAt, "expired");

        inv.status = Status.PAID;
        inv.paidAt = uint64(block.timestamp);
        inv.pixTxId = pixTxId;

        require(IERC20Like(inv.token).transferFrom(msg.sender, address(this), inv.amount), "transferFrom fail");

        uint256 paidOut = 0;
        Split[] storage s = invoiceSplits[invoiceId];

        for (uint256 i = 0; i < s.length; i++) {
            uint256 part = (inv.amount * s[i].bps) / MAX_BPS;
            if (part > 0) {
                paidOut += part;
                require(IERC20Like(inv.token).transfer(s[i].recipient, part), "split transfer fail");
                emit SplitPaid(invoiceId, s[i].recipient, part);
            }
        }

        uint256 rest = inv.amount - paidOut;
        require(IERC20Like(inv.token).transfer(inv.merchant, rest), "merchant transfer fail");

        emit InvoicePaid(invoiceId, msg.sender, inv.amount, pixTxId, inv.paidAt);
    }

    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.merchant == msg.sender, "not merchant");
        require(inv.status == Status.PENDING, "not pending");
        inv.status = Status.CANCELLED;
        emit InvoiceCancelled(invoiceId);
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    function getSplits(uint256 invoiceId) external view returns (address[] memory recipients, uint16[] memory bps) {
        Split[] storage s = invoiceSplits[invoiceId];
        recipients = new address[](s.length);
        bps = new uint16[](s.length);
        for (uint256 i = 0; i < s.length; i++) {
            recipients[i] = s[i].recipient;
            bps[i] = s[i].bps;
        }
    }
}
