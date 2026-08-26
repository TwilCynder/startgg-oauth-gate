export function errorExit(code, ...msg){
    console.error(...msg);
    process.exit(code);
}