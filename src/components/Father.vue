<template>
  <div class="screen">
    <div class="side-controls">
      <div class="controls-container">
        <div
          :class="{contacts: contacts.length < 5 || !connectionEstablished, 'contacts-small': contacts.length >= 5 || connectionEstablished}">
          <div :class="{contact: contacts.length < 5 || !connectionEstablished,
           'contact-small': contacts.length >= 5 || connectionEstablished,
            active: isActive[contact.name]}"
               v-for="(contact, index) in contacts"
               :key="index" @click="call(contact)">
            <img class="avatar" :src="contact.avatar" :alt="contact.name">
            <div class="contact-name">{{contact.name}}</div>
          </div>
        </div>
        <div class="local-peer">
          <video ref="screenSharing" autoplay></video>
          <button class="my-btn" @click="shareScreen">Share my screen</button>
        </div>
        <div class="local-peer">
          <video ref="localPeer" autoplay></video>
          <div class="hangup-call" v-if="connectionEstablished">
            <img src="../../static/hangup.png" alt="hangup" class="hangup" @click="hangupCall">
          </div>
        </div>
      </div>
    </div>

    <div class="remote-peer">
      <video ref="remotePeer" autoplay></video>
    </div>
  </div>
</template>

<script>
  const img = require('../../static/logo.png');

  export default {
    data() {
      return {
        constraints: {
          video: {
            width: 400,
            height: 250,
          },
          audio: true,
        },
        sdpConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
        screenSharingConstraints: {
          mandatory: {
            chromeMediaSource: 'desktop',
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080,
            chromeMediaSourceId: this.sourceId,
          },
          optional: [
            { googTemporalLayeredScreencast: true },
          ],
        },
        peerConnConfig: {
          iceServers: [{
            url: 'stun:stun.l.google.com:19302',
          }],
        },
        localStream: undefined,
        localPC: undefined,
        websocket: undefined,
        localWS: undefined,
        localUser: 'User1',
        remoteUser: 'User2',
        contacts: [
          {
            name: 'Son',
            avatar: img,
            username: 'User2',
          },
          {
            name: 'Dmytriy',
            avatar: img,
            username: 'User3',
          },
          {
            name: 'Masha',
            avatar: img,
            username: 'User4',
          },
          {
            name: 'Ira',
            avatar: img,
            username: 'User5',
          },
        ],
        isActive: {},
        connectionEstablished: false,
        websocketHost: 'ws://localhost:9000/',
        incomingCall: 'incoming call',
        outgoingCall: 'outgoing call',
        sourceId: undefined,
      };
    },
    created() {
      this.localWS = new WebSocket(`${this.websocketHost}${this.localUser}`);
      this.wsLocalConnection();
    },
    methods: {
      logTrace(msg, obj) {
        // eslint-disable-next-line
        console.log(`${(performance.now() / 1000).toFixed(3)} : ${msg}`, obj);
      },
      sendMessage(msg, user) {
        const message = {};
        message.data = msg;
        message.toUser = user;
        this.localWS.send(JSON.stringify(message));
      },
      call(contact) {
        this.isActive = {};
        this.isActive[contact.name] = true;
        this.remoteUser = contact.username;
        this.sendMessage({ type: this.incomingCall }, this.remoteUser);
        this.getLocalStream(this.outgoingCall);
      },
      getLocalStream(type) {
        this.logTrace('Getting father media devices ...');
        navigator.mediaDevices.getUserMedia(this.constraints)
          .then(stream => this.successLocalCallback(stream, type))
          .catch(this.errorCallback);
      },
      successLocalCallback(stream, type) {
        this.logTrace('Connected to father media devices');
        this.setUpAudio(stream);
        this.localStream = stream;
        this.gotLocalStream(stream);
        this.createPeerConnection(type, this.peerConnConfig);
      },
      errorCallback(e) {
        this.logTrace('Reeeejected!', e);
      },
      setUpAudio(stream) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext();
        const audioContext = new AudioContext();
        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        mediaStreamSource.connect(audioContext.destination);
      },
      hangupCall() {
        this.logTrace('Cancell call');
        this.localPC.close();
        this.remotePC.close();
        this.localPC = undefined;
        this.remotePC = undefined;
      },
      createPeerConnection(type, config) {
        this.logTrace('Creating father peer connection ...');
        if (type === this.outgoingCall) {
          this.localPC = new RTCPeerConnection(config);
          this.logTrace('Created father peer connection:', this.localPC);
          this.localPC.addStream(this.localStream);
          this.logTrace('Added stream to father pc', this.localStream);
          this.connectionEstablished = true;
          this.localPC.onicecandidate = (event) => {
            this.logTrace('on father Ice candidate event');
            if (event.candidate) {
              this.sendMessage({
                type: 'iceCandidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate,
              }, this.remoteUser);
            } else {
              this.logTrace('End of candidates');
            }
          };
          this.localPC.onaddstream = this.gotRemoteStream;
          this.logTrace('Creating offer ...');
          this.localPC.createOffer(this.sdpConstraints)
            .then(this.onLocalSessionCreated)
            .catch(this.errorCallback);
        } else if (type === this.incomingCall) {
          this.localPC = new RTCPeerConnection(config);
          this.logTrace('Created father peer connection:', this.localPC);
          this.localPC.addStream(this.localStream);
          this.logTrace('Added stream to father pc', this.localStream);
          this.connectionEstablished = true;
          this.localPC.onicecandidate = (event) => {
            this.logTrace('on father Ice candidate event');
            if (event.candidate) {
              this.sendMessage({
                type: 'iceCandidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate,
              }, this.remoteUser);
            } else {
              this.logTrace('End of candidates');
            }
          };
          this.localPC.onaddstream = this.gotRemoteStream;
        }
      },
      gotLocalStream(stream) {
        this.logTrace('Father peer received stream');
        this.$refs.localPeer.srcObject = stream;
      },
      gotRemoteStream(event) {
        this.logTrace('Father peer received stream');
        this.$refs.remotePeer.srcObject = event.stream;
      },
      onLocalSessionCreated(desc) {
        this.logTrace('Father session created', desc);
        this.localPC.setLocalDescription(desc, () => {
          this.logTrace('sending father local description', this.localPC.localDescription);
          this.sendMessage(desc, this.remoteUser);
        }, this.errorCallback);
      },
      getScreen(sourceId) {
        this.sourceId = sourceId;
        const constraints = this.screenSharingConstraints;
        navigator.mediaDevices.getUserMedia({ video: constraints })
          .then((stream) => {
            this.$refs.screenSharing.src = URL.createObjectURL(stream);
          })
          .catch(this.errorCallback);
      },
      shareScreen() {
        window.postMessage('requestScreenSourceId', '*');
        window.addEventListener('message', (msg) => {
          if (msg.data && msg.data.sourceId) {
            this.getScreen(msg.data.sourceId);
          }
        }, false);
      },
      wsLocalConnection() {
        this.localWS.onmessage = (evt) => {
          const message = JSON.parse(evt.data);
          if (message.type === 'ready') {
            this.logTrace('Connection is ready');
          }
          if (Object.prototype.hasOwnProperty.call(message, 'data')
            && message.data.type === this.incomingCall) {
            this.getLocalStream(this.incomingCall);
          }
          if (Object.prototype.hasOwnProperty.call(message, 'data')
            && message.data.type === 'iceCandidate') {
            this.localPC.addIceCandidate(new RTCIceCandidate({ candidate: message.data.candidate }));
            this.logTrace('added ice candidate to son peer', this.remotePC);
          }
          if (Object.prototype.hasOwnProperty.call(message, 'data')
            && message.data.type === 'offer') {
            this.logTrace('Got offer, sending answer to father peer');
            this.localPC.setRemoteDescription(
              new RTCSessionDescription(message.data),
              () => {},
              this.errorCallback,
            );
            this.localPC.createAnswer()
              .then(this.onLocalSessionCreated)
              .catch(this.errorCallback);
          }
          if (Object.prototype.hasOwnProperty.call(message, 'data')
            && message.data.type === 'answer') {
            this.logTrace('Got answer');
            this.localPC.setRemoteDescription(
              new RTCSessionDescription(message.data),
              () => {},
              this.errorCallback,
            );
          }
        };
        this.localWS.onerror = (evt) => {
          this.logTrace(evt.data);
        };
      },
    },
  };
