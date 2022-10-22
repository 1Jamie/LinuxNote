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
    firstRun: {
        type: 'boolean',
        default: true
    },
    tray: {
        type: 'boolean',
        default: false
    }
};

const store = new Store({
    schema
});

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
    if (values[2] != undefined && values[2] != store.get('darkMode')) {
        //set the dark mode
        store.set('darkMode', values[2]);
        console.log("darkMode set to", values[2]);
        //reload the webview
        view.webContents.reload();
        chngCnt++;
    }
    if (values[3] != undefined && values[3] != store.get('tray')) {
        //set the tray
        store.set('tray', values[3]);
        console.log("tray set to", values[3]);
        chngCnt++;
    }
    //check if any of the values were changed
    if (chngCnt > 0) {
        //reload the main window
        mainWindow.reload();
    }
}

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
    //console.log("store path: " + store.path)
    mainWindow.loadURL('file://' + __dirname + '/pages/renderer.html')
    //create a browser view of the homepage
    view = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    })
    mainWindow.setBrowserView(view)
    resizeBrowserView(false)
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
    view.webContents.loadURL(store.get('homepage'))
    //enable the dark mode listener if its enabled (this is not finished)
    view.webContents.on('did-navigate', (event, url) => {
        //check if the url is in onenote or sharepoint
        if (store.get('darkMode') === true) {
            if (url.includes('onenote.com') || url.includes('sharepoint.com')) {
                //inject the css invert of 60% into the page and all text to white
                view.webContents.insertCSS('html {-webkit-filter: invert(70%); filter: invert(70%); -webkit-transition: all 0.5s ease; transition: all 0.5s ease; color: white;}')
            } else {
                console.log('not one note or sharepoint, not filtering')
            }

        }
    })
    //check if we are running in dev mode
    ndenv = process.env.NODE_ENV
    console.log("env is: " + ndenv)
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
            console.log('minimize')
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
        tray: store.get('tray')
    }
    if (arg === 'focus') {
        settingsWindow.focus()
    } else if (arg === 'request') {
        //send the current settings to the requestor
        settingsWindow.webContents.send('settings', settings)
    } else {
        console.log(arg)
        //set the settings in the store
        updateSettings(arg)
        settingsWindow.close()
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