import { errorExit } from "./util.js";

/** @param {string[]} args @param {number} i @param {string} optionName  */
export function getPositionalArg(args, i, optionName){
    if (i >= args.length){
        errorExit(1, "Missing argument after", optionName);
    }
    return args[i];
}