import os from "os";
import fs from "fs/promises";

const DEFAULT_FILENAME = "sgg-oauth-data.json";

class DaveManager {
    #path;

    /** @param {string} path  */
    constructor(path){
        this.#path = path;
    }

    save(data){
        fs.writeFile(this.#path, JSON.stringify(data));
    }
}

/** @param {string?} path @returns {Promise<[import("startgg-oauth-helper").StartggStandardData | false | null, DaveManager]>} */
export async function initSave(path){
    if (path){
        if (path.endsWith("/")){
            await fs.mkdir(path, {recursive: true});
            path = path + DEFAULT_FILENAME;
        }
    } else {
        path = os.homedir();
        if (!path){
            throw ("Could not find default save path : no home dir");
        }
        path += "/.goomba-sgg-tools/";
        await fs.mkdir(path, {recursive: true});
        path += DEFAULT_FILENAME; 
    }

    console.log("Using", path, "as save path")

    const data = await fs.readFile(path, {encoding: "utf-8"})
        .then(text => {
            if (!text) return;
            return JSON.parse(text);
        })
        .catch(err => {
            if (err && err.code == "ENOENT"){
                return false;
            }
        })
    

    return [data, new DaveManager(path)];
}