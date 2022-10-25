# LinuxNote
## Electron app integrating OneNote into a linux app


LinuxNote is an electron based app designed to bring onenote to the linux desktop. Currently supports two url tabs that the adresses can be customized from the settings page. 

![image of app](https://github.com/1Jamie/linuxnote/blob/main/LinuxNote-0.png?raw=true)
![image of app dark](https://github.com/1Jamie/linuxnote/blob/main/LinuxNote-0-dark.png?raw=true)

## Currently Working

- install to desktop (builds for linux deb and rpm and support for windows builds)
- dual button usage for two pages, defualt is set to notebooks https://onenote.com/notebooks and server list with url https://google.com
- customizable nav buttons
- open last opened page from close
- ✨settings✨
- button name customization
- url customization
- darkmode for both added urls if the are different (its a lazy webkit invert)
- invert amount slider for dark mode
- tray icon for the app, requires app restart to take effect.
- persistent settings across app loads

## Planned Features

- dynamic tabs (ability to add more)
- external link handling (if its a link from the same hostname it navigates if its not it opens in default browser currently)
- window customizations like bar color or force page fonts
- Tab js/css injection so you can change styles to your liking (kinda in the works, at least webkit i was able to test working)
- Note taking built in. Yes i know its onenote, but some of us use it to access work info so notes would be nice
- Maybe Mac support

> Some of these features may never come or might take
> a while as i have multiple things im working on
> next main feature right now is the custom tabs and link handling

## Tech

LinuxNote is built on electron and uses relatively few pieces and used electron forge to build

- [Electron](https://www.npmjs.com/package/electron) - Nodejs Desktop application framework .
- [Electron-Store](https://www.npmjs.com/package/electron-store) - persistent settings and storing for electron apps.
- [Electron-Forge](https://npmjs.com/package/electron-forge) - A complete tool for building modern Electron applications.
- [Node.JS](https://nodejs.org/en/) - Open-source, cross-platform JavaScript runtime environment.
- [NPM](https://npmjs.com) - The package manager for Node.js. 


## Building
the steps to build this for linux are honestly rather easy
- Install nodejs and npm on your system. Please follow [npm's documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- clone the repo to your local system 
```
$ git clone https://github.com/1jamie/LinuxNote.git
```
- install the packages (change into the apps directory first please, i feel like this should be a given)
```
$ npm install
```
- It should be good to go now! Lets make it!
```
$ npm run make
```
if there are no issues you should now have a /out folder in your app directory. If you go down the rabbit hole to your distribution you should have a deb file or rpm ready to use!

## Building for Windows
this one is honestly a huge pain....  I had to do it all on windows because doing it from linux the install randomly broke, for the self signed app signing cert look at the bottom of the page. It is marked in the pacakge-win.json as my local one so please make one for yourself and update accordingly.
sorry this section is short as i am not proficient in this department

- install git and nodejs
- clone the repo or download and extract
- open a powershell or cmd to the folder in which the repo is cloned
- npm install
- npm run make-win

## Sign Key and Cert (Only For Windows Installer)

So this is that annoying part where i tell you how to do this, and its not anything crazy, just annoying. We are going to do this with openssl
- install openssl
```
Debian based:
    $ sudo apt install openssl
RHEL based:
    $ sudo yum install openssl
```
- Generate key we are going to use
```
openssl genrsa 2048 > self.key && chmod 400 self.key
```
- Generate the CSR to get our certificate, it will ask for basic information on the cert just follow the prompts but the last two optional ones are up to you
```
openssl req -key self.key -new -out appstuffs.csr
```
- Take this csr and sign it
```
openssl x509 -req -days 3650 -in appstuffs.csr -signkey self.key -out LinuxNote.crt
```
- Now we need to take the key and crt and make a pfx pack of it
```
openssl pkcs12 -export -out LinuxNote.pfx -inkey self.key -in LinuxNote.crt
```
Now you should have a LinuxNote.pfx! toss it in the app directory and point to it in the package.json

## Contributing
uhhhh, not a clue, just try to keep it tidy and file a pull request, i dont mind giving stuff a read!

