import { initStartggOauth, makeStandardStartggData, refreshToken } from "startgg-oauth-helper";

/** @typedef {{client_id: string, client_secret: string, redirect_uri: string, scopes: string}} OAuthConfig */
/** @param {string} refresh_token @param {OAuthConfig} oauthConfig  */
export async function refreshToken_(refresh_token, oauthConfig){
    const res = await refreshToken(refresh_token, oauthConfig.client_id, oauthConfig.client_secret, oauthConfig.redirect_uri, oauthConfig.scopes);
    if (!res.ok){
        const resBody = await res.json().catch(() => null);
        throw new Error("Couldn't refresh token : Api responded with status " + res.status + (resBody ? " : " + (resBody.error_description ?? resBody.error) : ""))
    }
    const resBody = await res.json();
    return makeStandardStartggData(resBody);
}

/** @param {Express} app @param {import("./tokenManager").TokenManager} tokenManager @param {OAuthConfig} oauthConfig */
export async function initOauth(app, tokenManager, oauthConfig){
    initStartggOauth(app, oauthConfig.client_id, oauthConfig.client_secret, oauthConfig.redirect_uri, oauthConfig.scopes, {
        authRedirect: "/auth",
        callback: "/callback",
        token: "/token"   
    }, {
        responseHandlerCallback: (_, data, _isNew) => tokenManager.set(makeStandardStartggData(data)),
        startggDataGetter: (_) => tokenManager.get(),
        cors: "*"
    })
}