

var sound = Sound();
sound.playMusic();

//------------------------
//
// 名前空間の定義
//
//------------------------

function app(){
  app.ctrl.main();
}
_.assign(app, {
  state: null,
  service: {},
  model: {},
  ctrl: {},
  view: {},
  util: {},
});





//------------------------
//
// コントローラーの定義
//
//------------------------

app.ctrl.main = function(){
  var s = app.model.state();
  app.state = s;
  app.util.loop(function(){
    app.ctrl.state(s);
    app.ctrl.ship(s);
    app.ctrl.enemy(s);
    app.ctrl.view(s);
  });
}




app.ctrl.enemy = function(s) {
  var ship = s.getShip();
  if( !app.ctrl.enemy.isInit ){
    app.ctrl.enemy.isInit = true;

    app.util.loop(function(){
      if(ship.life){
        createEnemy();
      }
    }, 2000);
  }

  function createEnemy(){
    var enemy = app.model.enemy(s);
    s.pushDrawing(enemy);
    s.pushEnemy(enemy);
  }
}

app.ctrl.ship = function(s){
  if( !app.ctrl.ship.isInit ){
    app.ctrl.ship.isInit = true;

    s.setShip(app.model.ship(s));

    document.onkeydown = function (event){
      if(ship.life){
        s.pushTypeKey(String.fromCharCode(event.keyCode));
      }
    };
  }

  var ship = s.getShip();

  if(ship.life){
    var typeKey = s.popTypeKey();
    if( typeKey ){
      s.hitEnemy(typeKey);
    }
  }
}

app.ctrl.state = function(s){
  var receivedEnemy = s.popReceivedEnemy();
  if(receivedEnemy){
    if(s.isFocusEnemy(receivedEnemy)){
      s.setFocusEnemy(null);
    }
    s.popEnemyByEnemy(receivedEnemy);
  }
}


app.ctrl.view = function(s){

  var c = app.model.constant;


  app.view.stage.draw();
//  app.view.ship.draw();

  var item = s.popDrawing();
  if(item){

    switch( item.type ) {


      case c.el.enemy:
        switch( item.state ) {

          case c.enemy.state.draw:
            app.view.enemy.draw(item, s);
            break;

          case c.enemy.state.hit:
            app.view.enemy.hit(item, s);
            break;

          case c.enemy.state.die:
            app.view.enemy.die(item, s);
            break;

          case c.enemy.state.receive:
            app.view.enemy.receive(item, s);
            break;

          default:
            break;

        }
        break;
    }
  }

}
app.ctrl.view.enemyCount = 0;
app.ctrl.view.enemyColors = ['#fff','#eee','#ddd','#ccc','#bbb','#aaa','#999'];












//------------------------
//
// モデルの定義
//
//------------------------

app.model.constant = {
  el: {
    ship: 'ship',
    enemy: 'enemy'
  },
  enemy: {
    state: {
      draw: '1',
      hit: '2',
      die: '3',
      receive: '4'
    }
  }


};

