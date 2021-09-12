async function DumpHrefs(page) {
    return await page.evaluate(() => {
        function isExternal(url) { // http://www.primaryobjects.com/2012/11/19/parsing-hostname-and-domain-from-a-url-with-javascript/
            var match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/);
            if (match != null && typeof match[1] === 'string' && match[1].length > 0 && match[1].toLowerCase() !== location.protocol)
                return true;

            if (match != null && typeof match[2] === 'string' && match[2].length > 0 && match[2].replace(new RegExp(':(' + { 'http:': 80, 'https:': 443 }[location.protocol] + ')?$'), '') !== location.host) {
                return true;
            }
            else {
                return false;
            }
        }
        let Dump = function () {
            let FirstPartyList = [], ThirdPartyList = [];
            document.querySelectorAll('a').forEach(function (element) {
                try {
                    let href = element.href
                    if (href != "#" && !href.includes("javascript:") && href) {
                        console.log("Contains Hostname: " + (href.includes(document.location.hostname.replace('www.', '')) ? "True \t" : "False\t") + "In List Already:" + (FirstPartyList.includes(href) || ThirdPartyList.includes(href) ? "True\t" : "False\t") + "Href: " + href);
                        if (!isExternal(href)) {
                            if (!FirstPartyList.includes(href))
                                FirstPartyList.push(href);
                        } else {
                            if (!ThirdPartyList.includes(href))
                                ThirdPartyList.push(href);
                        }
                    }
                } catch (e) {
                    console.log("Weird no href there");
                    console.trace(e);
                }
            });
            let data = { FirstParty: FirstPartyList, ThirdParty: ThirdPartyList };
            console.log(data)
            return data;
        };
        return Dump();
    });
}

async function archivePage(url, browser) {
    let archivePage = await browser.newPage();
    let data;
    try {
        await archivePage.goto("https://web.archive.org/save/" + url, { waitUntil: 'networkidle2', });

        data = (await archivePage.evaluate(() => {

            try {
                let rightNow = new Date();
                let res = rightNow.toISOString().slice(0, 10).replace(/-/g, "");
                if (document.location.href.split('/')[4].slice(0, 8) == res)
                    return { attempt: "Success", reason: document.location.href }
                try {
                    let text = document.querySelector("body > div.container > div:nth-child(2) > div > p").innerText;
                    return { attempt: (text.includes('HTTP status=') || text.includes('Please email us at "info@archive.org"')) ? "Success" : "Failure", reason: document.querySelector("body > div.container > div:nth-child(2) > div > p").innerText }
                } catch {
                    return { attempt: "Failure", reason: ("We landed on a site but it wasnt containing the current date in the navigator") }
                }
            } catch {
                return { attempt: "Failure", reason: "We didnt end up on the archive page so we couldnt parse date displayed" }
            }


        }));
        console.log("archive done of " + url + "\n", data);
    }
    catch { data = { attempt: "Failure", reason: "Navigation took longer than 30 seconds" } }
    archivePage.close();
    return data;

}

var Scannedsites = [];
var allFirstParty = [];
//dump firstparty sites
//loop through all firstparty sites and dump them if they havent been dumped
//return the list of all firstparty sites
async function ScanSiteHrefs(url, browser) {
    let tpage = await browser.newPage();
    await tpage.goto(url);
    let localFirstParty = await DumpHrefs(tpage);
    await tpage.close();
    localFirstParty = localFirstParty.FirstParty;
    Scannedsites += url;

    localFirstParty = localFirstParty.filter((el) => !Scannedsites.includes(el)); // remove all scanned sites from sites to scan array
    console.log("LocalFirst: " + localFirstParty);

    localFirstParty.forEach(function (value) {
        console.log("\nvalue: " + value);
        if (!allFirstParty.includes(value)) {
            console.log("Adding value to firstparty list " + value);
            allFirstParty += value;
        }
        if (!Scannedsites.includes(value)) {
            console.log("Searching value for more firstparty " + value);
            ScanSiteHrefs(value, browser);
        }

    })
}


const readline = require('readline');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const puppeteer = require('puppeteer');
//const { Console } = require('console');
//const { PassThrough } = require('stream');

const merge = (...arguments) => {

    // create a new object
    let target = {};

    // deep merge the object into the target object
    const merger = (obj) => {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                    // if the property is a nested object
                    target[prop] = merge(target[prop], obj[prop]);
                } else {
                    // for regular property
                    target[prop] = obj[prop];
                }
            }
        }
    };

    // iterate through all objects and 
    // deep merge them with target
    for (let i = 0; i < arguments.length; i++) {
        merger(arguments[i]);
    }

    return target;
};


(async () => {
    const url = await askQuestion("Enter the url to search: ");

    let useBrowser = await askQuestion("Type something if you would want to open the browser: ");
    if (useBrowser)
        useBrowser = false;
    else
        useBrowser = true;

    const browser = await puppeteer.launch({ headless: useBrowser }); // default is true
    const page = await browser.newPage();

    console.log("\nOpening Page " + url);
    await page.goto("http://" + url, { waitUntil: 'networkidle2', });
    console.log("Page Opened");
    //await ScanSiteHrefs("http://"+url, browser);



    let toArchive = [];
    let HrefList = await DumpHrefs(page); // dump all layer 1 firstparty 
    toArchive = HrefList.FirstParty;
    Scannedsites += page;                 // mark that we have scanned the link
    console.log("HrefList.First" + HrefList.FirstParty);
    for (value in HrefList.FirstParty) {
        //console.log(HrefList.FirstParty[value]);
        if (!Scannedsites.includes(HrefList.FirstParty[value])) { // if we havent scanned the site
            console.log("Scanning " + HrefList.FirstParty[value] + " as we havent scanned it yet");
            var tPage = await browser.newPage();
            try { // this is to prevent navigation crashes
                await tPage.goto(HrefList.FirstParty[value]);
                let tHrefList = await DumpHrefs(tPage); // add the hrefs to the hreflist
                console.log(tHrefList.FirstParty);
                toArchive += tHrefList.FirstParty;
            } catch (e){
                console.trace(e);
            }
            await tPage.close();

            Scannedsites += HrefList.FirstParty[value];
        }
    }
    try {
        toArchive = [...new Set(toArchive.split(","))];
    } catch {
        //console.log("The array cant be split.");
    }
    console.log(toArchive);
    while (toArchive.length >= 1) {
        let retVal = await archivePage(toArchive[0], browser);
        console.log("Placing %s in the " + ((retVal.attempt != "Success") ? "reattempt array" : "completed array"), toArchive[0]);
        if (retVal.attempt != "Success") {
            toArchive.push(toArchive[0]);
        }
        toArchive.shift();
        await sleep(5000); // we want to avoid too man active sessions
    }
    console.log("Finished");

})();
