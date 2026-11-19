import { makeStandardStartggData } from "startgg-oauth-helper";
import {EventEmitter} from "events"
import { getUserInfo } from "./userInfo.js";

const DEFAULT_CONFIG = {
    getUsername: false
}

export class TokenManager extends EventEmitter {
    /**@type {ReturnType<makeStandardStartggData>?}} */
    #tokenData = null;

    /** @type {string?} */
    #username;

    #config = DEFAULT_CONFIG;

    /** @param {Partial<typeof DEFAULT_CONFIG>} config */
    constructor(config = {}){
        super();

        Object.assign(this.#config, config);
    }
 
    getToken(){
        return this.#tokenData;
    }

    /** @param {ReturnType<makeStandardStartggData>?} data  */
    setTokenData(data, isNew){
        this.#tokenData = data;

        if (data && isNew){
           this.updateUsername(data);

            console.log("New token obtained !");
        } else if (!data){
            console.log("Token removed");
        }

        this.emit("change", this.get());
    }

    get(){
        return {token: this.#tokenData, username: this.#username};
    }

    /** @param {ReturnType<TokenManager["get"]>} data  */
    set(data = {token: null, username: null}){
        this.#tokenData = data.token;
        this.#username = data.username;
    }

    logOut(){
        this.setTokenData(null);
    }

    async updateUsername(tokenData){
        if (this.#config.getUsername){
            this.#username = null;

            const token = tokenData.access_token;
            await getUserInfo(token)
                .then(username => {
                    const truncatedToken = token.slice(0, 6);
                    if (!this.#tokenData || this.#tokenData.access_token != token){
                        console.warn("Successfully obtained username", username, "for token", truncatedToken, "..., but it was not the selected token anymore");
                        return;
                    }
                    console.log("Successfully obtained username", username, "for token", truncatedToken + "...");
                    this.#username = username;
                    this.emit("change", this.get());
                })
                .catch(err => {
                    console.error("Couldn't obtain the username for token", token, ":", err);
                })
        }
    }

}