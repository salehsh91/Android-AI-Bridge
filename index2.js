
const aib = require("android-ai-bridge");







async function main(){

    console.log("Waiting browser...");

    await aib.browserReady;

    console.log("Browser ready");


    

}


main().catch(console.error);