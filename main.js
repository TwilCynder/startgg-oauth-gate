import express from "express";
import { createServer } from "http";

import cl from "@twilcynder/commandline";
import { WebSocketServer } from "ws";
import { initOauth, refreshToken_ } from "./src/oauth.js";
import { TokenManager } from "./src/tokenManager.js";
import { broadcast, getStatus } from "./src/wsUtil.js";
import { initSave } from "./src/save.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { checkEnvironmentVariables } from "./src/util.js";

let config = {
    port: 54301,
    host: "127.0.0.1",
    save: null
}

let args = new ArgumentsManager()
    .setParameters({guessLowDashes: true, allowUnknownArguments: false, onError: {errorCode: 1, log: true, throw: false}})
    .addOption(["-p", "--port"], {description: "Port the webserver will listen to", type: "number"}, true)
    .addOption(["-H", "--host"], {description: "Hostname the server will be reachable at"}, true)
    .addSwitch(["-s", "--save"], {description: "Save the token to ~/.goomba-sgg-tools/sgg-oauth-data.json to persist it when SGGOG stops"})
    .addOption(["-S", "--save-at"], {description: "Save the token to the specified path to persist it when SGGOG stops"})
    .enableHelpParameter()
    .parseProcessArguments();

config.port = args.port ?? config.port;
config.host = args.hostname ?? config.host;
config.save = args.save_at ?? args.save ?? config.save;

config.port = process.env.PORT ?? config.port;
config.host = process.env.HOST ?? config.host;

checkEnvironmentVariables("SGG_OAUTH_CLIENT_ID", "SGG_OAUTH_REDIRECT_URI", "SGG_OAUTH_CLIENT_SECRET");
const oauthConfig = {
    scopes: "user.identity",
    client_id: process.env.SGG_OAUTH_CLIENT_ID,
    client_secret: process.env.SGG_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.SGG_OAUTH_REDIRECT_URI
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({server, clientTracking: true});

const tokenManager = new TokenManager();

if (config.save){
    try {
        let [data, saveManager] = await initSave(config.save === true ? null : config.save)

        cl.commands = {deleteFile: () => saveManager.delete()}

        if (data === false){
            data = null;
            console.log("File doesn't exist yet");
        } else {
            console.log("Loaded data from save file");
            if (data){
                if (Date.now() > data.expiration_date){
                    console.log("-> Token was expired, refreshing")
                    data = await refreshToken_(data.refresh_token, oauthConfig).catch(err => {
                        console.warn("-> /!\\ An error occured while trying to refresh a token using existing data - if this seems to be because the data is corrupt, you can delete it using the 'deleteFile' command");
                        throw err;
                    });
                    await saveManager.save(data);
                }
            } else {
                console.log("-> Data was null")
            }
        }
        if (data) tokenManager.set(data ?? null);
        
        tokenManager.on("change", async (data) => {
            try {
                await saveManager.save(data);
            } catch (err) {
                console.error("Couldn't save new data :", err);
            }
        })

    } catch (err){
        console.error("Error - cannot enable saving :", err);
    }
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

initOauth(app, tokenManager, oauthConfig);

app.use(express.static("./site"));

cl.commands = {
    send: (words) => {
        for (const ws of wss.clients){
            ws.send(words.join(" "));
        }
    }
}

server.listen(config.port, config.host);
console.log("Server listening on port", config.port, "for hostname", config.host);

cl.enableExit();
cl.enableList();
cl.start();