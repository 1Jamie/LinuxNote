const {
    app,
    BrowserWindow,
    BrowserView,
    ipcMain,
    Menu,
    Tray
} = require('electron')
const path = require('path')
const Store = require('electron-store');
//fix for windows installer
if (require('electron-squirrel-startup')) return app.quit();
let settingsWindow = null;
let mainWindow = null;
let view = null;
let tray = null;

//create the store

const schema = {
    homepage: {
        type: 'string',
        default: 'https://onenote.com/notebooks'
    },
    passLst: {
        type: 'string',
        default: 'https://google.com'
    },
    darkMode: {
        type: 'boolean',
        default: false
    },
    darkLevel: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 70
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
    }
};

const store = new Store({
    schema
});

const updateSettings = (values) => {
    logmsg('updating settings');
    let chngCnt = 0;
    //itterate through the values and update the settings
    for (const [key, value] of Object.entries(values)) {
        if (store.get(key) != value && (value != '' || value != null)) {
            //if the key is darkLevel then convert it to a number
            store.set(key, value);
            logmsg('setting', key, 'to', value);
            chngCnt++;
        }
    }
    //check if any of the values were changed
    if (chngCnt > 0) {
        //reload the main window and browser view
        mainWindow.reload();
        view.webContents.reload();
        logmsg('reloading main window');
    }
}

//custom function for logging if the dev tools are enabled
function logmsg(msg) {
    //check if the dev evn is set
    if (process.env.NODE_ENV === 'dev') {
        console.log(msg);
    }
}
logmsg('logmsg test');

//async function to create the tray and returns the tray object after it is added to the system tray
async function createTray() {
    //check if the tray is enabled in the settings and that the tray is not already created
    if (tray === null) {
        //create the tray
        tray = new Tray(__dirname + '/../onenote-e-icon.png')
        const contextMenu = Menu.buildFromTemplate([{
            label: 'OneNote-E',
            click: () => {
                mainWindow.show();
            }
        }, {
            label: 'Settings',
            click: () => {
                openSettings();
            }
        }, {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }, ])
        tray.setToolTip('OneNote-E')
        tray.setContextMenu(contextMenu)
    }
    return tray;
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

function openSettings() {
    //check if the settings window is already open
    if (settingsWindow === null) {
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
        //settingsWindow.openDevTools()
        //deal with closing the window
        settingsWindow.on('closed', () => {
            settingsWindow = null
            mainWindow.webContents.send('settings', 'close')
        })
        //open dev tools if the dev tools is enabled
        if (ndenv === 'dev') {
            settingsWindow.openDevTools()
        }
    } else {
        settingsWindow.show();
    }
}

function resizeBrowserView(minmax) {
    //resize the browser view
    if (minmax === true) {
        //create a timeout to wait for the window to be resized before resizing the browser view with it
        //this is to prevent the browser view from being resized before the window is
        let timeout = setTimeout(() => {
            view.setBounds({
                x: 0,
                y: 36,
                width: mainWindow.getBounds().width,
                height: mainWindow.getBounds().height - 35
            })
            clearTimeout(timeout);
        }, 70);
    } else {
        //if its not a min/max resize then just resize the browser view
        view.setBounds({
            x: 0,
            y: 36,
            width: mainWindow.getBounds().width,
            height: mainWindow.getBounds().height - 35
        })
    }
}

if (store.get('firstRun') == true) {
    store.set('firstRun', false);
    store.set('homepage', 'https://onenote.com/notebooks');
    store.set('passLst', 'https://google.com');
    store.set('DarkMode', false);
}

app.on('ready', () => {
    createWindow2()
    //if the tray is enabled then create the tray
    if (store.get('tray') === true) {
        createTray();
    }
    //logmsg("store path: " + store.path)
    mainWindow.loadURL('file://' + __dirname + '/pages/renderer.html')
    //create a browser view of the homepage
    view = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    })
    //get the lastOpen value from the store
    let lastOpen = store.get('lastOpen');

    mainWindow.setBrowserView(view)
    resizeBrowserView(false);
    //deal with window resizing for the browser view
    mainWindow.on('maximize', () => {
        resizeBrowserView(true);
    })
    mainWindow.on('unmaximize', () => {
        resizeBrowserView(true);
    })
    mainWindow.on('resize', () => {
        resizeBrowserView(false)
    })
    view.webContents.loadURL(lastOpen)
    //after the page has loaded
    view.webContents.on('dom-ready', () => {
        //strip the hostname from the url so we can use it
        let hostname = new URL(view.webContents.getURL()).hostname;
        let trimmedHostname = hostname.split('.').slice(1, -1).join('.');
    

        //check if the lastOpen value contains onenote or sharepoint
        if (store.get('homepage').includes(trimmedHostname)) {
            logmsg('homepage selected');
            //set the renderer's page element homePage to class disabled
            mainWindow.webContents.send('setTab', 'homepage');
        } else if (store.get('passLst').includes(trimmedHostname)) {
            logmsg('sharepoint selected');
            //set the renderer's page element serverlist to class disabled
            mainWindow.webContents.send('setTab', 'passList');
        }
    })
    //enable the dark mode listener if its enabled (this is not finished)
    view.webContents.on('did-navigate', (event, url) => {
        //check if the url is in onenote or sharepoint
        if (store.get('darkMode') === true) {
            if (url.includes('onenote.com') || url.includes('sharepoint.com')) {
                let darkLevel = store.get('darkLevel');
                //inject the css invert of 60% into the page and all text to white
                view.webContents.insertCSS(`html {-webkit-filter: invert(${darkLevel}%); filter: invert(${darkLevel}%); -webkit-transition: all 0.5s ease; transition: all 0.5s ease; color: white;}`)
            } else {
                logmsg('not one note or sharepoint, not filtering')
            }

        }
    })
    //check if we are running in dev mode
    ndenv = process.env.NODE_ENV
    logmsg("env is: " + ndenv)
    if (ndenv === 'dev') {
        mainWindow.webContents.openDevTools()
    }
})

