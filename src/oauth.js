import { initStartggOauth } from "startgg-oauth-helper";
import { TokenManager } from "./tokenManager.js";

const SCOPES = "user.identity";

/** @param {string[]} names */
function checkEnvironmentVariables(...names){
    for (const name of names){
        if (!process.env[name]){
            throw `Missing Oauth environement variable ${name}`
        }
    }
}

/** @param {Express} app @param {TokenManager} tokenManager  */
export async function initOauth(app, tokenManager){
    checkEnvironmentVariables("SGG_OAUTH_CLIENT_ID", "SGG_OAUTH_REDIRECT_URI", "SGG_OAUTH_CLIENT_SECRET");

    initStartggOauth(app, process.env.SGG_OAUTH_CLIENT_ID, process.env.SGG_OAUTH_CLIENT_SECRET, process.env.SGG_OAUTH_REDIRECT_URI, SCOPES, {
        authRedirect: "/auth",
        callback: "/callback",
        token: "/token"   
    }, {
        responseHandlerCallback: (_, data, isNew) => tokenManager.set(data, isNew),
        startggDataGetter: (_) => tokenManager.get()
    })
}