app.model.state = function(){
  var c = app.model.constant;

  var my = {
    focusEnemy: null,
    queue: {
      enemy: [],
      drawing: [],
      receivedEnemy: [],
      typeKey: [],
    },
    data: {
      ship: null,
      focusEnemy: null,
      enemySeq: {step:0, count:0}
    },
    $win: $(window)
  };

  var self = _.assign(
    {},
    app.util.getQueueAccessor(my.queue),
    app.util.getDataAccessor(my.data),
    {
      getViewSize: function(){
        return {
          width: my.$win.width(),
          height: my.$win.height()
        };
      },

      autoFocusEnemy: function(typeKey){
        var focusEnemy = self.getFocusEnemy();


        my.queue.enemy.forEach(function(item){
          if(!focusEnemy && item.text.split('')[0] === typeKey){
            self.setFocusEnemy(item);
          }
        });
      },

      hitEnemy: function(typeKey){
        self.autoFocusEnemy(typeKey);
        var focusEnemy = self.getFocusEnemy();
        if(focusEnemy){
          self.pushDrawing(focusEnemy);
          var wordArr = focusEnemy.text.split('');
          if(wordArr[0] === typeKey){
            wordArr.shift();

            focusEnemy.state = c.enemy.state.hit;
//            focusEnemy.isHit = true;

            focusEnemy.hitKey = typeKey;

            if(wordArr.length){
              focusEnemy.text = wordArr.join('');
            }
            else{
              focusEnemy.state = c.enemy.state.die;
//              focusEnemy.isDie = true;
              focusEnemy.text = '';
              self.popEnemyByEnemy(focusEnemy);
              self.setFocusEnemy(null);
            }
          }
          else{
            sound.playMiss();
          }
        }
      },

      popEnemyByEnemy: function(enemy){
        var focusEnemy = self.getFocusEnemy();
        var _enemy;
        my.queue.enemy.forEach(function(item, index){
          if(item === enemy){
            _enemy = my.queue.enemy.splice(index, 1);
          }
        });
        return _enemy;
      },
    }
  );

  return self;
}




app.model.ship = function(s){

  var c = app.model.constant;

  var ship = {
    type: c.el.ship,
    life: 10,
    isDraw: false,
    el: null
  };
  return ship;
};


app.model.enemy = function(s) {
  var c = app.model.constant;

  app.model.enemy._counter = app.model.enemy._counter || 0;

  var wordList = [
      "ALFA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL", "INDIA",
      "JULIETT", "KILO", "LIMA", "MIKE", "NOVEMBER", "OSCAR", "PAPA", "QUEBEC", "ROMEO",
      "SIERRA", "TANGO", "UNIFORM", "VICTOR", "WHISKEY", "XRAY", "YANKEE", "ZULU"
  ];
  app.model.enemy._counter ++;
  if(app.model.enemy._counter >= wordList.length){
    app.model.enemy._counter = 0;
  }

  var text = wordList[app.model.enemy._counter];
  return {
    type: c.el.enemy,
    text: text,
    orgText: text,
    state: c.enemy.state.draw,
    isDraw: false,
    isHit: false,
    isDie: false,
    isReceive: false,
    el: null
  };
}




//------------------------
//
// サービスの定義
//
//------------------------


app.service.getState = function(){
  var state = {};
  state.viewSize = app.util.getViewSize();
  state.startLineY = state.viewSize.height / 1.5;
  state.endLineY = state.viewSize.height;
  state.scrollSpeed = 1500;


  state.enemy = state.enemy || {
    step:0,
    count:0
  }


  return state;
}

app.service.getSettings = function(){

  var settings = {
    baseLineColor: '#aaa',
    skyColor: '#003366',
    groundColor: '#005533',
    fontColor: '#fff'
  };
  return settings;
}

app.service.getSvg = function(){
  return Snap('svg.stage');
}





//------------------------
//
// ビューの定義
//
//------------------------

app.view.stage = {};

app.view.stage.draw = function(){
  var ns = arguments.callee;
  if(!ns.isInit){
    ns.isInit = true;
    var settings = app.service.getSettings();
    var state = app.service.getState();
    var svg = app.service.getSvg();

    $('html').css({
      'background-color': settings.skyColor,
      color: settings.fontColor
    });

    makeRect().attr({
      height: '100%',
      fill: settings.groundColor
    });

    _.times(4, function(i){
      app.util.delay(function(){
        scrollLine(makeRect());
      }, i * state.scrollSpeed / 4);
    });

    function scrollLine(rect, i){
      rect.
        attr({
          y: state.startLineY
        }).
        animate({
          y: state.viewSize.height
        },
        state.scrollSpeed,
        function(t){
          return t * t
        },
        function(){
          scrollLine(rect, i)
        }
      );
    }

    function makeRect(){
      var rect = svg.rect().attr({
        fill: settings.baseLineColor,
        x: 0,
        y: state.startLineY,
        width: '100%',
        height: 1,
        strokeWidth:0
      });
      return rect;
    }

  }
}


