// agendaService.js
const Agenda = require('agenda');

const mongoConnectionString = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';

const agenda = new Agenda({
    db: { address: mongoConnectionString, collection: 'jobs' },
    processEvery: '1 minute' // 작업 체크 주기 (필요에 따라 조정)
});

module.exports = agenda;
