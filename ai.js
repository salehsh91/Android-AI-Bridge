const { wr } = require("./server");


class AI {

    constructor(chatbot) {
        this.chatbot = chatbot;
        this.version = "1.0";
    }


    async ask(prompt) {

        const res = await wr(
            this.chatbot,
            prompt
        );

        return res.text;
    }

}


module.exports = AI;