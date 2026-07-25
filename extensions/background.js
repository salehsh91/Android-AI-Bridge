console.log("Background Started");

let socket = null;

connect();

function connect() {

    socket = new WebSocket("ws://127.0.0.1:8080");

    socket.onopen = () => {

        console.log("Connected");

        socket.send(JSON.stringify({
            type: "hello",
            browser: "Chrome Extension"
        }));

    };

    socket.onmessage = async (event) => {

        console.log("WS Received:", event.data);

        const data = JSON.parse(event.data);

        let url = "";

        switch (data.chatbot) {

            case "chatgpt":
                url = "https://chatgpt.com/*";
                break;

            case "deepseek":
                url = "https://chat.deepseek.com/*";
                break;

            default:
                console.log("Unknown chatbot");
                return;

        }

        const tabs = await chrome.tabs.query({
            url
        });

        if (!tabs.length) {

            console.log("Tab not found:", url);

            socket.send(JSON.stringify({
                ok: false,
                error: "tab not found"
            }));

            return;

        }

        chrome.tabs.sendMessage(
            tabs[0].id,
            data,
            (response) => {

                if (chrome.runtime.lastError) {

                    console.log(chrome.runtime.lastError.message);

                    socket.send(JSON.stringify({
                        ok: false,
                        error: chrome.runtime.lastError.message
                    }));

                    return;

                }

                socket.send(JSON.stringify(response));

            }
        );

    };

    socket.onclose = () => {

        console.log("Disconnected");

        setTimeout(connect, 1000);

    };

    socket.onerror = console.error;

}