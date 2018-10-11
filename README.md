# ChatDapp

This is a peer-to-peer chat app. It is static and has no external dependencies, build to be hosted on the [Interplanetary File System (IPFS)](https://ipfs.io/). Try it [here](https://ipfs.io/ipfs/QmaBhZngNiqANW4tXWC2voZi7Pn821rQsenFFRGiMFrfPZ).

## Features

* Choose a room by appending the url parameter `room` to the URL: [https://ipfs.io/ipfs/QmaBhZngNiqANW4tXWC2voZi7Pn821rQsenFFRGiMFrfPZ/?room=MyRoom](https://ipfs.io/ipfs/QmaBhZngNiqANW4tXWC2voZi7Pn821rQsenFFRGiMFrfPZ/?room=MyRoom)
* File upload via IPFS
* Markdown support
* End-to-end encryption (via `room` ID as passphrase)

## Install

1. This app works best with `window.ipfs`. Install the IPFS Companion web extension:

    <a href="https://addons.mozilla.org/en-US/firefox/addon/ipfs-companion/" title="Get the add-on"><img width="86" src="https://blog.mozilla.org/addons/files/2015/11/AMO-button_1.png" /></a> <a href="https://chrome.google.com/webstore/detail/ipfs-companion/nibjojkomfdiaoajekhjakgkdhaomnch" title="Get the extension"><img width="103" src="https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png" /></a>

2. Install dependencies `yarn install`
3. Build the app `yarn build`
4. Start the app `yarn start`

### Develop

Instead of steps 3 & 4: `yarn watch`

### Deploy

1) [Install ipfs](https://docs.ipfs.io/introduction/install/)
2) Add to ipfs via `ipfs add -r dist/` and copy the `hash` for the `dist` folder (this should be the latest displayed hash). The App should be now availabe at `https://ipfs.io/ipfs/<hash>`.
3) Update the links in this readme.

### Thanks

This project is based on [Texile's IPFS ĐApp Template](https://github.com/textileio/dapp-template/tree/build/profile-chat) and this medium post: [Build a Decentralized Chat App with Knockout and IPFS](https://medium.com/textileio/build-a-decentralized-chat-app-with-knockout-and-ipfs-fccf11e8ce7b)

