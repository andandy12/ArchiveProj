# ArchiveProj

Archive a sites hrefs through archive.org

## Installation

You must have [node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed to install and run the script.

To check if these programs are installed you can run `node-v` and `npm -v`, if either of these commands cause a error or print a non-valid version number you must install them.

After npm is working properly in order to install all dependencies, run `npm i` in the same directory as `package.json`, alternatively you could run `install.bat` which will check if you have the required dependencies installed.

## Usage

To run the script you must run either of the below commands.



>npm run-script test

>

>node .\index.js



When prompted you must enter your website which to scan. Following the first prompt you will recieve another, if you want the chrome instance to be headless just press enter.



Next the program will start to open pages logging all hrefs into an array, after all the layer 1 outlinks are captured. It will start the archive process... which will attempt to save a site to [web.archive.org](https://web.archive.org/save/)



To halt the program you must hit `Ctrl+C`, it may take two attempts.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