</script>

<style scoped>
  .screen {
    width: 100vw;
    height: 100vh;
    background: aqua;
    display: flex;
  }

  .remote-peer {
    width: 100%;
    height: 100vh;
    position: relative;
  }

  .remote-peer > video {
    width: 100%;
    height: 100%;
    background-color: #000;
  }

  .side-controls {
    width: 300px;
    height: 100vh;
    background: blueviolet;
  }

  .controls-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .contacts {
    width: 100%;
  }

  .contacts-small {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    height: 300px;
    overflow: hidden;
  }

  .contact-small {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    background-color: #ccc;
    border-radius: 5px;
    width: 140px;
    height: 140px;
    margin: 5px;
  }

  .contact {
    margin: 5px;
    margin-bottom: 2.5px;
    display: flex;
    align-items: center;
    border-radius: 5px;
    background-color: #ccc;
    cursor: pointer;
  }

  .active {
    background-color: lightgreen;
  }

  .contact-small .avatar {
    width: 110px;
    height: 110px;
  }

  .avatar {
    width: 100px;
    height: 100px;
    display: block;
    margin: 5px;
  }

  .contact-small .contact-name {
    display: none;
  }

  .contact .contact-name {
    margin-left: 30px;
  }

  video {
    display: block;
  }

  .local-peer {
    margin: 5px;
  }

  .local-peer > video {
    width: 290px;
    border-radius: 5px;
    background-color: #000;
  }

  .hangup-call {
    margin-top: 5px;
    background-color: red;
    height: 130px;
    border-radius: 5px;
    cursor: pointer;
  }

  .hangup {
    margin: 0 auto;
    display: block;
    width: 100px;
    height: 100px;
    transform: rotateZ(135deg);
  }
</style>
