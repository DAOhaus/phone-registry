var express = require('express')
var app = express()
var bodyParser = require('body-parser');

var HDWalletProvider = require("truffle-hdwallet-provider");
var constants = require("./constants");

var fs = require('fs');
var Web3 = require('web3');
// var provider = new Web3.providers.HttpProvider("http://localhost:8545/");
var provider = new HDWalletProvider(constants.mnemonic, "https://ropsten.infura.io/" + constants.infura_apikey);
var web3 = new Web3(provider);
var contract = require('truffle-contract');
var oracleInstance;
var account;

var authToken = 'a08a2c86eb20e3d906b86f513f756c1c';
var twilio = require('twilio')(constants.twilioAccountNumber, constants.twilioAuthToken);
var fromNumber = constants.twilioFromNumber;
var testPhoneNumber = constants.testPhoneNumber

var sendMessage = function(user, proposalId, text, to){
    const messageText = user + " is proposing \"" + text + "\" respond with \"Y" + proposalId + "\" to vote yes or \"N" + proposalId + "\" to vote no.";
    twilio.messages.create({
        to: "+"+to,
        from: fromNumber,
        body: messageText,
    }, function(err, message) {
        console.log(err)
        console.log(message);
    });
}

fs.readFile('build/contracts/Oracle.json', (error, json) => {
    var json = JSON.parse(json);
    const Oracle = contract(json);

    Oracle.setProvider(web3.currentProvider);
      web3.eth.getAccounts(function(err, accs) {
        if (err != null) {
          alert("There was an error fetching your accounts.");
          return;
        }
        if (accs.length == 0) {
          alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
          return;
        }
    
        accounts = accs;
        account = accounts[0];

        Oracle.deployed().then(function(instance){
            oracleInstance = instance;
            const messageEvent = oracleInstance.Message({},{fromBlock: 'latest'});
            messageEvent.watch(function(error, result){
                console.log(result);
                sendMessage(result.args.user, result.args.proposalId, result.args.text, result.args.to);
            });
        });
      });
});

app.set('port', (process.env.PORT || 3000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(request, response) {
    console.log('sending message')
    oracleInstance.createProposal("We should take a nap", testPhoneNumber, {from:account}).then(function(tx){
        console.log(tx);
    });
    response.send('Hello World!')
})

const MessagingResponse = require('twilio').twiml.MessagingResponse;

app.post('/sms', (req, res) => {
    console.log(req.body);
    const response = req.body.Body;
    const vote = response[0];
    const proposal = parseInt(response.substring(1,response.length-1));
    const votedYes = vote == 'y' || vote == 'Y';
    const votedNo = vote == 'n' || vote == 'N';
    let message;

    if(isNaN(proposal)){
        message = "Invalid response. Please respond with a proposal number."
    }else if(!votedYes && !votedNo){
        message = "Invalid response. Please respond with Y or N."
        oracleInstance.castVote(parseInt(proposal), true,{from:account}).then(function(tx){
            console.log(tx)
        })
        
    }else{
        if(votedYes){
            message = "You voted yes on proposal" + proposal + ".";
        }else{
            message = "You voted no on proposal" + proposal + ".";
        }
        oracleInstance.castVote(parseInt(proposal), votedYes,{from:account}).then(function(tx){
            console.log(tx)
        })
    }

    const twiml = new MessagingResponse();
    twiml.message(message);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})