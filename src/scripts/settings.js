let ipcrenderer = require('electron').ipcRenderer;
let homepage, passlist, autohide;
//this one is hopefully going to be short

//function to send settings to ipcMain
function sendSettings() {
    //get the settings from the settings page
    homepage = document.getElementById("homePage").value;
    passlist = document.getElementById("passLst").value;
    autohide = document.getElementById("autohide").checked;
    //send the settings to the main process
    console.log("sending settings to main process", homepage, passlist, autohide);
    ipcrenderer.send("settings-page", [homepage, passlist, autohide]);
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
    autohide = arg.autoHideMenuBar;
    console.log("setting settings page values", homepage, passlist, autohide);
    document.getElementById("homePage").value = homepage;
    document.getElementById("passLst").value = passlist;
    document.getElementById("autohide").checked = autohide;

});

document.addEventListener("DOMContentLoaded", () => {

    //add a listener to the save button
    document.getElementById("saveBtn").addEventListener("click", () => {
        //send the settings to the main process
        sendSettings();
    });
});