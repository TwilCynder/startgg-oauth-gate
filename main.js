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
import { ArgumentsManager } from "@twilcynder/arguments-parser";

let config = {
    port: 54301,
    hostname: "127.0.0.1",
    save: null
}

let args = new ArgumentsManager()
    .setParameters({guessLowDashes: true, allowUnknownArguments: false, onError: {errorCode: 1, log: true, throw: false}})
    .addOption(["-p", "--port"], {description: "Port the webserver will listen to", type: "number"}, true)
    .addOption(["-H", "--hostname"], {description: "Hostname the server will be reachable at"}, true)
    .addSwitch(["-s", "--save"], {description: "Save the token to ~/.goomba-sgg-tools/sgg-oauth-data.json to persist it when SGGOG stops"})
    .addOption(["-S", "--save-at"], {description: "Save the token to the specified path to persist it when SGGOG stops"})
    .enableHelpParameter()
    .parseProcessArguments();

config.port = args.port ?? config.port;
config.hostname = args.hostname ?? config.hostname;
config.save = args.save_at ?? args.save ?? config.save;

config.port = process.env.PORT ?? config.port;
config.hostname = process.env.HOSTNAME ?? config.port;

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

server.listen(config.port, config.hostname);
console.log("Server listening on port " + config.port);

cl.enableExit();
cl.start();