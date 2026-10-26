import { makeStandardStartggData } from "startgg-oauth-helper";
import {EventEmitter} from "events"

export class TokenManager extends EventEmitter {
    /**@type {ReturnType<makeStandardStartggData>} */
    #startggData;

    /** @param {import("ws").WebSocketServer} wss */
    constructor(){
        super();
    }
 
    get(){
        return this.#startggData;
    }

    set(sggData, isNew){
        const data = makeStandardStartggData(sggData);
        this.#startggData = data;
        this.emit("change", data);
    }

    logOut(){
        this.#startggData = null;
        this.emit("change", null);
    }

}