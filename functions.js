function clickElement(options = {}) {
    const {
        id,
        selector,
        toggle,
        text
    } = options;

    let element = null;

    if (id) {
        element = document.getElementById(id);
    }

    if (!element && selector) {
        element = document.querySelector(selector);
    }

    if (!element && toggle) {
        element = document.querySelector(`[aria-label="${toggle}"]`)
               || document.querySelector(`[title="${toggle}"]`)
               || document.querySelector(`[data-testid="${toggle}"]`);
    }

    if (!element && text) {
        element = [...document.querySelectorAll("button")]
            .find(btn => btn.textContent.trim() === text);
    }

    if (!element) {
        return false;
    }

    element.click();
    return true;
}
