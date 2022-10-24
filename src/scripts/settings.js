let ipcrenderer = require('electron').ipcRenderer;
let homepage, passlist, darkMode, tray;
//this one is hopefully going to be short

//function to send settings to ipcMain
function sendSettings() {
    //get the settings from the settings page
    //make an object with key value pairs to send to ipcMain
    let settings = {
        homepage: document.getElementById("homePage").value,
        passLst: document.getElementById("passLst").value,
        darkMode: document.getElementById("darkMode").checked,
        darkLevel: parseInt(document.getElementById("darkLevel").value),
        tray: document.getElementById("tray").checked
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
    homepage = arg.homepage;
    passlist = arg.passLst;
    tray = arg.tray;
    //if dark mode is disabled then disable the dark level slider
    if (arg.darkMode===false) {
        document.getElementById("darkLevel").disabled = true;
    } else {
        //make the background black and all the text in the page white
        document.body.style.backgroundColor = "black";
        document.body.style.color = "white";
    }
    //console.log("setting settings page values", homepage, passlist, darkMode, tray);
    document.getElementById("homePage").value = homepage;
    document.getElementById("passLst").value = passlist;
    document.getElementById("darkMode").checked = arg.darkMode;
    document.getElementById("tray").checked = tray;
    document.getElementById("darkLevel").value = arg.darkLevel;
    //update the dark level slider label
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

    //add a listener to the save button
    document.getElementById("saveBtn").addEventListener("click", () => {
        //send the settings to the main process
        sendSettings();
    });
});