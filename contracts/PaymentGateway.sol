// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract PaymentGateway {
    address public owner;
    mapping(bytes32 => bool) public processedOrders;

    event OrderPaid(bytes32 indexed orderId, address indexed payer, address indexed merchant, address token, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function payOrder(bytes32 orderId, address token, address merchant, uint256 amount) external {
        require(!processedOrders[orderId], "Order already processed");
        require(token != address(0), "Invalid token");
        require(merchant != address(0), "Invalid merchant");
        require(amount > 0, "Invalid amount");

        processedOrders[orderId] = true;
        require(IERC20(token).transferFrom(msg.sender, merchant, amount), "Transfer failed");

        emit OrderPaid(orderId, msg.sender, merchant, token, amount);
    }

    function setProcessed(bytes32 orderId, bool processed) external {
        require(msg.sender == owner, "Not authorized");
        processedOrders[orderId] = processed;
    }
}
