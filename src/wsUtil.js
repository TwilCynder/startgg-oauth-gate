/** @param {import("ws").WebSocketServer} wss @param {any} data   */
export function broadcast(wss, data){
    const content = typeof data === "string" ? data : JSON.stringify(data);
    for (const ws of wss.clients){
        ws.send(content);
    }
}