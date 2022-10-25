const {app} = require('electron')

//setup object to export schema to main process
const schema = {
    tab1Url: {
        type: 'string',
        default: 'https://onenote.com/notebooks'
    },
    tab1Name: {
        type: 'string',
        default: 'Notebooks'
    },
    tab2Url: {
        type: 'string',
        default: 'https://google.com'
    },
    tab2Name: {
        type: 'string',
        default: 'Server List'
    },
    darkMode: {
        type: 'boolean',
        default: false
    },
    darkLevel: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 90
    },
    firstRun: {
        type: 'boolean',
        default: true
    },
    tray: {
        type: 'boolean',
        default: false
    },
    lastOpen: {
        type: 'string',
        default: 'https://onenote.com/notebooks'
    },
    version: {
        type: 'string',
        default: app.getVersion()
    }
};

//export the schema
module.exports = schema;