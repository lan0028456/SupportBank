const fs = require('fs');
const xml2json = require('xml2json');
const $ = jQuery = require('jquery');
require('jquery-csv/src/jquery.csv.js');
const readline = require('readline-sync');
const moment = require('moment');
const log4js = require('log4js');
log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' },
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});
const logger = log4js.getLogger();


logger.debug('Start');
console.log('\nPlease enter command (List All / List [Account]:');
//const command = readline.prompt();
const command = 'List All';//Jon A/List All
logger.debug('Command input: ' + command);
const filename = 'Transactions2012.xml';
logger.debug('File to be loaded: ' + filename);

let last3letters = filename.substr(filename.length-3,filename.length);
let last4letters = filename.substr(filename.length-4,filename.length);
if (last3letters === 'csv'){
    logger.debug('File to be loaded is in .csv format');
    fs.readFile(filename, 'UTF-8', function(err, csv) {
        $.csv.toObjects(csv, {}, function(err, data) {
            logger.debug('Loading file ' + filename);
            treatingData(data,command);
        });
    });
} else if (last4letters === 'json'){
    logger.debug('File to be loaded is in .json format');
    let data = fs.readFileSync(filename);
    let dataparse = JSON.parse(data);
    logger.debug('Loading file ' + filename);
    treatingData(dataparse,command);
} else if (last3letters === 'xml') {
    logger.debug('File to be loaded is in .xml format');
    fs.readFile(filename, function(err, data) {
        let dataparse = xml2obj(data);
        logger.debug('Loading file ' + filename);
        treatingData(dataparse,command);
    });
} else {
    logger.warn('Warning: file type not supported!')
}


// functions
function treatingData(data,command){
    if (dataValidation(data)) {
        logger.debug('Data validation passed')
    }
    if (command === 'List All'){
        let result = listAll(data);
        console.log(result);
        logger.debug('List-All account produced');
    } else {
        let personalaccount = listPersonalAccount(data,command);
        console.log(personalaccount);
        logger.debug('Personal account produced');
    }
}
function xml2obj(data){
    let dataJSON = xml2json.toJson(data);
    let dataJSONObj = JSON.parse(dataJSON);
    let dataTransaction = dataJSONObj.TransactionList.SupportTransaction;
    let dataparse = [];
    for(let i = 0; i < dataTransaction.length; i++){
        let obj = {Date:dataTransaction[i].Date,
            From:dataTransaction[i].Parties.From,
            To:dataTransaction[i].Parties.To,
            Narrative:dataTransaction[i].Description,
            Amount:dataTransaction[i].Value};
        dataparse.push(obj);
    }
    return dataparse;
}

function dataValidation(data) {
    let check = true;
    for(let i = 0; i < data.length; i++) {
        if (!+data[i].Amount) {
            logger.warn('Warning: Amount in line ' + [i+2] + ' is not a valid number!');
            check = false;
        } else if (!moment(data[i].Date, "DD/MM/YYYY").isValid() & !moment(data[i].Date, "YYYY-MM-DD").isValid() & !+data[i].Date) {
            logger.warn('Warning: Date in line ' + [i+2] + ' is not a valid date!');
            check = false;
        }
    }
    return check
}


function listAll(data) {
    let accounts = {};
    for(let i = 0; i < data.length; i++) {
        let from = Object.keys(data[1])[1];
        let to = Object.keys(data[1])[2];
        if (accounts[data[i][from]]) {
            accounts[data[i][from]] -= +data[i].Amount;
        } else {
            accounts[data[i][from]] = -data[i].Amount;
        }
        if (accounts[data[i][to]]) {
            accounts[data[i][to]] += +data[i].Amount;
        } else {
            accounts[data[i][to]] = +data[i].Amount;
        }
    }
    return accounts;
}

function listPersonalAccount(data,command){
    let account = [['Date','Narrative','Transaction']];
    data.forEach(transaction =>  {
        if (transaction.From === command.slice(5)) {
            account.push([transaction.Date, transaction.Narrative, -transaction.Amount]);
        } else if (transaction.To === command.slice(5))  {
            account.push([transaction.Date, transaction.Narrative, transaction.Amount]);
        }
    });
    return account;
}
