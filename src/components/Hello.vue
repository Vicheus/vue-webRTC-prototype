<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <video autoplay></video>
  </div>
</template>

<script>
export default {
  name: 'hello',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  created() {
    this.streamVideo();
  },
  methods: {
    streamVideo() {
      const onFailSoHard = (e) => {
        console.log('Reeeejected!', e);
      };

      // Not showing vendor prefixes.
      navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
        const video = document.querySelector('video');
        video.src = window.URL.createObjectURL(localMediaStream);

        // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
        // See crbug.com/110938.
        video.onloadedmetadata = (e) => {
          // Ready to go. Do some stuff.
          console.log('metadata loaded', e);
        };
      }, onFailSoHard);
    },
  },
};
</script>

<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
