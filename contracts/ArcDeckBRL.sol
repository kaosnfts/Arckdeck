// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Arckdeck PixFlow — ArcDeckBRL (aBRL)
/// @notice Token de teste para simular "valor Pix" em testnet (decimals=2).
/// @dev Projeto demonstrativo. "Pix" é marca registrada do Banco Central do Brasil.
/// @author kAosNFTs (Twitter/X) • kaosnft1 (Discord)
contract ArcDeckBRL {
    // Credits (verificável onchain)
    string public constant PROJECT = "Arckdeck PixFlow";
    string public constant AUTHOR_TWITTER = "kAosNFTs";
    string public constant AUTHOR_DISCORD = "kaosnft1";

    string public name = "ArcDeckBRL";
    string public symbol = "aBRL";
    uint8 public decimals = 2;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "to=0");
        uint256 bal = balanceOf[from];
        require(bal >= value, "balance");
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "allowance");

        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }

        _transfer(from, to, value);
        return true;
    }

    /// @notice Faucet onchain para testes (não usar em produção).
    function faucetMint(uint256 value) external {
        totalSupply += value;
        balanceOf[msg.sender] += value;
        emit Transfer(address(0), msg.sender, value);
    }
}
