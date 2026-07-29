const {browserReady ,onewr ,newchat ,wr} = require("./server.js");


class AI {

    constructor(chatbot, prompt = "Hello", chat = "newchat") {
        this.chatbot = chatbot;
        this.version = "1.0";
    }

    async init() {

        const tab = await newchat(this.chatbot);



        this.tabid = tab.tabId;
        const res = await onewr(
            this.chatbot,
            "Hello",
            this.tabid,
            tab.url
        );
        
        this.chatid = res.url;


    }


    async ask(prompt) {

        const res = await wr(
            this.chatbot,
            prompt,
            this.tabid,
            this.chatid
        );

        return res.text;
    }

}


module.exports = AI;