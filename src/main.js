const {
    app,
    BrowserWindow,
    BrowserView,
    ipcMain,
    ipcRenderer
} = require('electron')
const path = require('path')
const Store = require('electron-store');

//fix for windows installer
if (require('electron-squirrel-startup')) return app.quit();

//create the store
const store = new Store();

const schema = {
    homepage: {
        type: 'string',
        default: 'https://onenote.com/notebooks'
    },
    passLst: {
        type: 'string',
        default: 'https://google.com'
    },
    autoHideMenuBar: {
        type: 'boolean',
        default: true
    },
    firstRun: {
        type: 'boolean',
        default: true
    },
};

if (store.get('firstRun') == true) {
    store.set('firstRun', false);
    store.set('homepage', 'https://onenote.com/notebooks');
    store.set('passLst', 'https://google.com');
    store.set('autoHideMenuBar', true);
}

const updateSettings = (values) => {
    console.log('updating settings');
    let chngCnt = 0;
    //check if any of the array values are undefined or the same as the current value
    if (values[0] != undefined && values[0] != store.get('homepage') && values[0] != '') {
        //set the homepage
        store.set('homepage', values[0]);
        console.log("homepage set to", values[0]);
        chngCnt++;
    }
    if (values[1] != undefined && values[1] != store.get('passLst') && values[1] != '') {
        //set the passlist
        store.set('passLst', values[1]);
        console.log("passlist set to", values[1]);
        chngCnt++;
    }
    if (values[2] != undefined && values[2] != store.get('autoHideMenuBar') && values[2] != '') {
        //set the autohide
        store.set('autoHideMenuBar', values[2]);
        console.log("autohide set to", values[2]);
        chngCnt++;
    }
    //check if any of the values were changed
    if (chngCnt > 0) {
        //reload the main window
        mainWindow.reload();
    }
}

function createWindow2() {
    mainWindow = new BrowserWindow({
        title: app.name,
        autoHideMenuBar: true,
        frame: false,
        minWidth: 800,
        minHeight: 600,
        devTools: true,
        scrollHidden: true,
        icon: path.join(__dirname, 'onenote-e-icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        }
    })
}


app.on('ready', () => {
    const newbrowser = createWindow2()
    //show a loading message
    mainWindow.loadURL('file://' + __dirname + '/pages/renderer.html')
    //check if we are running in dev mode
    ndenv = process.env.NODE_ENV
    console.log(ndenv)
    if (ndenv === 'dev') {
        mainWindow.webContents.openDevTools()
    }
})

//deal with tab swapping
ipcMain.on('tab', (event, arg) => {
    console.log(arg)
})

//after the window is loaded create a listener for the ipcrenderer
ipcMain.on('topbar', (event, arg) => {
    if (arg === 'close') {
        //get the settings window
        let settingsWindow = BrowserWindow.fromId(2);
        //make sure the settings window is closed
        if (settingsWindow != null) {
            settingsWindow.close();
        }
        mainWindow.close()
    } else if (arg === 'minimize') {
        mainWindow.minimize()
    } else if (arg === 'minmax') {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow.maximize()
        }
    }
})

//listener to open settings
ipcMain.on('settings', (event, arg) => {
    //get the settings from the store
    let settings = {
        homepage: store.get('homepage'),
        passLst: store.get('passLst'),
        autoHideMenuBar: store.get('autoHideMenuBar')
    }
    if (arg === 'open') {
        //check if the settings window is already open
        settingsWindow = new BrowserWindow({
            title: 'Settings',
            autoHideMenuBar: true,
            frame: true,
            DevTools: true,
            minWidth: 350,
            minHeight: 600,
            width: 350,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        })
        settingsWindow.loadURL('file://' + __dirname + '/pages/settings.html')
        settingsWindow.openDevTools()
        //settingsWindow.openDevTools()
        //deal with closing the window
        settingsWindow.on('closed', () => {
            settingsWindow = null
            mainWindow.webContents.send('settings', 'close')
        })
    } else if (arg === 'focus') {
        settingsWindow.focus()
    } else if (arg === 'request-load') {
        //send the current settings to the requestor
        console.log('sending settings to main window');
        mainWindow.webContents.send('settings', [store.get('homepage'), store.get('passLst'), store.get('autoHideMenuBar')])
    } else if (arg === 'request') {
        //send the current settings to the requestor
        settingsWindow.webContents.send('settings', settings)
    }
})


//listener to save settings
ipcMain.on('settings-page', (event, arg) => {
    console.log(arg)
    updateSettings(arg)
    //close the settings window
    settingsWindow.close()
})


//close app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})