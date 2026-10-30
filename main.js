import express from "express"
import { createServer } from "http"

import cl from "@twilcynder/commandline";
import { WebSocketServer } from "ws";
import { initOauth } from "./src/oauth.js";
import { TokenManager } from "./src/tokenManager.js";
import { broadcast, getStatus } from "./src/wsUtil.js";
import { getPositionalArg } from "./src/paramsHelper.js";
import { initSave } from "./src/save.js";
import { errorExit } from "./src/util.js";

let config = {
    port: 54301,
    save: null
}

for (let i = 2; i < process.argv.length; i++){
    let arg = process.argv[i];
    if (arg == "-p" || arg == "--port"){
        i++;
        config.port = parseInt(getPositionalArg(process.argv, i, arg));
    } else if (arg == "--save"){
        config.save = true;
    } else if (arg == "--save-at"){
        i++;
        config.save = getPositionalArg(process.argv, i, arg);
    } else {
        errorExit(1, "Unrecognized argument :", arg);
    }
}

config.port = process.env.PORT ?? config.port;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({server, clientTracking: true});

app.use(express.static("./site"));

const tokenManager = new TokenManager();

if (config.save){
    let [data, saveManager] = await initSave(config.save === true ? null : config.save);

    if (data === false){
        data = null;
        console.log("File doesn't exist yet");
    } else {
        console.log("Loaded data from save file");
    }

    if (data) tokenManager.set(data ?? null);

    tokenManager.on("change", (data) => {
        try {
            saveManager.save(data);
        } catch (err) {
            console.error("Couldn't save new data :", err);
        }
    })
}

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