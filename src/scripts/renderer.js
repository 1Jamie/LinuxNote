let ipcrenderer = require('electron').ipcRenderer;

console.log('starting renderer.js')

//use this to clear the disable class on all the buttons
function clearDisable() {
    let disabled = document.querySelectorAll('.disabled');
    for (let i = 0; i < disabled.length; i++) {
        disabled[i].classList.remove('disabled');
    }
}

//this is just to set which button is active on load
ipcrenderer.on('setTab' , (event, arg) => {
    console.log('received setTab', arg);
    clearDisable();
    if(arg === 'homepage') {
        document.getElementById('homeBtn').classList.add('disabled');
    } else if (arg === 'passList') {
        document.getElementById('passLstBtn').classList.add('disabled');
    }
});

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

    if (document.querySelector("#homeBtn")) {
        document.querySelector("#homeBtn").onclick = () => {
            console.log("homeBtn clicked navigating");
            //send the action to the main process and clear the disable class from the button
            ipcrenderer.send("topbar", "home");
            clearDisable();
        };
    }
    if (document.querySelector("#passLstBtn")) {
        document.querySelector("#passLstBtn").onclick = () => {
            console.log("passLstBtn clicked navigating");
            //send the action to the main process and clear the disable class from the button
            ipcrenderer.send("topbar", "passLst");
            clearDisable();
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