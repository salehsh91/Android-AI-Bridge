const AI = require("./ai");
const { browserReady } = require("./server");


async function main(){

    console.log("Waiting browser...");

    await browserReady;

    console.log("Browser ready");


    const ChatGPT = new AI("chatgpt");
    const Deepseek = new AI("deepseek");

    await ChatGPT.init();
    await Deepseek.init();


    const lastI = 10;

    let article = await Deepseek.ask(
        "Write a 3000-word SEO article about Apple iPhone 17."
    );

    for (let i = 0; i < lastI; i++) {

        console.log(`Round ${i + 1}`);

        const review = await ChatGPT.ask(`
Review this article.

Give:
- Score /100
- Problems
- Improvements

Article:

${article}
`);

        article = await Deepseek.ask(`
Improve the following article according to this review.

Review:

${review}

Current article:

${article}
`);
    }

    console.log(article); 
}

async function main(){

    console.log("Waiting browser...");

    await browserReady;

    console.log("Browser ready");


    const Qwen = new AI("qwen");


    await Qwen.init();

    console.log('end init');
    const images = await Qwen.createimg(
        "A futuristic robot in a technology laboratory"
    );

    // const images = await Qwen.ask('hello2');


    console.log(
        "Images:",
        images
    );

}


main().catch(console.error);