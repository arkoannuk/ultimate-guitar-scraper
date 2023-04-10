const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function clickElements(page) {
    const clickSelectors = [
        'xpath=/html/body/div[1]/div/div/div/div[2]/div/button[2]', // Cookies disclaimer
        'xpath=/html/body/div[2]/div[2]/div[1]/button', // Discount banner
        'xpath=/html/body/div[2]/div[2]/main/div[2]/article[1]/section[2]/article/div/div/div[1]/div[2]', // Guitar Video
    ];

    for (const selector of clickSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 3000 });
            await page.locator(selector).click();
        } catch (error) {
            console.log(`Element not found for selector: ${selector}`);
        }
    }
}


async function removeElements(page) {
    const xpaths = [
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[2]/article/section[5]', // Autoscroll bar
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[1]/section', // Download PDF top bar
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[1]/div[1]', // Header bloat buttons
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[2]/article/aside/div' // Float pdf download bar     
    ];

    for (const xpath of xpaths) {
        try {
            await page.waitForSelector(`xpath=${xpath}`, { timeout: 3000 });
            await page.evaluate((path) => {
                const element = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, xpath);
        } catch (error) {
            console.log(`Element not found for xpath: ${xpath}`);
        }
    }
}


async function scrollToMiddle(page) {
    await page.evaluate(() => {
        const middleY = document.documentElement.scrollHeight / 3;
        window.scrollTo(0, middleY);
    });
}

async function takeScreenshot(page, xpath, folderName, screenshotName) {
    await clickElements(page);
    await scrollToMiddle(page);
    await removeElements(page);
    await page.locator(`xpath=${xpath}`).screenshot({ path: path.join(folderName, `${screenshotName}.png`) });
}


async function scrapePage(url, xpath, folderName, screenshotName) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url);

    await takeScreenshot(page, xpath, folderName, screenshotName);

    await browser.close();
}

async function main() {
    const xpaths = [
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[2]/article/section[3]/div',
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[1]',
        '/html/body/div[2]/div[2]/main/div[2]/article[1]/section[2]/article/section[1]/div'
    ];

    const screenshotNames = ['Sheet', 'Title', 'Chords'];

    const urls = fs.readFileSync('pages.txt', 'utf-8').split('\n').filter(url => url.trim() !== '');

    for (const url of urls) {
        const folderName = `pages/${url.replace(/https?:\/\/|www\.|[^a-zA-Z0-9-_]/g, '')}`;
        fs.mkdirSync(folderName, { recursive: true });

        for (let i = 0; i < xpaths.length; i++) {
            await scrapePage(url, xpaths[i], folderName, screenshotNames[i]);
        }
    }
}

main();