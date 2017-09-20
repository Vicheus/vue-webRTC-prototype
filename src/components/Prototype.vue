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

    <!--<div class="peer-container">-->
    <!--<div class="local-peer">-->
    <!--<video ref="localPeer" autoplay></video>-->
    <!--<button @click="wsConn1">Call</button>-->
    <!--<button @click="hangupCall">Hangup</button>-->
    <!--</div>-->
    <!--<div class="remote-peer">-->
    <!--<video ref="remotePeer" autoplay></video>-->
    <!--</div>-->
    <!--</div>-->
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
        peerConnConfig: {
          iceServers: [{
            url: 'stun:stun.l.google.com:19302',
          }],
        },
        localStream: undefined,
        remoteStream: undefined,
        localPC: undefined,
        remotePC: undefined,
        websocket: undefined,
        localWS: undefined,
        remoteWS: undefined,
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
      };
    },
    created() {
    },
    methods: {
      logTrace(msg, obj) {
        // eslint-disable-next-line
        console.log(`${(performance.now() / 1000).toFixed(3)} : ${msg}`, obj);
      },
      setUpAudio(stream) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext();
        const audioContext = new AudioContext();
        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        mediaStreamSource.connect(audioContext.destination);
      },
//    getLocalIceCandidate(candidate) {
//      if (candidate) {
//        this.remotePC.addIceCandidate(new RTCIceCandidate(candidate));
//        this.logTrace(`Local ICE candidate: \n ${candidate}`);
//      }
//    },
//    getRemoteIceCandidate(candidate) {
//      if (candidate) {
//        this.localPC.addIceCandidate(new RTCIceCandidate(candidate));
//        this.logTrace(`Remote ICE candidate: \n ${candidate}`);
//      }
//    },
//    addRemoteStream(event) {
//      this.logTrace('Added remote stream');
//      this.$refs.remotePeer.src = window.URL.createObjectURL(event.stream);
//    },
//    getLocalDescription(description) {
//      this.localPC.setLocalDescription(description);
//      this.logTrace(`Offer from local peer connection ${description.sdp}`);
//      this.remotePC.setRemoteDescription(description);
//      this.remotePC.createAnswer()
//        .then(desc => this.getRemoteDescription(desc))
//        .catch(error => this.failureCallback(error));
//    },
//    getRemoteDescription(description) {
//      this.remotePC.setLocalDescription(description);
//      this.logTrace(`Answer from remote peer connection ${description.sdp}`);
//      this.localPC.setRemoteDescription(description);
//    },
      hangupCall() {
        this.logTrace('Cancell call');
        this.localPC.close();
        this.remotePC.close();
        this.localPC = undefined;
        this.remotePC = undefined;
      },
