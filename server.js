const WebSocket = require("ws"); const fs = require("fs");

const chatbots = JSON.parse(
    fs.readFileSync("chatbots.json", "utf8")
);

let browser = null;

let browserReadyResolve;

const browserReady = new Promise(resolve => {
    browserReadyResolve = resolve;
});


const wss = new WebSocket.Server({
    host: "127.0.0.1",
    port: 8080
});


console.log("Android AI Bridge");
console.log("ws://127.0.0.1:8080");


wss.on("connection", (ws) => {

    browser = ws;

    console.log("Browser Connected");


    browserReadyResolve();

    setInterval(() => {
        if (browser && browser.readyState === WebSocket.OPEN) {
            browser.send(JSON.stringify({
                type: "ping"
            }));
        }
    }, 5000);


    ws.on("message", (msg) => {

        const data = JSON.parse(msg);

        if (data.id && waiting.has(data.id)) {
            waiting.get(data.id)(data);
            waiting.delete(data.id);
        }

    });

});


const waiting = new Map();
let requestId = 0;




function send(type, data = {}) {

    return new Promise((resolve, reject) => {

        if (!browser) {
            reject(new Error("Browser not connected"));
            return;
        }

        if (browser.readyState !== WebSocket.OPEN) {
            reject(new Error("Socket closed"));
            return;
        }

        const id = ++requestId;

        waiting.set(id, (response) => {

            if (response.ok === false) {
                reject(new Error(response.error));
                return;
            }

            resolve(response);

        });

        browser.send(JSON.stringify({
            id,
            type,
            ...data
        }));

    });

}

async function write(chatbot, value) {

    const bot = chatbots[chatbot];

    if (!bot) return null;

    return await send("write", {
        chatbot,
        selector: bot.inputbox,
        btn: bot.btnsend,
        value
    });

}

async function read(chatbot) {

    const bot = chatbots[chatbot];

    if (!bot) return null;

    return await send("read", {
        chatbot,
        selector: bot.textbox
    });

}

async function wr(chatbot, value, tabId, url) {
    const bot = chatbots[chatbot];

    if (!bot) {
        throw new Error("Chatbot not found");
    }
    const jsontext = await send("onewr", {
        chatbot,
        write_selector: bot.inputbox,
        write_value: value,
        send_selector: bot.btnsend,
        read_selector: bot.textbox,
        btnnosend: bot.btnnosend,

        tabid: tabId,
        url: url
    });


    const text = jsontext;
    return text;
}

async function onewr(chatbot, value, tabId, url) {

    const bot = chatbots[chatbot];

    if (!bot) {
        throw new Error("Chatbot not found");
    }
    const jsontext = await send("onewr", {
        chatbot,
        write_selector: bot.inputbox,
        write_value: value,
        send_selector: bot.btnsend,
        read_selector: bot.textbox,
        btnnosend: bot.btnnosend,

        tabid: tabId,
        url: url
    });


    const text = jsontext;
    return text;

}

async function newchat(chatbot) {


    const bot = chatbots[chatbot];

    if (!bot) {
        throw new Error("Chatbot not found");
    }

    const jsontext = await send("newchat", {
        chatbot,
        url: bot.url
    });
    const text = jsontext;
    return text;
}

async function clickBySelector(selector) {

    return await send("clickBySelector", {
        selector
    });

}




process.on("SIGINT", () => {

    console.log("Stopping...");

    if (browser) {
        browser.close();
    }

    wss.close(() => process.exit());

});




module.exports = {
    wr,
    browserReady,
    newchat,
    onewr
};