app.view.ship = {
  draw: function(){

    var viewSize = app.util.getViewSize();
    var state = app.service.getState();
    var svg = app.service.getSvg();
    svg.circle(50,50,50).attr({
      cx: viewSize.width/2-50,
      cy: state.startLineY-50*2,
      fill: 'transparent',
      stroke: '#aaa'
    });

  }
}


app.view.enemy = {
  draw: function(item){
    var settings = app.service.getSettings();
    var state = app.service.getState();
    var svg = app.service.getSvg();


    var c = app.model.constant;
    var s = app.state;
    item.state = null;

    var posDiv = 10;
    var baseTop = 200;
    var startFontSize = 10;
    var endFontSize = 400;
    var viewSize = s.getViewSize();
    var baseLen = viewSize.width / posDiv;
    var basePos = Math.floor( Math.random() * posDiv ) ;
    var pos = Math.floor(baseLen * basePos + baseLen / 2);





var synthes = new SpeechSynthesisUtterance();
synthes.voiceURI = 'native';
synthes.text = item.text;
synthes.lang = 'en-US';


app.vocies || setTimeout(function(){
  app.vocies = window.speechSynthesis.getVoices();
},100);
//!app.vocies || (synthes.voice = app.vocies[Math.floor( Math.random() * app.vocies.length )]);


//synthes.voice = window.speechSynthesis.getVoices()[0];

speechSynthesis.speak(synthes);


    item.svg = svg.text().attr({
      text: item.text,
      fill: app.ctrl.view.enemyColors[app.ctrl.view.enemyCount],
      x: pos,
      y: baseTop,
      fontSize: startFontSize
    });

/*
    item.svg.animate(
      {
        fontSize: endFontSize,
        x:0,
        y:$(window).height(),
      },
      5000,
      function(t){
        return t * t
      },
      function(){
        item.state = c.enemy.state.receive;
        s.pushDrawing(item);
      }
    )
    ;
*/

var seq = app.data.getEnemySeq();



// var seq =
//   [
//     [
//       {
//         x:0
//       },
//       null,
//       null,
//     ],
//   ];




animate(
  item.svg,
  seq,
  function(){
    item.state = c.enemy.state.receive;
    s.pushDrawing(item);
  }
);


/*
animate(item.svg, [
  [
//    {y:100,fontSize:startFontSize},
    null,
//    1000,
    null,
  ],
  [
    {y:150},
  ],
  [
    {x:0},
    3000,
    null,
    function(){
      item.state = c.enemy.state.receive;
      s.pushDrawing(item);
    }
  ],

]);
*/

function animate(item, params, cb){
  var index = 0;

  run(index);

  function run(index){

    var param = params[index];

    if(param === null){
      param = [];
    }

    if(param.length < 3){
      _.times(3-param.length, function(){
        param.push(null);
      })
    }

    if(param[0] === null){
      param[0] = {};
    }

    if(!param[0].fontSize){
      param[0].fontSize = endFontSize / (params.length - index);
    }
    if(param[0].y === undefined){
        param[0].y = $(window).height() / (params.length - index);
    }

    if(param[0].x === undefined){
      // var x = index ? params[index-1][0].x : $(window).width() / 2;
      // if(x) param[0].x = x;
    }

    if(param[1] === null){
      param[1] = (index ? params[index-1][1] : 5000) / (index + 1);
    }

    if(param[2] === null){
      param[2] = function(t){return t * t};
    }

    if(!index){
      params[params.length-1].push(cb)
    }

    if(index <= params.length-1){
      index ++;
      param.push(function(){
        run(index);
      });
    }
    item.animate.apply(item, param);
  }
};



  // svg.circle().attr(
  //   {cx:500,cy:300,r:10, stroke:'#fff' ,strokeWidth:1});


    app.ctrl.view.enemyCount ++;
    if(app.ctrl.view.enemyColors.length <= app.ctrl.view.enemyCount){
      app.ctrl.view.enemyCount = 0;
    }
  },

  hit: function(item){

sound.playHit();



var spc = '';
console.log(item.orgText.split('').length - item.text.split('').length)
console.log(item.orgText,item.text)
_.times(
  item.orgText.split('').length - item.text.split('').length,
  function(){
    spc = spc + '_'
  }
);



    item.state = null;
    item.svg.attr({
      fill:'red',
      text: spc + item.text
    });

//item.svg.stop();





var startFontSize = 10
var endFontSize = 400;

var x = item.svg.attr('x');
var y = item.svg.attr('y');
var fontSize = item.svg.attr('fontSize');
var svg = app.service.getSvg();

    var text = svg.text().attr({
      text: item.hitKey,
      fill: 'red',
      x: x,
      y: y,
        fontSize: fontSize,
    })
    .animate(
      {
        fontSize: startFontSize,
        x:0,
        y:0,
      },
      100,
      function(t){
        return t * t
      },
      function(){

// text.animate({
//   x:0,
//   y:0
// },100);

        // item.state = c.enemy.state.receive;
        // s.pushDrawing(item);
      }
    );

//console.log(svg)



// Snap($('<svg width="100" height="100"/>')[0]).path().attr({
//   d: app.data.bom,
//   fill: 'red',
//   width:100,
//   height:100,
//   x:600
// }).appendTo(svg);



// var paper = Snap($('<svg width="100" height="100"/>')[0]).attr({style:"width:50mm;height:50mm;", viewBox:[0,0,50,50]});
// paper.path("M5,25L25,5L45,45z").attr(
//   {fill:"red", stroke:"orange" ,strokeWidth:5});
// paper.appendTo(svg);

  // svg.path("M5,25L25,5L45,45z").attr(
  //   {fill:"red", stroke:"orange" ,strokeWidth:5});






  },

  die: function(item){
    item.svg.remove();
  },

  receive: function(item){
    var s = app.state;
    s.pushReceivedEnemy(item);
    item.svg.remove();
  }


};




