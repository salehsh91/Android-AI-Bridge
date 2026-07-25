console.log("Content Loaded");

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

function write(selector, value, btn) {

    const el = document.querySelector(selector);

    if (!el) {

        console.log("Input not found");

        return false;

    }

    el.focus();

    if (el.isContentEditable) {

        document.execCommand("selectAll", false, null);
        document.execCommand("insertText", false, value);

        el.dispatchEvent(new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: value
        }));

    } else {

        const setter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            "value"
        ).set;

        setter.call(el, value);

        el.dispatchEvent(new Event("input", {
            bubbles: true
        }));

    }

    setTimeout(() => {

        const button = document.querySelector(btn);

        if (button) {

            button.click();

        }

    }, 500);

    return true;

}

function read(selector) {

    const els = document.querySelectorAll(selector);
    const el = els[els.length - 1];
    if (!el) return null;

    return el.innerText || el.textContent || el.value || "";

}
async function WR(wselector, wvalue, wbtn ,btnnosend ,rselector) {
    write(wselector,wvalue,wbtn);
    while (document.querySelector(btnnosend)) {
        await sleep(300);
    }
    return read(rselector);
}

function run(code) {

    return eval(code);

}

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {

    console.log("Message:", data);

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
                    ok: read(
                        data.selector
                    )
                });

                break;

            case "eval":

                sendResponse({
                    ok: true,
                    result: run(data.code)
                });

                break;
            case "wr":

                sendResponse({
                    ok: WR(
                        data.write_selector,
                        data.write_value,
                        data.write_btn,

                        data.btnnosend,

                        data.read_selector
                    )
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

    return true;

});

console.log("Content Script Ready");