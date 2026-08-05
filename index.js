
const {browserReady ,AI} = require("android-ai-bridge");







async function main(){

    console.log("Waiting browser...");

    await browserReady;

    console.log("Browser ready");

    const Qwen = new AI('qwen');
    await Qwen.init();
    
    

}


main().catch(console.error);