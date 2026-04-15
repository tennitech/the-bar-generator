const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await page.goto('http://localhost:3000/?style=waveform');
    
    // Evaluate in page
    await page.evaluate(async () => {
        const waitFor = ms => new Promise(r => setTimeout(r, ms));
        
        // start audio preview
        const audioBtn = document.getElementById('waveform-audio-btn');
        audioBtn.click();
        
        await waitFor(500);
        
        // pause motion via preview transport
        console.log("Clicking motion button to PAUSE");
        const motionBtn = document.getElementById('waveform-motion-btn');
        motionBtn.click();
        
        await waitFor(2000); // Wait 2s
        
        // resume motion via preview transport
        console.log("Clicking motion button to PLAY");
        motionBtn.click();
        
        // Monitor state for 3 seconds
        for(let i=0; i<30; i++) {
           console.log("State:", window.audioContext?.state, " Oscillators connected:", window.isAudioPlaying);
           await waitFor(100);
        }
    });
    
    await browser.close();
})();