//    startCall() {
//      this.logTrace('Start calling');
//      if (this.localStream.getVideoTracks().length > 0) {
//        this.logTrace('Connected to video source', this.localStream.getVideoTracks()[0].label);
//      }
//      if (this.localStream.getAudioTracks().length > 0) {
//        this.logTrace('Connected to audio source', this.localStream.getAudioTracks()[0].label);
//      }
//
//      this.localPC = new RTCPeerConnection(this.peerConnConfig);
//      this.logTrace('Created local peer connection');
//      this.localPC.onicecandidate = this.getLocalIceCandidate;
//      this.remotePC = new RTCPeerConnection(this.peerConnConfig);
//      this.logTrace('Created remote peer connection');
//      this.remotePC.onicecandidate = this.getRemoteIceCandidate;
//      this.remotePC.onaddstream = this.addRemoteStream;
//      this.localPC.addStream(this.localStream);
//      this.logTrace('Added local stream to local peer connection');
//      this.localPC.createOffer()
//        .then(description => this.getLocalDescription(description))
//        .catch(error => this.failureCallback(error));
//    },
      createPeerConnection(type, config) {
        this.logTrace('Creating peer connection ...');
        if (type === 'local') {
          this.localPC = new RTCPeerConnection(config);
          this.logTrace(`Created local peer connection: ${this.localPC}`);
          this.localPC.addStream(this.localStream);
          this.logTrace('Added stream to local pc', this.remotePC);
          this.connectionEstablished = true;
          this.localPC.onicecandidate = (event) => {
            this.logTrace('on Ice candidate event');
            if (event.candidate) {
              this.sendMessage({
                type: 'localIceCandidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate,
              });
            } else {
              this.logTrace('End of candidates');
            }
          };
          this.localPC.onaddstream = this.gotLocalStream;
          this.logTrace('Creating offer ...');
          this.localPC.createOffer(
            this.sdpConstraints,
          )
            .then(this.onLocalSessionCreated)
            .catch(this.errorCallback);
        } else if (type === 'remote') {
          this.remotePC = new RTCPeerConnection(config);
          this.logTrace('Created remote peer connection:', this.remotePC);
          this.remotePC.addStream(this.remoteStream);
          this.logTrace('Added stream to remote pc', this.remotePC);
          this.remotePC.onicecandidate = (event) => {
            this.logTrace('on Ice candidate event');
            if (event.candidate) {
              this.sendRemoteMessage({
                type: 'remoteIceCandidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate,
              });
            } else {
              this.logTrace('End of candidates');
            }
          };
          this.remotePC.onaddstream = this.gotRemoteStream;
        }
      },
      onLocalSessionCreated(desc) {
        this.logTrace('Local session created', desc);
        this.localPC.setLocalDescription(desc, () => {
          this.logTrace('sending local description', this.localPC.localDescription);
          this.sendMessage(desc);
        }, this.errorCallback);
      },
      onRemoteSessionCreated(desc) {
        this.logTrace('Remote session created', desc);
        this.remotePC.setLocalDescription(desc, () => {
          this.logTrace('sending remote description', this.remotePC.localDescription);
          this.sendRemoteMessage(desc);
        }, this.errorCallback);
      },
      errorCallback(e) {
        this.logTrace('Reeeejected!', e);
      },
      successLocalCallback(stream) {
        this.logTrace('Connected to media devices');
        this.setUpAudio(stream);
        this.localStream = stream;
        this.remoteWS = new WebSocket(`ws://localhost:9000/${this.remoteUser}`);
        this.localWS = new WebSocket(`ws://localhost:9000/${this.localUser}`);
        this.wsLocalConnection();
        this.wsRemoteConnection();
      },
      successRemoteCallback(stream) {
//        todo: resolve remotePC after remote stream created
        this.logTrace('Connected to media devices');
        this.setUpAudio(stream);
        this.remoteStream = stream;
      },
      getLocalStream() {
        this.logTrace('Getting user media devices ...');
        navigator.mediaDevices.getUserMedia(this.constraints)
          .then(this.successLocalCallback)
          .catch(this.errorCallback);
      },
      getRemoteStream() {
        this.logTrace('Getting user media devices ...');
        navigator.mediaDevices.getUserMedia(this.constraints)
          .then(this.successRemoteCallback)
          .catch(this.errorCallback);
      },
      gotRemoteStream(event) {
        this.logTrace('Remote peer received stream');
        this.$refs.remotePeer.srcObject = event.stream;
      },
      gotLocalStream(event) {
        this.logTrace('Local peer received stream');
        this.$refs.localPeer.srcObject = event.stream;
      },
      call(contact) {
        this.isActive = {};
        this.isActive[contact.name] = true;
        this.remoteUser = contact.username;
        this.getRemoteStream();
        this.getLocalStream();
      },
      sendMessage(message) {
        this.localWS.send(JSON.stringify(message));
      },
      sendRemoteMessage(message) {
        this.remoteWS.send(JSON.stringify(message));
      },
      wsLocalConnection() {
//      console.log('websocket connection opened');
//      this.websocket.send(JSON.stringify({
//        type: 'message',
//        name: 'Shura',
//        message: 'Hello',
//        toUser: this.remoteUser,
//      }));
//      this.localWS.onopen = (e) => {};
        this.localWS.onmessage = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.type === 'ready') {
            this.logTrace('Connection is ready');
            this.createPeerConnection('local', this.peerConnConfig);
          }
          if (data.type === 'localIceCandidate') {
            this.remotePC.addIceCandidate(new RTCIceCandidate({ candidate: data.candidate }));
            this.logTrace('added ice candidate to remote peer', this.remotePC);
          }
          if (data.type === 'offer') {
            this.logTrace('Got offer, sending answer to remote peer');
            this.logTrace(this.remotePC);
            this.remotePC.setRemoteDescription(
              new RTCSessionDescription(data),
              () => {
              },
              this.errorCallback,
            );
            this.remotePC.createAnswer()
              .then(this.onRemoteSessionCreated)
              .catch(this.errorCallback);
          }
        };
        this.localWS.onerror = (evt) => {
          this.logTrace(evt.data);
        };
      },
      wsRemoteConnection() {
//      this.remoteWS.onopen = (e) => {};
        this.remoteWS.onmessage = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.type === 'ready') {
            this.logTrace('Connection is ready');
            this.createPeerConnection('remote', this.peerConnConfig);
          }
          if (data.type === 'remoteIceCandidate') {
            this.localPC.addIceCandidate(new RTCIceCandidate({ candidate: data.candidate }));
            this.logTrace('added ice candidate to local peer', this.localPC);
          }
          if (data.type === 'answer') {
            this.logTrace('Got answer');
            this.localPC.setRemoteDescription(
              new RTCSessionDescription(data),
              () => {
              },
              this.errorCallback,
            );
          }
        };
        this.remoteWS.onerror = (evt) => {
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
    border-radius: 5px
  }

  .hangup {
    margin: 0 auto;
    display: block;
    width: 100px;
    height: 100px;
    transform: rotateZ(135deg);
  }
</style>
