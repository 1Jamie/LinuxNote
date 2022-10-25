let ipcrenderer = require('electron').ipcRenderer;

console.log('starting renderer.js')

//use this to clear the disable class on all the buttons (not in use for now)
function clearDisable() {
    let disabled = document.querySelectorAll('.disabled');
    for (let i = 0; i < disabled.length; i++) {
        disabled[i].classList.remove('disabled');
    }
}

//tell the main process we are ready to receive the tab names
ipcrenderer.send('sendTabNames');
//set the buttons labels when main process sends them
ipcrenderer.on('tabNames', (event, arg) => {
    console.log('received tab names from main process', arg);
    document.getElementById('tab1Btn').innerHTML = arg.tab1Name;
    document.getElementById('tab2Btn').innerHTML = arg.tab2Name;
});

/* turned off for now as i dont know if i want this functionality
ipcrenderer.on('setTab' , (event, arg) => {
    //console.log('received setTab', arg);
    //clearDisable();
    if(arg === 'tab1') {
        document.getElementById('tab1Btn').classList.add('disabled');
    } else if (arg === 'tab2') {
        document.getElementById('tab2Btn').classList.add('disabled');
    } else if (arg === 'na') {
        //just do nothing
    }
});*/

//run all this after the page loads
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoad");

    //set all the buttons up to send actions to the main process
    if (document.querySelector("#closeBtn")) {
        document.querySelector("#closeBtn").addEventListener("click", () => {
            ipcrenderer.send("topbar", "close");
        });
    }

    if (document.getElementById('minBtn')) {
        document.querySelector("#minBtn").addEventListener("click", () => {
            ipcrenderer.send("topbar", "min");
        });
    }

    if (document.querySelector("#maxBtn")) {
        document.querySelector("#maxBtn").addEventListener("click", () => {
            ipcrenderer.send("topbar", "minmax");
        });
    }

    if (document.querySelector("#tab1Btn")) {
        document.querySelector("#tab1Btn").onclick = () => {
            console.log("tab1Btn clicked, navigating");
            //send the action to the main process and clear the disable class from the button
            ipcrenderer.send("topbar", "tab1");
            //clearDisable();
        };
    }
    if (document.querySelector("#tab2Btn")) {
        document.querySelector("#tab2Btn").onclick = () => {
            console.log("tab2Btn clicked navigating");
            //send the action to the main process and clear the disable class from the button
            ipcrenderer.send("topbar", "tab2");
            //clearDisable();
        }
    };

    //if there is a settings button add the event listener
    if (document.querySelector("#settingsBtn")) {
        document.querySelector("#settingsBtn").onclick = () => {
            //check if the settings page is already open and focuse it, if not open it
            if (document.querySelector("#settingsBtn").classList.contains("disabled")) {
                ipcrenderer.send("settings", "focus");
            } else {
                ipcrenderer.send("topbar", "settings");
                document.querySelector("#settingsBtn").classList.add("disabled");
            }
        };
    }

    //handles the settings button being reenabled when the settings page is closed
    ipcrenderer.on("settings", (event, arg) => {
        if (arg === "close") {
            document.querySelector("#settingsBtn").classList.remove("disabled");
        }
    });
});