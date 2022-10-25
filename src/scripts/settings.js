const { version } = require('store');

let ipcrenderer = require('electron').ipcRenderer;
let homepage, passlist, darkMode, tray;

//our settings list to make adding new settings easier, will be used after the whole settings schema is redone (aka not yet)
let settingsList = [
    'tab1Name',
    'tab1Url',
    'tab2Name',
    'tab2Url',
    'darkMode',
    'darkLevel',
    'tray'
];


//function to send settings to ipcMain
function sendSettings() {
    //get the settings from the settings page
    //make an object with key value pairs to send to ipcMain
    let settings = {
        tab1Url: document.getElementById("tab1Url").value,
        tab1Name: document.getElementById("tab1Name").value,
        tab2Url: document.getElementById("tab2Url").value,
        tab2Name: document.getElementById("tab2Name").value,
        darkMode: document.getElementById("darkMode").checked,
        darkLevel: parseInt(document.getElementById("darkLevel").value),
        tray: document.getElementById("tray").checked
    }
    //check if tab1Url and tab2Url are prefxied with http:// or https://
    if (settings.tab1Url.substring(0, 7) !== "http://" && settings.tab1Url.substring(0, 8) !== "https://") {
        settings.tab1Url = "https://" + settings.tab1Url;
    }
    if (settings.tab2Url.substring(0, 7) !== "http://" && settings.tab2Url.substring(0, 8) !== "https://") {
        settings.tab2Url = "https://" + settings.tab2Url;
    }
    //send the settings to the main process
    console.log("sending settings to main process", settings);
    ipcrenderer.send("settings", settings);
}

function changeDrkLbl() {
    document.getElementById("darkLabel").innerHTML = "Invert Level: " + document.getElementById("darkLevel").value + "% ";
}

//while we start up lets get the settings from the main process
ipcrenderer.send("settings", "request");
console.log("requesting settings from main process");
//listen for the response
ipcrenderer.on("settings", (event, arg) => {
    console.log("received settings from main process", arg);
    //set the values of the settings page
    tab1Name = arg.tab1Name;
    tab1 = arg.tab1Url;
    tab2Name = arg.tab2Name;
    tab2 = arg.tab2Url;
    tray = arg.tray;

    //get the version element and set the version
    document.getElementById("version").innerHTML = "Version: " + arg.version;

    //set the height of settingsBody to the height of the window
    document.getElementById("settingsBody").style.height = window.innerHeight + "px";
    //if dark mode is disabled then disable the dark level slider
    if (arg.darkMode===false) {
        document.getElementById("darkLevel").disabled = true;
        //set the bodys class to bodyLight
        document.body.className = "bodyLight";
    } else {
        //set the body to class bodyDark
        document.body.className = "bodyDark";
    }

    //for each arg in the settings object set the value of the input to the value of the arg
    for (let i = 0; i < settingsList.length; i++) {
        //check if the setting is a boolean
        if (typeof arg[settingsList[i]] === "boolean") {
            //if it is a boolean then set the checked value of the input to the value of the arg
            document.getElementById(settingsList[i]).checked = arg[settingsList[i]];
        } else {
            //if it is not a boolean then set the value of the input to the value of the arg
            document.getElementById(settingsList[i]).value = arg[settingsList[i]];
        }
    }
    //create listener for page resize and adjust the height of settingsBody to the height of the window
    window.addEventListener("resize", () => {
        //set the max height of settingsBody to the height of the window
        document.getElementById("settingsBody").style.height = window.innerHeight + "px";
        //set the overflow of settingsBody to scroll
        document.getElementById("settingsBody").style.overflow = "scroll";
    });
    changeDrkLbl();

});

//add an onclick listener to the dark mode checkbox
document.getElementById("darkMode").addEventListener("click", () => {
    //if dark mode is disabled then disable the dark level slider
    if (document.getElementById("darkMode").checked===false) {
        document.getElementById("darkLevel").disabled = true;
    } else {
        document.getElementById("darkLevel").disabled = false;
    }
});

//add a listener to the dark level slider for value changes and update the label
document.getElementById("darkLevel").addEventListener("input", () => {
    changeDrkLbl();
});

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("githubLink").addEventListener("click", () => {
        require('electron').shell.openExternal("https://github.com/1jamie/linuxnote");
    });
    //add a listener to the save button
    document.getElementById("saveBtn").addEventListener("click", () => {
        //send the settings to the main process
        sendSettings();
    });
});