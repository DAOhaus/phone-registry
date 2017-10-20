var express = require('express')
var app = express()
var bodyParser = require('body-parser');

var HDWalletProvider = require("truffle-hdwallet-provider");
var constants = require("./constants");

var fs = require('fs');
var Web3 = require('web3');
var provider = new Web3.providers.HttpProvider("http://localhost:8545/");
// var provider = new HDWalletProvider(constants.mnemonic, "https://ropsten.infura.io/" + constants.infura_apikey);
var web3 = new Web3(provider);
var contract = require('truffle-contract');
var registryInstance;
var account;

fs.readFile('build/contracts/Registry.json', (error, json) => {
    var json = JSON.parse(json);
    const Registry = contract(json);

    Registry.setProvider(web3.currentProvider);
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

        Registry.deployed().then(function(instance){
            registryInstance = instance;
        });
      });
});

app.set('port', (process.env.PORT || 3000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var randomString = function(){
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 6; i++ ){
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return text;
}

app.get('/', function(request, response) {
    response.send('Phone Registry')
})

app.post('/register', function(request, response) {
    const phone = request.body.phone;
    const address = request.body.address;
    if(!phone || phone.length < 9){
        response.status(500).send("Invalid Phone Number")
    }
    if(!address || address.length == 0){
        response.status(500).send("Invalid Address")
    }
    console.log(randomString());
    console.log(request.body)
    response.send(200);
})

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})