const url = "ws://" + window.location.host;
const ws = new WebSocket(url);

ws.onmessage = event => {
    console.log(event);
}

ws.onclose = event => {
    console.log(event);
}