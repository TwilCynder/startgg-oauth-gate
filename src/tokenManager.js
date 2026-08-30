import { makeStandardStartggData } from "startgg-oauth-helper";

export class TokenManager {
    /**@type {ReturnType<makeStandardStartggData>} */
    #startggData;
    #wss;

    /** @param {import("ws").WebSocketServer} wss */
    constructor(wss){
        this.#wss = wss;
    }

    set(sggData, isNew){
        this.#startggData = makeStandardStartggData(sggData);
    }

    get(){
        return this.#startggData;
    }

    getStatus(){
        const data = this.get();
        return data ? {
            authenticated: true,
            expiration_date: data.expiration_date
        } : {
            authenticated: false
        }
    }

    logOut(){
        this.#startggData = null;
    }
}