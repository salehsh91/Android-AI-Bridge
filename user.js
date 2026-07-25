// ==UserScript==
// @name Test
// @match *://*/*
// @grant none
// ==/UserScript==

// Android AI Bridge

const socket = new WebSocket("ws://127.0.0.1:8080");

socket.onopen = () => {
    console.log("Connected");
    socket.send(JSON.stringify({
        type: "hello",
        browser: "Kiwi"
    }));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    console.log(data);

    if (data.type === "click") {
        const el = document.querySelector(data.selector);

        if (el) {
            el.click();
        }
    }

    if (data.type === "eval") {
        eval(data.code);
    }
};

socket.onclose = () => {
    console.log("Disconnected");
};

socket.onerror = (e) => {
    console.error(e);
};
socket.onmessage = (event) => {

    const data = JSON.parse(event.data);

    switch(data.type){

        case "eval":
            eval(data.code);
            break;

    }

};
