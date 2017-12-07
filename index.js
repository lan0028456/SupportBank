const fs = require('fs');
const xml2json = require('xml2json');
const $ = jQuery = require('jquery');
require('jquery-csv/src/jquery.csv.js');
const readline = require('readline-sync');
const moment = require('moment');
const log4js = require('log4js');
const path = require('path');
require('moment-msdate');
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

console.log('\nPlease enter your command to import file (Import [filename])');
//const filecommand = readline.prompt();
const filecommand = 'Import Transactions2014.csv';
const filename = filecommand.slice(7);
logger.debug('Command input: ' + filecommand);

console.log('\nPlease enter command (List All / List [Account]:');
//const command = readline.prompt();
const command = 'List Jon A';//Jon A/List All
logger.debug('Command input: ' + command);

logger.debug('File to be loaded: ' + filename);

if (path.extname(filename) === '.csv'){
    logger.debug('File to be loaded is in .csv format');
    fs.readFile(filename, 'UTF-8', function(err, csv) {
        $.csv.toObjects(csv, {}, function(err, data) {
            logger.debug('Loading file ' + filename);
            let dataparse = classcsv(data);
            dataProcessing(dataparse,command);
        });
    });
} else if (path.extname(filename) === '.json'){
    logger.debug('File to be loaded is in .json format');
    let data = fs.readFileSync(filename);
    let dataparse = classjson(data);
    logger.debug('Loading file ' + filename);
    dataProcessing(dataparse,command);
} else if (path.extname(filename) === '.xml') {
    logger.debug('File to be loaded is in .xml format');
    fs.readFile(filename, function(err, data) {
        let dataparse = classxml(data);
        logger.debug('Loading file ' + filename);
        dataProcessing(dataparse,command);
    });
} else {
    logger.warn('Warning: file type not supported!')
}


// functions
function dataProcessing(data,command){
    if (dataValidation(data)) {
        logger.debug('Data validation passed')
    }
    if (command === 'List All'){
        let result = listAll(data);
        console.log('The accounts of all users: ');
        console.log('Name:  Account:');

        for (let i =0; i < Object.keys(result).length; i++){
            console.log(Object.keys(result)[i] + ': ' + result[Object.keys(result)[i]]);
        }

        logger.debug('List-All account produced');
    } else {
        let personalaccount = listPersonalAccount(data,command);
        console.log('The accounts of ' + command.slice(5) + ': ');
        console.log('Transaction Date    Reason    Amount');
        personalaccount.forEach(line =>  {
            console.log(line[0].slice(10) + '   ' + line[1] + '   ' + line[2]);
        });
        //console.log(personalaccount);
        logger.debug('Personal account produced');
    }
}

function classcsv(data){
    let dataparse=[];
    for(let i = 0; i < data.length; i++) {
        if (moment(data[i].Date, "DD/MM/YYYY").isValid()) {
            data[i].Date = moment(data[i].Date, "DD/MM/YYYY").toISOString();
        } else {
            console.log('Date \'' + data[i].Date + '\' in line ' + [i+2] + ' is not a valid date!');
            console.log('Please check and type in the correct Date (DD/MM/YYYY): ');
            data[i].Date = moment(readline.prompt(), "DD/MM/YYYY").toISOString();
            logger.debug('Date in line ' + [i+2] + ' was not valid, fixed by user as ' + data[i].Date);
        }
        let obj = new Transaction(data[i].Date,
            data[i].From,
            data[i].To,
            data[i].Narrative,
            data[i].Amount);
        dataparse.push(obj);
    }
    return dataparse;
}

function classjson(data){
    let dataparse = JSON.parse(data);
    for(let i = 0; i < data.length; i++) {
        if (moment(data[i].Date, "YYYY-MM-DD").isValid()) {
            data[i].Date = moment(data[i].Date, "YYYY-MM-DD").toISOString();
        } else {
            console.log('Date \'' + data[i].Date + '\' in line ' + [i+2] + ' is not a valid date!');
            console.log('Please check and type in the correct Date (DD/MM/YYYY): ');
            data[i].Date = moment(readline.prompt(), "DD/MM/YYYY").toISOString();
            logger.debug('Date in line ' + [i+2] + ' was not valid, fixed by user as ' + data[i].Date);
        }
        let obj = new Transaction(data[i].Date,
            data[i].FromAccount,
            data[i].ToAccount,
            data[i].Narrative,
            data[i].Amount);
        dataparse.push(obj);
    }
    return dataparse;
}

function classxml(data){
    let dataTransaction = JSON.parse(xml2json.toJson(data)).TransactionList.SupportTransaction;
    let dataparse = [];
    for(let i = 0; i < dataTransaction.length; i++) {
        if (dataTransaction[i].date > 40000) {
            dataTransaction[i].date = moment.fromOADate(dataTransaction[i].date).toISOString();
        } else {
            console.log('Date \'' + dataTransaction[i].Date + '\' in line ' + [i+2] + ' is not a valid date!');
            console.log('Please check and type in the correct Date (DD/MM/YYYY): ');
            dataTransaction[i].Date = moment(readline.prompt(), "DD/MM/YYYY").toISOString();
            logger.debug('Date in line ' + [i+2] + ' was not valid, fixed by user as ' + dataTransaction[i].Date);
        }
        let obj = new Transaction(dataTransaction[i].Date,
            dataTransaction[i].Parties.From,
            dataTransaction[i].Parties.To,
            dataTransaction[i].Description,
            dataTransaction[i].Value);
        dataparse.push(obj);
    }
    return dataparse;
}

function dataValidation(data) {
    let check = true;
    for(let i = 0; i < data.length; i++) {
        if (!+data[i].amount) {
            console.log('Warning: Amount in line ' + [i+2] + ' is not a valid number!');
            console.log('Please check and type in the correct value: ');
            data[i].amount = readline.prompt();
            check = false;
            logger.debug('Amount in line ' + [i+2] + ' was not valid, fixed by user as ' + data[i].amount);
        }
    }
    return check
}

function listAll(data) {
    let accounts = [];
    data.forEach(transaction =>  {
        logger.trace('value = ' + transaction.amount);
        if (accounts[transaction.from]) {
            logger.trace('[from] from ' + accounts[transaction.from]);
            accounts[transaction.from] = Math.round((accounts[transaction.from] - transaction.amount)*100)/100;
            logger.trace('         to ' + accounts[transaction.from]);
        } else {
            accounts[transaction.from] = Math.round((-transaction.amount)*100)/100;
            logger.trace('[from]   to ' + accounts[transaction.from]);
        }
        if (accounts[transaction.to]) {
            logger.trace('[to]   from ' + accounts[transaction.to]);
            accounts[transaction.to] = Math.round((accounts[transaction.to] + transaction.amount)*100)/100;
            logger.trace('         to ' + accounts[transaction.to]);
        } else {
            accounts[transaction.to] = Math.round((transaction.amount)*100)/100;
            logger.trace('[to]     to ' + accounts[transaction.to]);
        }
    });
    return accounts;
}

function listPersonalAccount(data,command){
    let account = [];
    logger.debug('Name of the account holder: ' + command.slice(5));
    data.forEach(transaction =>  {
        if (transaction.from === command.slice(5)) {
            logger.trace('Transaction to ' + transaction.to);
            account.push([transaction.date, transaction.narrative, -transaction.amount]);
        } else if (transaction.to === command.slice(5))  {
            logger.trace('Transaction from ' + transaction.from);
            account.push([transaction.date, transaction.narrative, transaction.amount]);
        }
    });
    return account;
}

class Transaction {
    constructor(date, from, to, narrative, amount) {
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = +amount;
    };
}