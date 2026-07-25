const WebSocket = require("ws");

const wss = new WebSocket.Server({
    host: "0.0.0.0",
    port: 8080
});

console.log("Android AI Bridge Server");
console.log("ws://0.0.0.0:8080");

wss.on("connection", (ws) => {
    console.log("Browser Connected");
    setTimeout(() => {
    ws.send(JSON.stringify({
        type: "eval",
        code: `
            // document.body.style.background = "";
            console.log("Hello from Termux!");
        `
    }));
}, 3000);
    ws.send(JSON.stringify({
        type: "hello",
        message: "Hello from Termux!"
    }));

    ws.on("message", (msg) => {
        console.log("Browser:", msg.toString());
    });

    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "time",
                time: Date.now()
            }));
        }
    }, 5000);
});