//------------------------
//
// ユーティリティの定義
//
//------------------------

app.util.bindResizeOnView = function(cb){
  $(window).resize(cb);
};

app.util.getViewSize = function(){
  return {
    width: $(window).width(),
    height: $(window).height()
  };
};


app.util.delay = function(cb, delayMs){
  delayMs = delayMs || 0;
  return {
    init: function(){
      var _self = this;
      var baseTime;
      var raf = window.requestAnimationFrame;
      raf(function(now){
        baseTime = baseTime || now;
        if(now - baseTime >= delayMs){
          cb(now);
        }
        else{
          raf(arguments.callee);
        }
      });
      return this;
    }
  }.init();
}


app.util.loop = function(cb, delayMs){
  delayMs = delayMs || 0;
  return {
    sts: {
      counter: 0,
      isStop: false
    },
    stop: function(){
      this.sts.isStop = true;
    },
    init: function(){
      var _self = this;
      var baseTime;
      var raf = window.requestAnimationFrame;
      raf(function(now){
        if(_self.sts.isStop) return;
        baseTime = baseTime || now;
        if(now - baseTime >= delayMs){
          _self.sts.counter ++;
          baseTime = null;
          cb(now);
        }
        raf(arguments.callee);
      });
      return this;
    }
  }.init();
}


app.util.getDataAccessor = function (dataSet){
  var obj = {};
  Object.keys(dataSet).forEach(function(key){
    setAccessor(obj, key);
  });
  return obj;

  function setAccessor(target, name){
    var arr = name.split('');
    arr[0] = arr[0].toUpperCase();
    var baseMethodName = arr.join('');

    target['set' + baseMethodName] = function(item){
      dataSet[name] = item;
    };

    target['get' + baseMethodName] = function(){
      return dataSet[name];
    };

    target['is' + baseMethodName] = function(item){
      return dataSet[name] === item;
    };

  }

}


