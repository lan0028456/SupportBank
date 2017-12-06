const fs = require('fs');
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
const command = 'List Sarah T';//Jon A/List All
logger.debug('Command input: '+command);
const filename='DodgyTransactions2015.csv';
logger.debug('File to be loaded: '+filename);

fs.readFile(filename, 'UTF-8', function(err, csv) {
    $.csv.toObjects(csv, {}, function(err, data) {
        logger.debug('Loading file '+filename);
        if (DataValidation(data)) {
            logger.debug('Data validation passed')
        }
        if (command==='List All'){
            let accounts=ListAll(data);
            console.log(accounts);
            logger.debug('List-All account produced');
        } else {
            let personalaccount=ListPersonalAccount(data,command);
            console.log(personalaccount);
            logger.debug('Personal account produced');
        }
    });
});



// functions
function DataValidation(data) {
    let check = true;
    for(let i=0; i<data.length; i++) {
        if (!+data[i].Amount) {
            logger.warn('Warning: Amount in line '+[i+2]+' is not a valid number!');
            check = false;
        } else if (!moment(data[i].Date, "DD/MM/YYYY").isValid()) {
            logger.warn('Warning: Date in line '+[i+2]+' is not a valid date!');
            check = false;
        }
    }
    return check
}
function ListAll(data) {
    let accounts={};
    for(let i=0; i<data.length; i++) {
        if (accounts[data[i].From]) {
            accounts[data[i].From] -= +data[i].Amount;
        } else {
            accounts[data[i].From] = -data[i].Amount;
        }
        if (accounts[data[i].To]) {
            accounts[data[i].To] += +data[i].Amount;
        } else {
            accounts[data[i].To] = +data[i].Amount;
        }
    }
    return accounts;
}

function GetTheName(command) {
    let thename='';
    for (let i=5;i<command.length;i++){
        thename+=command[i];
    }
    return thename;
}

function ListPersonalAccount(data,command){
    let personalaccount=[['Date','Narrative','Transaction']];
    for(let i=0; i<data.length; i++) {
        let money;
        let thename = GetTheName(command);
        if (data[i].From===thename) {
            money = -data[i].Amount;
            personalaccount.push([data[i].Date,data[i].Narrative,money]);
        } else if (data[i].To===thename) {
            money = +data[i].Amount;
            personalaccount.push([data[i].Date,data[i].Narrative,money]);
        }
    }
    return personalaccount;
}


