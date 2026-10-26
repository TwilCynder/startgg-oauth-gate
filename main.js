import express from "express"
import { errorExit } from "./src/util.js";
import { createServer } from "http"

import cl from "@twilcynder/commandline";
import { WebSocketServer } from "ws";
import { initOauth } from "./src/oauth.js";
import { TokenManager } from "./src/tokenManager.js";
import { broadcast, getStatus } from "./src/wsUtil.js";

let config = {
    port: 54301,
}

for (let i = 2; i < process.argv; i++){
    let arg = process.argv[i];
    if (arg == "-p" || arg == "--port"){
        i = i + 1;
        if (i >= process.argv.length){
            errorExit(1, "Missing argument after", arg);
        }
        config.port = parseInt(process.argv[i]);
    }
}

config.port = process.env.PORT ?? config.port;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({server, clientTracking: true});

app.use(express.static("./site"));

const tokenManager = new TokenManager();

tokenManager.on("change", (data) => {
    const status = getStatus(data);

    broadcast(wss, status);
})

wss.on("connection", ws => {
    console.log("Connected");

    ws.send(JSON.stringify(getStatus(tokenManager.get())));
    ws.onmessage = (event => {
        if (event.data && event.data == "logout"){
            tokenManager.logOut();
        }
    })
});

initOauth(app, tokenManager);

cl.commands = {
    send: (words) => {
        for (const ws of wss.clients){
            ws.send(words.join(" "));
        }
    }
}

server.listen(config.port);
console.log("Server listening on port " + config.port);

cl.enableExit();
cl.start();