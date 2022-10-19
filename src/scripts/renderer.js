let ipcrenderer = require('electron').ipcRenderer;

let passlist
let homepage
let autohide

console.log('starting renderer.js')
//pull settings from main process
ipcrenderer.send('settings', 'request-load');
ipcrenderer.on('settings', (event, arg) => {
    console.log('received settings from main process', arg);
    //check if the response is an array
    if (Array.isArray(arg)) {
        //set the webviews data-homepage and data-passlist attributes
        console.log('setting homepage and passlist');
        document.getElementById('webview').setAttribute('data-home', arg[0]);
        homepage = arg[0];
        document.getElementById('webview').setAttribute('data-passLst', arg[1]);
        passlist = arg[1];
        autohide = arg[2];
        //set the webviews src attribute
        document.getElementById('webview').setAttribute('src', arg[0]);
    }
});

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoad");
    const getControlsHeight = () => {
        const controls = document.querySelector("#controls");
        if (controls) {
            return controls.offsetHeight;
        }
        return 0;
    };

    let webview = document.querySelector("webview");

    if (document.querySelector("#closeBtn")) {
        document.querySelector("#closeBtn").addEventListener("click", () => {
            ipcrenderer.send("topbar", "close");
        });
    }

    if (document.querySelector("#minBtn")) {
        document.querySelector("#minBtn").addEventListener("click", () => {
            ipcrenderer.send("topbar", "minimize");
        });
    }

    if (document.querySelector("#maxBtn")) {
        document.querySelector("#maxBtn").addEventListener("click", () => {
            ipcrenderer.send("topbar", "minmax");
        });
    }

    if (document.querySelector("#homeBtn")) {
        document.querySelector("#homeBtn").onclick = () => {
            console.log("homeBtn clicked navigating to", homepage);
            document.querySelector("webview").src = homepage;
            //clear the disable on the buttons then start the remove top bar function
            clearDisable();
            document.querySelector("#homebtn").classList.add("disabled");
        };
    }
    if (document.querySelector("#passLstBtn")) {
        document.querySelector("#passLstBtn").onclick = () => {
            console.log("passLstBtn clicked navigating to", passlist);
            document.querySelector("webview").src = passlist;
            clearDisable();
            document.querySelector("#passLstbtn").classList.add("disabled");
        }
    };

    if (document.querySelector("#logoutBtn")) {
        document.querySelector("#logoutBtn").onclick = () => {
            document.querySelector("webview").src = "https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=https://www.onenote.com/notebooks";
        };
    }

    webview.addEventListener("did-start-loading", () => {
        console.log("did-start-loading");
        //hide the h_bar
    });


    function calculateLayoutSize() {
        webview = document.querySelector("webview");
        const windowWidth = document.documentElement.clientWidth;
        const windowHeight = document.documentElement.clientHeight;
        const testHeight = window.innerHeight;
        const testWidth = window.innerWidth;
        const controlsHeight = getControlsHeight();
        const webviewHeight = windowHeight - controlsHeight;
        const webviewWidth = testWidth;

        webview.style.width = webviewWidth + "px";
        webview.style.height = webviewHeight + "px";
    }

    calculateLayoutSize();

    // Dynamic resize function (responsive)
    window.onresize = calculateLayoutSize;

    //function to clear disable on the buttons
    const clearDisable = () => {
        const homebtn = document.querySelector("#homebtn");
        const passLstbtn = document.querySelector("#passLstbtn");
        homebtn.classList.remove("disabled");
        passLstbtn.classList.remove("disabled");
    };

    //if there is a settings button add the event listener
    if (document.querySelector("#settingsBtn")) {
        document.querySelector("#settingsBtn").onclick = () => {
            //check if the button is disabled
            if (document.querySelector("#settingsBtn").classList.contains("disabled")) {
                // tell the main process to bring the settings window to focus
                ipcrenderer.send("settings", "focus");
            } else {
                //send ipc message to main.js to open the settings window
                ipcrenderer.send("settings", "open");
                //disable the button so it can't be clicked again
                document.querySelector("#settingsBtn").classList.add("disabled");
            }
        };
    }
    ipcrenderer.on("settings", (event, arg) => {
        if (arg === "close") {
            document.querySelector("#settingsBtn").classList.remove("disabled");
        }
    });

    // Home button exists
});