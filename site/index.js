import { black, green, red } from "./frontUtil.js";

const url = "ws://" + window.location.host;
const ws = new WebSocket(url);

const statusDiv = document.getElementById("status")
const logOutButton = document.getElementById("logout")
function setStatus(colorF, text){
    colorF(statusDiv);
    statusDiv.innerHTML = text;
    logOutButton.style.display = colorF == green ? "block" : "none"
}

function error(...err){
    setStatus(red, "Internal error");
    console.error(...err)
}

function setStatusNoAuth(){
    setStatus(red, "Not authenticated")
}

function setStatusAuth(){
    setStatus(green, "Authenticated !")
}

function logoutButtonOnclick(){
    ws.send("logout");
}
window.logoutButtonOnclick = logoutButtonOnclick;

//---- Websocket ----

ws.onmessage = event => {
    if (!event.data){
        error("Invalid WS message from server :", event);
    }
    const data = JSON.parse(event.data);
    if (data.authenticated){
        setStatusAuth();
    } else {
        setStatusNoAuth();
    }
}

ws.onclose = event => {
    if (event.wasClean){
        setStatus(black, "Closing ...");
    } else {
        setStatus(red, "Connection lost - server seems unreachable");
    }
    
}