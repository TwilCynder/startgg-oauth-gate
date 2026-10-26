export function getStatus(data){
    return data ? {
        authenticated: true,
        expiration_date: data.expiration_date
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