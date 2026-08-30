import { black, green, red } from "./frontUtil.js";

const url = "ws://" + window.location.host;
const ws = new WebSocket(url);

const statusDiv = document.querySelector(".status")

function setStatus(colorF, text){
    colorF(statusDiv);
    statusDiv.innerHTML = text;
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