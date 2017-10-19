pragma solidity ^0.4.15;
contract Oracle {

    event Message(string text, string to);

    function Oracle() {
    }

    function sendMessage(string text, string to) public returns(bool success) {
        Message(text, to);
        return true;
    }
}