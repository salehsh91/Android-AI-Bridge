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
function clickQwenSend(selector) {

    const btn = document.querySelector(selector);

    if (!btn) {
        console.log("Send button not found");
        return false;
    }


    btn.focus();


    btn.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "mouse"
    }));

    btn.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true
    }));

    btn.dispatchEvent(new MouseEvent("mouseup", {
        bubbles: true
    }));

    btn.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true
    }));


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
async function waitForImages(data, timeout = Infinity) {

    return new Promise((resolve, reject) => {

        const start = Date.now();


        function check() {

            const boxs1 = document.querySelectorAll(
                data.boximg_selector
            );

            const imgs1 = [...document.querySelectorAll(
                data.img_selector
            )];


            console.log("IMAGE CHECK", {
                boxSelector: data.boximg_selector,
                imgSelector: data.img_selector,
                boxes: boxs1.length,
                images: imgs1.length,
                srcs: imgs1.map(x => x.src)
            });

            const boxs = document.querySelectorAll(
                data.boximg_selector
            );

            const imgs = [...document.querySelectorAll(
                data.img_selector
            )];


            const ready =
                boxs.length > 0 &&
                boxs.length === imgs.length &&
                imgs.every(img =>
                    img.src &&
                    img.src.startsWith("http")
                );


            if (ready) {

                const urls = imgs.map(
                    img => img.src
                );

                resolve(urls);
                return true;
            }


            if (timeout !== Infinity && Date.now() - start > timeout) {

                reject(
                    new Error(
                        "Image creation timeout"
                    )
                );

                return true;
            }


            return false;
        }


        if (check()) return;


        const observer = new MutationObserver(() => {

            if (check()) {
                observer.disconnect();
            }

        });


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    });
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

    const tabId = await getTabId();

    if (tabId !== data.tabid) {
        return null;
    }

    const wr = await WR(data);

    return {
        wr,
        url: window.location.href
    };
}
async function WR(data) {
    await sleep(5000);
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



    await sleep(1000);


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
async function imgCreator(data) {

    console.log("img Creating...");


    // باز کردن منوی ابزارها
    await clickBySelector(
        data.plus_selector
    );


    await sleep(500);



    // انتخاب Image mode

    const options = document.querySelectorAll(
        data.options_selector
    );


    if (!options[data.option_selector]) {

        throw new Error(
            "Image option not found"
        );

    }


    options[data.option_selector].click();



    await sleep(500);



    // نوشتن prompt

    const ok = write(
        data.write_selector,
        data.write_prompt
    );


    if (!ok) {

        throw new Error(
            "Write failed"
        );

    }



    await sleep(500);



    // ارسال

    await clickBySelector(
        data.send_selector
    );



    console.log(
        "Waiting for image..."
    );



    // انتظار عکس

    const images = await waitForImages(
        data
    );



    console.log(
        "Images created:",
        images
    );


    console.log(
        "End creating"
    );


    return images;

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

    if (data.url && !Url.checkurl(data.url)) {
        sendResponse({
            ok: false,
            error: "Wrong url"
        });
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

                case "imgcreator":

                    console.log("IMG COMMAND RECEIVED");
                    const imgurl = await imgCreator(data);

                    sendResponse({
                        id: data.id,
                        ok: true,
                        imgurl
                    });
                    break;
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

