const {
    app,
    BrowserWindow,
    BrowserView,
    ipcMain,
    Menu,
    Tray,
    shell
} = require('electron')
const path = require('path')
const Store = require('electron-store');
//import schema
const schema = require('./scripts/schema.js');

//fix for windows installer bug of opening the app multiple times during install
if (require('electron-squirrel-startup')) return app.quit();
//just declare the variables we will need globally
let settingsWindow = null;
let mainWindow = null;
let view = null;
let tray = null;

const store = new Store({
    schema
});

//check if the key homepage is set and if so move it to tab1Url, basically a migration if the users store is old since its the only change and i dont want to do a migration schema
if (store.get('homepage') != null || store.get('passLst') != null) {
    console.log('migrating config store to new schema');
    if (store.get('homepage')) {
        console.log('moving homepage to tab1');
        store.set('tab1Url', store.get('homepage'));
        store.delete('homepage');
    }
    //do the same for passlst
    if (store.get('passLst')) {
        console.log('migrating passList to tab2');
        store.set('tab2Url', store.get('passLst'));
        store.delete('passLst');
    }
    //update the version in the store
    store.set('version', app.getVersion());
}

//this function updates the settings in the store
const updateSettings = (values) => {
    logmsg('updating settings');
    let chngCnt = 0;
    //itterate through the values and update the settings
    for (const [key, value] of Object.entries(values)) {
        if (store.get(key) != value && (value != '' || value != null)) {
            //if the key is darkLevel then convert it to a number
            store.set(key, value);
            logmsg('setting ' + key + ' to ' + value);
            if (key != 'version' && key != 'tray') {
                chngCnt++;
            }
        }
    }
    //check if any of the values were changed
    if (chngCnt > 0) {
        //save the current page to lastOpen before reloading so that it opens to the same page
        store.set('lastOpen', view.webContents.getURL());
        //reload the main window and browser view
        mainWindow.reload();
        view.webContents.reload();
        logmsg('reloading main window');
    }
}

//function that takes an array of names and returns an object of the names and their values
function getSettings(names) {
    let settings = {};
    for (let i = 0; i < names.length; i++) {
        if (names[i] === 'version') {
            settings[names[i]] = app.getVersion();
        } else {
            settings[names[i]] = store.get(names[i]);
        }
    }
    return settings;
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
        tray = new Tray(__dirname + '/../linuxnote-icon.png')
        const contextMenu = Menu.buildFromTemplate([{
            label: 'LinuxNote',
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
        tray.setToolTip('LinuxNote')
        tray.setContextMenu(contextMenu)
    }
    return tray;
}


function createWindow() {
    mainWindow = new BrowserWindow({
        title: app.name,
        autoHideMenuBar: true,
        frame: false,
        minWidth: 800,
        minHeight: 600,
        devTools: true,
        scrollHidden: true,
        icon: path.join(__dirname, 'linuxnote-icon.png'),
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
            if (mainWindow != null) {
                settingsWindow = null
                mainWindow.webContents.send('settings', 'close')
            }
        })
        //open dev tools if the dev tools is enabled
        if (ndenv === 'dev') {
            settingsWindow.openDevTools()
        }
    } else {
        settingsWindow.show();
    }
}

//function to send the tabnames to the main window
function sendTabNames() {
    //get the tab names from the store
    let tabNames = {
        tab1Name: store.get('tab1Name'),
        tab2Name: store.get('tab2Name'),
    }
    //send the tab names to the main window
    mainWindow.webContents.send('tabNames', tabNames);
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
        }, 10);
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
    //leave this here for in case i want to change some things on first run
}

//our main even chain happens here
app.on('ready', () => {
    createWindow()
    //if the tray is enabled then create the tray
    if (store.get('tray') === true) {
        createTray();
    }
    //logmsg("store path: " + store.path)
    mainWindow.loadURL('file://' + __dirname + '/pages/renderer.html')
    //create a browser view of the lastloaded url if it is set
    view = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    })

    //add a listener for if the main window is closed
    mainWindow.on('closed', () => {
        mainWindow = null
        //check if settings window is open and close it if it is
        if (settingsWindow != null) {
            settingsWindow.close();
        }
    })

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    //set the browser view to the main window
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
    //a listener for if its tiled (really just watch for it being moved and not maximized)
    mainWindow.on('move', () => {
        if (mainWindow.isMaximized() === false) {
            resizeBrowserView(true);
        }
    })
    //get the lastOpen value from the store
    let lastOpen = store.get('lastOpen');
    //check if the lastOpen value is set and if it is then load it, if not then load tab1Url
    if (lastOpen != null) {
        view.webContents.loadURL(lastOpen)
    } else {
        view.webContents.loadURL(store.get('tab1Url'))
    }

    //enable the dark mode listener if its enabled (this is not finished)
    view.webContents.on('did-navigate', (event, url) => {
        //create base names for each tab eg onenote or sharepoint
        let tab1Hostname = new URL(store.get('tab1Url')).hostname;
        let tab2Hostname = new URL(store.get('tab2Url')).hostname;
        //grab the last two parts of the url
        let tab1Base = tab1Hostname.split('.').slice(-2).join('.');
        let tab2Base = tab2Hostname.split('.').slice(-2).join('.');
        //see if the url is the same hostname as the tab1 or tab2 url
        if (url.includes(tab1Base) || url.includes(tab2Base) || url.includes('localhost') || url.includes('onenote.com') || url.includes('sharepoint.com')) {
            //see if the dark mode is enabled
            if (store.get('darkMode') === true) {
                let darkLevel = store.get('darkLevel');
                //inject the css invert of specified amount into the page and all text to white
                view.webContents.insertCSS(`html {-webkit-filter: invert(${darkLevel}%); filter: invert(${darkLevel}%); -webkit-transition: all 0.5s ease; transition: all 0.5s ease; color: white;}`)
            }
        } else {
            //send it to the browser and  cancel the event
            logmsg('not ours')
        }
    })
    //check if we are running in dev mode
    ndenv = process.env.NODE_ENV
    logmsg("env is: " + ndenv)
    if (ndenv === 'dev') {
        mainWindow.webContents.openDevTools()
    }
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
            //deal with the minimize/maximize button
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize()
            } else {
                mainWindow.maximize()
            }
            break;
        case 'tab1':
            //load the tab1 url
            view.webContents.loadURL(store.get('tab1Url', true))
            break;
        case 'tab2':
            //load the tab2 url
            view.webContents.loadURL(store.get('tab2Url', true))
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
    let settingsList = ['tab1Url', 'tab1Name', 'tab2Url', 'tab2Name', 'tray', 'darkMode', 'darkLevel', 'version'];
    let settings = getSettings(settingsList);
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

//listener for when the renderer is ready for the tab names
ipcMain.on('sendTabNames', (event, arg) => {
    sendTabNames()
    logmsg('sent tab names')
})

//close app when all windows are closed
app.on('window-all-closed', () => {
    //set the lastOpen value in the store
    store.set('lastOpen', view.webContents.getURL())
    logmsg('lastOpen: ' + store.get('lastOpen'))
    if (process.platform !== 'darwin') {
        app.quit()
    }
    //if all windows are closed then quit the app
    if (mainWindow === null) {
        app.quit()
    }
})