<template>
  <div>
    <div class="peer-container">
      <div class="local-peer">
        Local peer
        <video ref="localPeer" autoplay></video>
        <textarea ref="loc" cols="30" rows="5"></textarea>
        <button @click="wsConn1">Connect</button>
      </div>
      <div class="remote-peer">
        Remote peer
        <video ref="remotePeer" autoplay></video>
        <textarea ref="rmt"cols="30" rows="5"></textarea>
        <button @click="wsConn2">Connect</button>
      </div>
      <div>
        <!--<button ref="startButton" class="my-btn btn-start" @click="getStream">Start</button>-->
        <!--<button ref="callButton" class="my-btn btn-call" @click="startCall">Call</button>-->
        <!--<button ref="hangoutButton" class="my-btn btn-call" @click="hangupCall">Hang Up</button>-->
        <!--<button ref="wsButton" @click="wsConnection">WS Conn</button>-->
      </div>
    </div>
  </div>
</template>

<script>
import '@/init';

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
        iceServers: [{ url: 'stun:stun.l.google.com:19302' }],
      },
      localStream: undefined,
      localPC: undefined,
      remotePC: undefined,
      websocket: undefined,
      localWS: undefined,
      remoteWS: undefined,
      localUser: 'user1',
      remoteUser: 'user2',
      disabledUser: 'user3',
    };
  },
  created() {
  },
  methods: {
    logTrace(msg, obj) {
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
        this.localPC.onicecandidate = (event) => {
          this.logTrace('on Ice candidate event');
          if (event.candidate) {
            this.sendLocalMessage({
              type: 'localIceCandidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            });
          } else {
            this.logTrace('End of candidates');
          }
        };
        this.localStream.getTracks().forEach(
          track => this.localPC.addTrack(track, this.localStream),
        );
        this.logTrace('Creating offer ...');
        this.localPC.createOffer(
          this.sdpConstraints,
        )
          .then(this.onLocalSessionCreated)
          .catch(this.errorCallback);
      } else if (type === 'remote') {
        this.remotePC = new RTCPeerConnection(config);
        this.logTrace('Created remote peer connection:', this.remotePC);
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
        this.remotePC.ontrack = this.gotRemoteStream;
      }
    },
    onLocalSessionCreated(desc) {
      this.logTrace('Local session created', desc);
      this.localPC.setLocalDescription(desc, () => {
        this.logTrace('sending local description', this.localPC.localDescription);
        this.sendLocalMessage(desc);
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
//      this.$refs.localPeer.src = window.URL.createObjectURL(stream);
      this.setUpAudio(stream);
      this.localStream = stream;
    },
    getLocalStream() {
      this.logTrace('Getting user media devices ...');
      navigator.getUserMedia(this.constraints, this.successLocalCallback, this.errorCallback);
    },
    getRemoteStream() {
      this.logTrace('Getting user media devices ...');
//      navigator.getUserMedia(this.constraints, () => {}, this.errorCallback);
    },
    gotRemoteStream(event) {
      this.$refs.remotePeer.srcObject = event.streams[0];
      this.logTrace('Remote peer received stream');
    },
    wsConn1() {
      this.remoteWS = new WebSocket(`ws://localhost:9000/${this.remoteUser}`);
      this.localWS = new WebSocket(`ws://localhost:9000/${this.localUser}`);
      this.wsLocalConnection();
      this.wsRemoteConnection();
      this.getLocalStream();
    },
    wsConn2() {
//      this.remoteWS = new WebSocket(`ws://localhost:8000/${this.remoteUser}`);
      this.getRemoteStream();
    },
    sendLocalMessage(message) {
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
//        if (data.type === 'remoteIceCandidate') {
//          this.localPC.addIceCandidate(new RTCIceCandidate({ candidate: data.candidate }));
//        }
        if (data.type === 'offer') {
          this.logTrace('Got offer, sending answer to remote peer');
          console.log(this.remotePC);
          this.remotePC.setRemoteDescription(
            new RTCSessionDescription(data),
            () => {},
            this.errorCallback,
          );
          this.remotePC.createAnswer()
            .then(this.onRemoteSessionCreated)
            .catch(this.errorCallback);
        }
//        if (data.type === 'answer') {
//          this.logTrace('Got answer');
//          this.remotePC.setRemoteDescription(
//            new RTCSessionDescription(data.message),
//            () => {},
//            this.errorCallback,
//          );
//        }
      };
      this.localWS.onerror = (evt) => {
        console.log(evt.data);
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
//        if (data.type === 'localIceCandidate') {
//          this.remotePC.addIceCandidate(new RTCIceCandidate({ candidate: data.candidate }));
//        }
        if (data.type === 'remoteIceCandidate') {
          this.localPC.addIceCandidate(new RTCIceCandidate({ candidate: data.candidate }));
          this.logTrace('added ice candidate to local peer', this.localPC);
        }
//        if (data.type === 'offer') {
//          this.logTrace('Got offer, sending answer to remote peer');
//          this.localPC.setRemoteDescription(
//            new RTCSessionDescription(data.message),
//            () => {},
//            this.errorCallback,
//          );
//          this.remotePC.createAnswer()
//            .then(this.onRemoteSessionCreated)
//            .catch(this.errorCallback);
//        }
        if (data.type === 'answer') {
          this.logTrace('Got answer');
          this.localPC.setRemoteDescription(
            new RTCSessionDescription(data),
            () => {},
            this.errorCallback,
          );
        }
      };
      this.remoteWS.onerror = (evt) => {
        console.log(evt.data);
      };
    },
  },
};
</script>

<style scoped>
  .local-peer, .remote-peer {
    display: inline-block;
  }
  .local-peer>video, .remote-peer>video {
    width: 400px;
    height: 250px;
    background-color: #000;
  }
</style>
