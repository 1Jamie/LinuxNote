let ipcrenderer = require('electron').ipcRenderer;

console.log('starting renderer.js')
//pull settings from main process

function clearDisable() {
    console.log('clearing disabled');
    let disabled = document.querySelectorAll('.disabled');
    for (let i = 0; i < disabled.length; i++) {
        disabled[i].classList.remove('disabled');
    }
}

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoad");

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
            ipcrenderer.send("topbar", "home");
            clearDisable();
            document.querySelector("#homebtn").classList.add("disabled");
        };
    }
    if (document.querySelector("#passLstBtn")) {
        document.querySelector("#passLstBtn").onclick = () => {
            console.log("passLstBtn clicked navigating");
            ipcrenderer.send("topbar", "passLst");
            clearDisable();
            document.querySelector("#passLstbtn").classList.add("disabled");
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
    ipcrenderer.on("settings", (event, arg) => {
        if (arg === "close") {
            document.querySelector("#settingsBtn").classList.remove("disabled");
        }
    });
});