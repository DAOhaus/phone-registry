pragma solidity ^0.4.15;
contract Registry {

    function Registry() {

    }

    function getHash(string message) public constant returns(bytes32 hash) {
        return keccak256(message);
    }
}