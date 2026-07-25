const WebSocket = require("ws");
const fs = require("fs");

const chatbots = JSON.parse(
    fs.readFileSync("chatbots.json", "utf8")
);


let browser = null;


const wss = new WebSocket.Server({
    host: "127.0.0.1",
    port: 8080
});


console.log("Android AI Bridge");
console.log("ws://127.0.0.1:8080");



wss.on("connection", (ws) => {


    browser = ws;


    console.log("Browser Connected");

    setTimeout(() => {

        run();

    }, 1000);

    ws.on("message", (msg) => {

        console.log(
            "Browser:",
            msg.toString()
        );

    });



    ws.on("close", () => {

        console.log("Browser Disconnected");

        browser = null;

    });



    ws.on("error", (err) => {

        console.log(
            "Browser Error:",
            err
        );

    });



    // بعد از اتصال پیام تست ارسال کن
    setTimeout(() => {

        console.log("Sending hello...");




    }, 1000);



});





function send(type, data = {}) {


    if (!browser) {

        console.log(
            "Browser not connected"
        );

        return false;
    }



    if (browser.readyState !== WebSocket.OPEN) {

        console.log(
            "Socket closed"
        );

        return false;

    }



    const packet = {
        type,
        ...data
    };



    console.log(
        "Send:",
        packet
    );



    browser.send(
        JSON.stringify(packet)
    );


    return true;

}





function write(chatbot, value) {

    const bot = chatbots[chatbot];

    if (!bot) return false;

    return send("write", {
        chatbot,
        selector: bot.inputbox,
        btn: bot.btnsend,
        value
    });

}
function read(chatbot){
    const bot = chatbots[chatbot];

    if (!bot) return false;

    return send("read", {
        chatbot,
        selector: bot.textbox
    });
}


function wr(chatbot, value) {

    const bot = chatbots[chatbot];

    if (!bot) return false;

    return send("wr", {
        chatbot,
        write_selector: bot.inputbox,
        write_btn: bot.btnsend,
        btnnosend: bot.btnnosend,
        read_textbox: bot.textbox,
        value
    });

}



function clickBySelector(selector) {


    return send(
        "clickBySelector",
        {
            selector
        }
    );


}






global.write = write;
global.read = read;
global.wr= wr;

global.clickBySelector = clickBySelector;

function run() {

    // write("chatgpt", "hello");
    console.log(wr("chatgpt"));
    // write("deepseek", "hello");
}


global.run = run;


process.on("SIGINT", () => {


    console.log("Stopping...");


    if (browser) {

        browser.close();

    }


    wss.close(() => {

        process.exit();

    });


});
