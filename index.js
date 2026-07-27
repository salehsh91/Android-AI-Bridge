const AI = require("./ai");
const { browserReady } = require("./server");

async function main() {

    console.log("Waiting browser...");

    await browserReady;

    const Deepseek = new AI("deepseek");
    const ChatGPT = new AI("chatgpt");

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

main().catch(console.error);