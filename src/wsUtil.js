/** @param {ReturnType<import("./tokenManager").TokenManager['get']>} data */
export function getStatus(data){
    return data.token ? {
        authenticated: true,
        expiration_date: data.token.expiration_date,
        username: data.username
    } : {
        authenticated: false
    };
}

/** @param {import("ws").WebSocketServer} wss @param {any} data   */
export function broadcast(wss, data){
    const content = typeof data === "string" ? data : JSON.stringify(data);
    for (const ws of wss.clients){
        ws.send(content);
    }
}