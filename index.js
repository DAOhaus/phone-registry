var express = require('express')
var app = express()
var bodyParser = require('body-parser');

var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545/"));
var contract = require('truffle-contract');
var oracleInstance;
var account;

var authToken = 'f6a10ec5d9caa62196b710c8beb1ca19';
var twilio = require('twilio')("AC7751eacc24d29aff68bd1b7baf1f71a3", authToken);

var sendMessage = function(user, proposalId, text, to){
    var messageText = user + " is proposing \"" + text + "\" respond with \"y" + proposalId + "\" to vote yes or \"n" + proposalId + "\" to vote no.";
    console.log(messageText, " sent to ", to);
    twilio.messages.create({
        to: "+"+to,
        from: "+14013563187",
        body: messageText,
    }, function(err, message) {
        console.log(err)
        console.log(message);
    });
}

fs.readFile('build/contracts/Oracle.json', (error, json) => {
    var json = JSON.parse(json);
    var Oracle = contract(json);

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
            var messageEvent = oracleInstance.Message({},{fromBlock: 'latest'});
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
    oracleInstance.createProposal("We should take a nap", "12082273646", {from:account}).then(function(tx){
        console.log('message sent');
    });
    response.send('Hello World!')
})

const MessagingResponse = require('twilio').twiml.MessagingResponse;

app.post('/sms', (req, res) => {
    console.log(req.body);
    var response = req.body.Body;
    var vote = response[0];
    var proposal = response.substring(1,response.length-1);
    const twiml = new MessagingResponse();
    if(vote == 'y' || vote == 'Y'){
        oracleInstance.castVote(parseInt(proposal), true,{from:account}).then(function(tx){
            console.log(tx)
        })
        twiml.message('You voted yes on proposal' + proposal);
    }else if(vote == 'n' || vote == 'N'){
        oracleInstance.castVote(parseInt(proposal), false,{from:account}).then(function(tx){
            console.log(tx)
        })
        twiml.message('You voted no on proposal' + proposal);
    }else{
        twiml.message('Invalid response. Please respond with y or n.');
    }
    
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})