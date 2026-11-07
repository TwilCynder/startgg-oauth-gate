/** @param {string[]} names */
export function checkEnvironmentVariables(...names){
    for (const name of names){
        if (!process.env[name]){
            throw `Missing Oauth environement variable ${name}`
        }
    }
}

export function errorExit(code, ...msg){
    console.error(...msg);
    process.exit(code);
}