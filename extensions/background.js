let readyTabs = new Set();
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
        if (data.type === "ping") {
            socket.send(JSON.stringify({
                type: "pong"
            }));
            return;
        }

        if (data.type === "newchat") {
            const tab = await newTab(data.url);

            socket.send(JSON.stringify({
                id: data.id,
                ok: true,
                tabId: tab.id,
                url: tab.url
            }));

            return;
        }

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

        let targetTabId;
        if (data.tabid) {
            targetTabId = data.tabid;
        } else {
            // فقط اگر واقعاً tabId نداشتی
        }

        if (data.type === "onewr") {
            targetTabId = data.tabid;
        } else {
            const tabs = await chrome.tabs.query({ url });

            if (!tabs.length) {
                socket.send(JSON.stringify({
                    id: data.id,
                    ok: false,
                    error: "Tab not found"
                }));
                return;
            }

            targetTabId = tabs[0].id;
        } if (data.tabid) {
            targetTabId = data.tabid;
        } else {
            // فقط اگر واقعاً tabId نداشتی
        }

        console.log("Sending to tab:", targetTabId);
        console.log("Data:", data);


        const tab = await chrome.tabs.get(targetTabId);

        console.log("TAB INFO:", {
            id: tab.id,
            url: tab.url,
            status: tab.status
        });
        try {
            await chrome.scripting.executeScript({
                target: { tabId: targetTabId },
                func: () => console.log("Injected OK")
            });

            console.log("Script can access tab");
        } catch (e) {
            console.error("Cannot access tab:", e);
        }
        chrome.tabs.sendMessage(targetTabId, data, (response) => {

            if (chrome.runtime.lastError) {
                console.error("SendMessage Error:", chrome.runtime.lastError);

                socket.send(JSON.stringify({
                    id: data.id,
                    ok: false,
                    error: chrome.runtime.lastError.message
                }));
                return;
            }

            console.log("Response:", response);

            socket.send(JSON.stringify(response));
        });

    };

    socket.onclose = () => {

        console.log("Disconnected");

        setTimeout(connect, 1000);

    };

    socket.onerror = console.error;

}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "contentReady") {

        console.log(
            "Content Ready:",
            sender.tab.id
        );

        readyTabs.add(sender.tab.id);

        return;
    }


    if (message.type === "getTabId") {
        sendResponse({
            tabId: sender.tab.id
        });

        return true;
    }
});

async function newTab(chatbotUrl) {

    console.log("Creating new tab:", chatbotUrl);


    const tab = await chrome.tabs.create({
        url: chatbotUrl,
        active: true
    });


    console.log(
        "New tab created:",
        tab.id
    );


    await waitContent(tab.id);


    return await chrome.tabs.get(tab.id);
}



async function waitContent(tabId) {

    return new Promise((resolve) => {


        if (readyTabs.has(tabId)) {

            resolve();
            return;

        }


        const timer = setInterval(() => {


            if (readyTabs.has(tabId)) {

                clearInterval(timer);

                console.log(
                    "Content loaded for:",
                    tabId
                );


                resolve();

            }


        }, 100);



        // جلوگیری از گیر کردن دائمی
        setTimeout(() => {

            clearInterval(timer);

            console.log(
                "Content timeout:",
                tabId
            );

            resolve();

        }, 30000);


    });

}