//deal with tab swapping
ipcMain.on('tab', (event, arg) => {
    logmsg(arg)
})

//after the window is loaded create a listener for the ipcrenderer
ipcMain.on('topbar', (event, arg) => {
    //switch to deal with the different buttons
    switch (arg) {
        case 'close':
            //close the window
            let settingsWindow = BrowserWindow.fromId(2);
            //make sure the settings window is closed
            if (settingsWindow != null) {
                settingsWindow.close();
            }
            mainWindow.close()
            break;
        case 'min':
            //minimize the window
            mainWindow.minimize()
            logmsg('minimize')
            break;
        case 'minmax':
            //check if the window is maximized
            if (mainWindow.isMaximized()) {
                //if it is then unmaximize it
                mainWindow.unmaximize()
            } else {
                //if it isn't then maximize it
                mainWindow.maximize()
            }
            break;
        case 'home':
            //load the homepage
            view.webContents.loadURL(store.get('homepage', true))
            break;
        case 'passLst':
            //load the passlist
            view.webContents.loadURL(store.get('passLst', true))
            break;
        case 'settings':
            //open the settings window
            openSettings()
            break;
    }
})


//listener to open settings
ipcMain.on('settings', (event, arg) => {
    //get the settings from the store
    let settings = {
        homepage: store.get('homepage'),
        passLst: store.get('passLst'),
        darkMode: store.get('darkMode'),
        darkLevel: store.get('darkLevel'),
        tray: store.get('tray')
    }
    if (arg === 'focus') {
        settingsWindow.focus()
    } else if (arg === 'request') {
        //send the current settings to the requestor
        settingsWindow.webContents.send('settings', settings)
    } else {
        logmsg(arg)
        //set the settings in the store
        updateSettings(arg)
        settingsWindow.close()
    }
})


//listener to save settings
ipcMain.on('settings-page', (event, arg) => {
    logmsg(arg)
    updateSettings(arg)
    //close the settings window
    settingsWindow.close()
})


//close app when all windows are closed
app.on('window-all-closed', () => {
    //set the lastOpen value in the store
    store.set('lastOpen', view.webContents.getURL())
    logmsg('lastOpen: ' + store.get('lastOpen'))
    if (process.platform !== 'darwin') {
        app.quit()
    }
})