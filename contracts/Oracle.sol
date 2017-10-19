pragma solidity ^0.4.15;
contract Oracle {

    mapping(uint => bool) public votes;
    uint count = 0;

    event Message(string user, uint proposalId, string text, string to);

    function Oracle() {
    }

    function createProposal(string text, string to) public returns(bool success) {
        count++;
        Message("Daniel", count, text, to);
        return true;
    }

    function castVote(uint proposalId, bool vote) public returns(bool success) {
        votes[proposalId] = vote;
        return true;
    }
}