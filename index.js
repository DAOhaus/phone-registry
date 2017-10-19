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

var sendMessage = function(text, to){
    console.log(text, " sent to ", to);
    // twilio.messages.create({
    //     to: "+"+to,
    //     from: "+14013563187",
    //     body: text,
    // }, function(err, message) {
    //     console.log(err)
    //     console.log(message);
    // });
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
                sendMessage(result.args.text, result.args.to);
            });
        });
      });
});

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(request, response) {
    oracleInstance.sendMessage("hi john", "12082273646", {from:account}).then(function(tx){
        console.log('message sent');
    });
    response.send('Hello World!')
})

const MessagingResponse = require('twilio').twiml.MessagingResponse;

app.post('/sms', (req, res) => {
    console.log(req.body);
    const twiml = new MessagingResponse();
    twiml.message('The Robots are no longer coming!');
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})