app.util.getQueueAccessor = function(queueSet){

  var obj = {};
  Object.keys(queueSet).forEach(function(key){
    setAccessor(obj, key);
  });
  return obj;

  function pushQueue(name, item){
    var queue = queueSet[name];
    queue.push(item);
  };

  function popQueue(name){
    var queue = queueSet[name];
    if( queue.length ){
      return queue.splice(0,1)[0];
    }
    return null;
  };

  function setAccessor(target, name){
    var arr = name.split('');
    arr[0] = arr[0].toUpperCase();
    var baseMethodName = arr.join('');

    target['push' + baseMethodName] = function(item){
      pushQueue(name, item);
    };

    target['pop' + baseMethodName] = function(){
      return popQueue(name);
    };
  }

}


app.data = {};
app.data.bom = 'M393.795,279.376l107.978-81.724l-139.612-22.433l46.162-84.647l-94.348,36.459L297.914,0l-68.719,104.192L174.678,51.63l-1.946,70.092L50.068,65.25l50.441,133.468L18.019,221.9l73.985,50.618L10.227,360.13l109.036,9.738L92.004,478.904l107.811-55.293L241.927,512l36.988-89.56l149.923,62.309l-59.615-142.923l105.152-2.915L393.795,279.376z M331.486,264.725l36.996,36.996l-54.518,5.846l25.313,77.876l-75.93-42.833l-17.521,54.517l-19.476-48.671l-68.147,38.934l21.412-56.455l-66.192-5.846l54.518-52.571L129,243.312l50.617-9.738l-36.988-72.038l66.192,40.888l9.738-35.042l19.476,19.467l27.25-38.942l9.738,58.409l44.788-19.467L308.127,221.9l75.93,5.838L331.486,264.725z';

app.data.enemyPattern = [
  ['a', 5],
  ['b', 5],
  ['c', 5],
  ['d', 5]
];

app.data.enemyPattern

app.data.getEnemySeq = function(){


  var state = app.state.getEnemySeq();


// app.model.state = function(){
//   var c = app.model.constant;

//   var my = {
//     focusEnemy: null,
//     queue: {
//       enemy: [],
//       drawing: [],
//       receivedEnemy: [],
//       typeKey: [],
//     },
//     data: {
//       ship: null,
//       focusEnemy: null,
//       enemySeq: {step:0, count:0}






  var pat = app.data.enemyPattern[state.step]
  if(state.count === pat[1]){
    state.count = 0;
    state.step ++;
    if(state.step === app.data.enemyPattern.length){
      state.step = 0;
    }
    pat = app.data.enemyPattern[state.step]
  }
  state.count ++;


  var move = {
    a:
    [
      []
    ],

    b:
    [
      [{y:0,fontSize:10},500],
      [{y:300,fontSize:30},1000],
      [{y:350,fontSize:40},100],
      [{x:0},5000]
    ],

    c:
    [
      [{y:100,x:0},100],
      [{y:100,x:500},100],
      [{y:100,x:500},100],
      [{y:100,x:500},100],
      [{y:100,x:0},100],
      [{y:100,x:500},100],
      [{y:100,x:0},100],
      [{y:100,x:500,fontSize:10},100],
      [{y:400,x:400,fontSize:10},100],
      [{x:0},5000]
    ],

    d:
    [
      [{y:400,      fontSize:1},500],
      [{y:400,x:000,fontSize:1},500],
      [{y:050,x:000,fontSize:1},500],
      [{y:050,x:900,fontSize:1},10000],
      [{y:500,x:900,fontSize:1},1000],
      [{x:0},10000]
    ],
  }

console.log(pat[0],state)

  return move[pat[0]];






}


app();




