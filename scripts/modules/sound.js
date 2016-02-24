function Sound(){

  var audioContext = new AudioContext();

  var self = {
    src: {},
    play: function(name){
      if(!self.src[name]) return;
      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = self.src[name];
      bufferSource.connect(audioContext.destination);
      bufferSource.start(audioContext.currentTime + 0.100);
    },
    playHit: function(){
      self.play('doko');
    },
    playMiss: function(){
      self.play('kinzoku');
    },
    playMusic: function(){
      playMusic();
    }
  };

  loadSoundFile();

  return self;

  function loadSoundFile(){
    Promise.all([
      '/resource/sound/doko.mp3',
      '/resource/sound/kinzoku.mp3'
    ].map(function(url){
        return AudioHelper.loadAudioBuffer(audioContext, url);
    })).then(function(buffer){
      self.src.doko = buffer[0];
      self.src.kinzoku = buffer[1];
    });
  }

  function playMusic(){
    T("audio").load("/resource/sound/drumkit.wav", function() {
      var BD  = this.slice(   0,  500).set({bang:false});
      var SD  = this.slice( 500, 1000).set({bang:false});
      var HH1 = this.slice(1000, 1500).set({bang:false, mul:0.2});
      var HH2 = this.slice(1500, 2000).set({bang:false, mul:0.2});
      var CYM = this.slice(2000).set({bang:false, mul:0.2});
      var scale = new sc.Scale([0,1,3,7,8], 12, "Pelog");

      var P1 = [
        [BD, HH1],
        [HH1],
        [HH2],
        [],
        [BD, SD, HH1],
        [HH1],
        [HH2],
        [SD],
      ].wrapExtend(128);

      var P2 = sc.series(16);

      var drum = T("lowshelf", {freq:110, gain:8, mul:0.6}, BD, SD, HH1, HH2, CYM).play();
      var lead = T("saw", {freq:T("param")});
      var vcf  = T("MoogFF", {freq:2400, gain:6, mul:0.1}, lead);
      var env  = T("perc", {r:100});
      var arp  = T("OscGen", {wave:"sin(15)", env:env, mul:0.5});

      T("delay", {time:"BPM128 L4", fb:0.65, mix:0.35},
        T("pan", {pos:0.2}, vcf),
        T("pan", {pos:T("tri", {freq:"BPM64 L1", mul:0.8}).kr()}, arp)
      ).play();

      T("interval", {interval:"BPM128 L16"}, function(count) {
        var i = count % P1.length;
        if (i === 0) CYM.bang();

        P1[i].forEach(function(p) { p.bang(); });

        if (Math.random() < 0.015) {
          var j = (Math.random() * P1.length)|0;
          P1.wrapSwap(i, j);
          P2.wrapSwap(i, j);
        }

        var noteNum = scale.wrapAt(P2.wrapAt(count)) + 60;
        if (i % 2 === 0) {
          lead.freq.linTo(noteNum.midicps() * 2, "100ms");
        }
        arp.noteOn(noteNum + 24, 60);
      }).start();
    });

  }
}

window.AudioHelper = function(){}
AudioHelper.loadAudioBuffer = function(audioContext, url){
  var _decodeAudioData = function(audioFile, cb){
    audioContext.decodeAudioData(
        audioFile,
        function(buffer) {
            if (!buffer) {
                alert('error decoding file data: ' + url);
                return;
            }
            cb(buffer);
        },
        function(error) {
            alert('decodeAudioData error', error);
        }
    );
  }
  var _requestFile = function(cb){
    var _xhr = new XMLHttpRequest();
    _xhr.open("GET", url, true);
    _xhr.responseType = "arraybuffer";
    _xhr.onload = function(){
        cb(_xhr.response);
    };
    _xhr.send();
  }
  return new Promise(function(resolve, reject){
    _requestFile(function(response){
      _decodeAudioData(response, function(buffer){
          resolve(buffer);
      });
    });
  });
};
