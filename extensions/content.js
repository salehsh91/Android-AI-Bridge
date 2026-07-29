console.log("Content Loaded", location.href);

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}


function clickById(id) {
    const el = document.getElementById(id);

    if (!el) return false;

    el.click();

    return true;
}

function clickBySelector(selector) {
    const el = document.querySelector(selector);

    if (!el) return false;

    el.click();

    return true;
}

function write(selector, value) {

    const el = document.querySelector(selector);

    if (!el) {
        console.log("Input not found");
        return false;
    }


    el.focus();


    // ContentEditable (ChatGPT)
    if (el.isContentEditable) {

        el.innerHTML = "";

        const p = document.createElement("p");
        p.textContent = value;

        el.appendChild(p);


        el.dispatchEvent(new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: value
        }));

    }

    // textarea (DeepSeek)
    else {

        const setter =
            Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                "value"
            ).set;


        setter.call(el, value);


        el.dispatchEvent(new Event("input", {
            bubbles: true
        }));
    }


    return true;
}


async function readStable(selector = "div.ds-message", options = {}) {

    const {
        timeout = 120000,
        interval = 1000,
        stableRounds = 3,
        oldText = ""
    } = options;


    const start = Date.now();

    let lastText = "";
    let stable = 0;
    let started = false;


    while (Date.now() - start < timeout) {


        const messages = document.querySelectorAll(selector);


        if (messages.length) {

            const current = messages[messages.length - 1]
                .innerText
                .trim();

            if (current.length < 5) {
                await sleep(interval);
                continue;
            }

            console.log(
                "Reading:",
                current.length,
                "stable:",
                stable
            );


            // هنوز همان جواب قبلی است
            if (!started) {

                if (
                    current.length > 0 &&
                    current !== oldText
                ) {
                    started = true;
                    lastText = current;
                }

            } else {


                // متن تغییر کرده
                if (current !== lastText) {

                    lastText = current;
                    stable = 0;

                }

                // متن ثابت مانده
                else {

                    stable++;

                    if (stable >= stableRounds) {

                        return current;

                    }
                }
            }
        }


        await new Promise(
            r => setTimeout(r, interval)
        );
    }


    throw new Error("Message timeout");
}
async function waitSelector(selector, timeout = 30000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector);

        if (el) {
            return el;
        }

        await sleep(200);
    }

    throw new Error("Selector not found: " + selector);
}
async function read(selector, btnNoSend) {
    while (document.querySelector(btnNoSend) === null) {
        await sleep(300);
    }

    const els = document.querySelectorAll(selector);

    if (els.length === 0) {
        return null;
    }

    const el = els[els.length - 1];

    return el.innerText ?? el.textContent ?? el.value ?? "";
}

async function getTabId() {
    const response = await chrome.runtime.sendMessage({
        type: "getTabId"
    });

    return response.tabId;
}

async function OneWR(data) {
    const id = await getTabId();

    if (id !== data.tabid || window.location.href !== data.url) {
        return null;
    }

    const wr = await WR(data);

    return {
        wr: wr,
        url: window.location.href
    };
}

async function WR(data) {
    await waitSelector(data.write_selector);


    console.log("WR Start");


    const messages =
        document.querySelectorAll(
            data.read_selector
        );


    const oldText =
        messages.length
            ? messages[messages.length - 1]
                .innerText
                .trim()
            : "";


    const ok = write(
        data.write_selector,
        data.write_value
    );


    if (!ok) {
        throw new Error("Write failed");
    }



    await sleep(500);


    await clickBySelector(
        data.send_selector
    );


    console.log("Waiting answer...");


    const answer = await readStable(
        data.read_selector,
        {
            oldText: oldText,
            timeout: 180000,
            stableRounds: 4
        }
    );


    console.log("Answer:", answer);


    return answer;
}

class Url {

    static checkurl(url) {
        if (window.location.href === url) {
            return true;
        } else {
            return false;
        }
    }
    static seturl(url) {
        window.location.href = url;
    }
}

function run(code) {

    return eval(code);

}

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    console.log("Received:", data.type);
    console.log("Message:", data);

    if (!Url.checkurl(data.url)) {
        return;
    }

    (async () => {

        try {

            switch (data.type) {

                case "clickById":

                    sendResponse({
                        ok: clickById(data.id)
                    });

                    break;

                case "clickBySelector":

                    sendResponse({
                        ok: clickBySelector(data.selector)
                    });

                    break;

                case "write":

                    sendResponse({
                        ok: write(
                            data.selector,
                            data.value,
                            data.btn
                        )
                    });

                    break;

                case "read":

                    sendResponse({
                        ok: true,
                        text: await readStable(data.selector)
                    });

                    break;

                case "eval":

                    sendResponse({
                        ok: true,
                        result: run(data.code)
                    });

                    break;

                case "wr":

                    const text = await WR(data);

                    sendResponse({
                        id: data.id,
                        ok: true,
                        text
                    });

                    break;
                case "onewr": {

                    const req = await OneWR(data);

                    if (!req) {
                        sendResponse({
                            id: data.id,
                            ok: false,
                            error: "Wrong tab"
                        });
                        return;
                    }

                    sendResponse({
                        id: data.id,
                        ok: true,
                        text: req.wr,
                        url: req.url
                    });

                    break;
                }
                default:

                    sendResponse({
                        ok: false,
                        error: "Unknown command"
                    });

            }

        } catch (e) {

            console.error(e);

            sendResponse({
                ok: false,
                error: e.toString()
            });

        }

    })();

    return true;

});


console.log("Content Script Ready");

chrome.runtime.sendMessage({
    type: "contentReady"
});