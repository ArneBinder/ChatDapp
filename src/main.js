// taken from https://medium.com/textileio/build-a-decentralized-chat-app-with-knockout-and-ipfs-fccf11e8ce7b

import 'babel-polyfill'
import Room from 'ipfs-pubsub-room'
import IPFS from 'ipfs'
import ko from 'knockout'

var md = require('markdown-it')();
var AES = require("crypto-js/aes");
var encUTF8 = require('crypto-js/enc-utf8')

// Global references for demo purposes
let ipfs
let viewModel
let room

const setup = async () => {  
  // Create view model with properties to control chat
  function ViewModel() {
    let self = this
    // Stores username
    self.name = ko.observable('')
    // Stores current message
    self.message = ko.observable('')
    // Stores array of messages
    self.messages = ko.observableArray([])
    // Stores local peer id
    self.id = ko.observable(null)
    // Stores whether we've successfully subscribed to the room
    self.subscribed = ko.observable(false)
    // Logs latest error (just there in case we want it)
    self.error = ko.observable(null)
    // We compute the ipns link on the fly from the peer id
    self.url = ko.pureComputed(() => {
      return `https://ipfs.io/ipns/${self.id()}`
    })

    self.roomID = ko.observable(null)

    self.key = ko.observable(null)

  }
  // Create default view model used for binding ui elements etc.
  viewModel = new ViewModel()
  // Apply default bindings
  ko.applyBindings(viewModel)
  window.viewModel = viewModel // Just for demo purposes later!

  try {
    ipfs = new IPFS({
      // We need to enable pubsub...
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          // set another port to avoid collisions
          Gateway: "/ip4/127.0.0.1/tcp/8091",
          // ...And supply swarm address to announce on
          Swarm: [
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
            '/ip4/0.0.0.0/tcp/4001',
            '/ip6/::/tcp/4001'
          ]
        }
      }
    })
  } catch(err) {
    console.error('Failed to initialize peer', err)
    viewModel.error(err) // Log error...
  }
  
  try {
    ipfs.on('ready', async () => {
      const id = await ipfs.id()
      // Update view model
      viewModel.id(id.id)
      //const roomID = "test-room-1234"
	    const url = new URL(window.location.href)
  	  const roomID = url.searchParams.get("room") || "test-room-1234"
  	  viewModel.roomID(roomID)
  	  console.log('roomID: ' + roomID);
      // Create basic room for given room id
      room = Room(ipfs, roomID)
      // Once the peer has subscribed to the room, we enable chat,
      // which is bound to the view model's subscribe
      room.on('subscribed', () => {
        // Update view model
        viewModel.subscribed(true)
      })

      viewModel.key(url.searchParams.get("key") || roomID)
      console.log('key: ' + viewModel.key());
      // When we receive a message...
      room.on('message', (msg) => {
        const pm = processMessage(msg)
        if (pm != null) {
          viewModel.messages.push(pm)
          var element = document.getElementById("messages");
          element.scrollTop = element.scrollHeight;
        }
      })
	  document.getElementById("send").addEventListener("click", async () => send(), false);

	  // Send message on Enter 
	  // Get the input field
	  var input = document.getElementById("text");
	  // Execute a function when the user releases a key on the keyboard
	  input.addEventListener("keyup", async(event) => {
	    // Cancel the default action, if needed
	    event.preventDefault();
	    // Number 13 is the "Enter" key on the keyboard
	    if (event.keyCode === 13) {
	      // Trigger the button element with a click
	      send();
	    }
	   }); 

	  // file upload
	  document.getElementById ("file").addEventListener("change", async () => upload(), false);

    // Leave the room when we unload
    window.addEventListener('unload', async () => await room.leave())
    })

  } catch(err) {
    console.error('Failed to setup chat room', err)
    viewModel.error(err)
  }
  console.log("Ready for chat!")
}

function processMessage(msg) {
  try{
    const cyphertext = msg.data.toString()
    // Decrypt
    const bytes  = AES.decrypt(cyphertext, viewModel.key());
    const data = JSON.parse(bytes.toString(encUTF8));
    // Update msg name (default to anonymous)
    msg.name = data.name ? data.name : "anonymous"
    // Update msg text (just for simplicity later)
    msg.text = data.text
    msg.html = md.render(data.text)
    var date = new Date(data.date)
    msg.time = date.toLocaleTimeString()
    msg.date = date.toLocaleDateString()
    return msg
   } catch(err) {
    console.log('Failed to process message (wrong decryption key?): ' + err.toString())
    //viewModel.error(err)
    return null
  }
}

function send() {
  	//console.log(text)
    // If not actually subscribed or no text, skip out
    const text = viewModel.message()
    if (!viewModel.subscribed() || !text) return
    try {
      // Get current name
      const name = viewModel.name()
      // Get current message (one that initiated this update)
      const msg = viewModel.message()
      //const time = new Date().toLocaleString()
      const date = new Date()
      // Encrypt
      const ciphertext = AES.encrypt(JSON.stringify({ name, text, date }), viewModel.key()).toString()
      
      // Broadcast message to entire room as JSON string
      room.broadcast(Buffer.from(ciphertext))
    } catch(err) {
      console.error('Failed to publish message', err)
      viewModel.error(err)
    }
    // Empty message in view model
    viewModel.message('')
}

function upload() {
  const reader = new FileReader();
  console.log('add data to ipfs...')
  const file = document.getElementById("file");
  reader.onloadend = function() {
    //const ipfs = window.IpfsApi('localhost', 5001) // Connect to IPFS
    const buf = Buffer.from(reader.result) // Convert data into buffer
    ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
      if(err) {
        console.error(err)
        return
      }
      let url = `https://ipfs.io/ipfs/${result[0].hash}`
      console.log(`Url --> ${url}`)
      viewModel.message(`[${file.files[0].name}](${url})`)
    })
  }
  
  reader.readAsArrayBuffer(file.files[0]); // Read Provided File
}

// Modify markdown parser: add target="_blank" to all links 
// Remember old renderer, if overriden, or proxy to default renderer
var defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('target');

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']); // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

setup()