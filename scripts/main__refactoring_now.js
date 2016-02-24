;(function(){



//////////////////////////////////////////////////
//
// package tree
//
//////////////////////////////////////////////////

var app = {

  // Const
  // Settings
  // Controller
  // Util
  // Service

  state: {
    // State
    // Controller
  },

  enemy: {
    // Enemy
    // Controller
  },

  ship: {
    // Ship
    // Controller
  },

  view: {
    // Controller
    // Service

    Stage: {},
    Ship: {},
    Enemy: {}
  }
};


//////////////////////////////////////////////////
//
// app package
//
//////////////////////////////////////////////////

//
// 固定値
//

app.Const = {

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
  },

  settings: {

    view: {
      scrollSpeed: 1500,
      baseLineColor: '#aaa',
      skyColor: '#003366',
      groundColor: 'green',
      fontColor: '#fff'
    }

  }

};



//
// アプリ全体の管理
//

app.Controller = function(){

  app.Util.loop(function(){

    // 全体の状況を管理する
    app.state.Controller();

    // 敵の状況を管理する
    app.enemy.Controller();

    // 自機の状況を管理する
    app.ship.Controller();

    // 描画の状況を管理する
    app.view.Controller();

  });


};


//
// アプリ全体のサービス
//

app.Service = {

};


//
// アプリ全体の汎用処理
//

app.Util = {

  //
  // 指定時間間隔でループさせる
  //

  loop: function(cb, delayMs){
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
  },

  delay: function(cb, delayMs){
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
  },



  //
  // class を定義する
  //
  // params: {
  //   data: {...},
  //   queue: {...},
  //   method: {...},
  //   singleton: true or false
  // }
  declareClass: function( params ){

    return function(){
      var args = arguments;
      if( args.callee.__instance ) return args.callee.__instance;

      var def = _.assign(
        {},
        params.data ? app.Util.makeDataAccessor( params.data ) : null,
        params.queue ? app.Util.makeDataAccessor( params.queue ) : null,
        params.queue ? app.Util.getQueueAccessor( params.queue ) : null,
        params.method
      );
      if( params.singleton){
        args.callee.__instance = def;
      }

      if( def.init ){
        def.init.apply(def, args);
      }

      return def;
    };

  },

  //
  // アクセッサを生成し返す
  //

  makeDataAccessor: function (dataSet){
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
  },


  //
  // キューのアクセッサを生成し返す
  //

  getQueueAccessor: function(queueSet){

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

};





//////////////////////////////////////////////////
//
// state package
//
//////////////////////////////////////////////////

//
// stateの管理
//

app.state.Controller = function(){

  var state = app.state.State();

  // ロックオン状態で的にぶつかってた場合はロックオンを解除する
  var receivedEnemy = state.popReceivedEnemy();
  if(receivedEnemy){
    if(state.isFocusEnemy(receivedEnemy)){
      state.setFocusEnemy(null);
    }
    state.popEnemyByEnemy(receivedEnemy);
  }

  // タイプキーがヒットした時の処理
  var typeKey = state.popTypeKey();
  if( typeKey ){
    state.hitEnemy(typeKey);
  }

};

app.state.State = app.Util.declareClass({

  singleton: true,

  data: {
    ship: null,
    focusEnemy: null,
    enemySeq: {step:0, count:0},
  },

  queue: {
    enemy: [],
    drawing: [],
    receivedEnemy: [],
    typeKey: [],
  },

  method: {

    popEnemyByEnemy: function(enemy){
      var self = this;
      var focusEnemy = self.getFocusEnemy();
      var _enemy;
      var queue = self.getEnemy();
      queue.forEach(function(item, index){
        if(item === enemy){
          _enemy = queue.splice(index, 1);
        }
      });
      return _enemy;
    },

    autoFocusEnemy: function(typeKey){
      var self = this;
      var focusEnemy = self.getFocusEnemy();
      var queue = self.getEnemy();
      queue.forEach(function(item){
        if(!focusEnemy && item.getText().split('')[0] === typeKey){
          self.setFocusEnemy(item);
        }
      });
    },

    hitEnemy: function(typeKey){
      var self = this;
      var c = app.Const;
      self.autoFocusEnemy(typeKey);
      var focusEnemy = self.getFocusEnemy();
      if(focusEnemy){
        self.pushDrawing(focusEnemy);
        var wordArr = focusEnemy.getText().split('');
        if(wordArr[0] === typeKey){
          wordArr.shift();
          focusEnemy.setState( c.enemy.state.hit );
          focusEnemy.setHitKey( typeKey );
          if(wordArr.length){
            focusEnemy.setText( wordArr.join('') );
          }
          else{
            focusEnemy.setState( c.enemy.state.die );
            focusEnemy.setText( '' );
            self.popEnemyByEnemy( focusEnemy );
            self.setFocusEnemy( null );
          }

        }
        else{
  //        sound.playMiss();
        }
      }
    }

  }

});






//////////////////////////////////////////////////
//
// enemy package
//
//////////////////////////////////////////////////

//
// enemyの管理
//

app.enemy.Controller = function(){
  if( arguments.callee.__isInit ) return;
  arguments.callee.__isInit = true;

  app.Util.loop( function(){

    createEnemy();

  }, 2000); // あとで settings へ

  function createEnemy(){
    var enemy = app.enemy.Enemy();
    var state = app.state.State();
    state.pushDrawing(enemy);
    state.pushEnemy(enemy);
  }

};

app.enemy.Enemy = app.Util.declareClass({

  singleton: false,

  data: {
    type: null,
    text: null,
    orgText: null,
    state: null,
    el: null
  },

  method: {
    init: function(){
      var self = this;
      var c = app.Const;

      app.enemy.Enemy._counter = app.enemy.Enemy._counter || 0;

      var wordList = [
          "ALFA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL", "INDIA",
          "JULIETT", "KILO", "LIMA", "MIKE", "NOVEMBER", "OSCAR", "PAPA", "QUEBEC", "ROMEO",
          "SIERRA", "TANGO", "UNIFORM", "VICTOR", "WHISKEY", "XRAY", "YANKEE", "ZULU"
      ];
      app.enemy.Enemy._counter ++;
      if(app.enemy.Enemy._counter >= wordList.length){
        app.enemy.Enemy._counter = 0;
      }

      var text = wordList[app.enemy.Enemy._counter];

      self.setType( c.el.enemy );
      self.setText( text );
      self.setOrgText( c.el.enemy );
      self.setState( c.enemy.state.draw );
    }
  }

});






//////////////////////////////////////////////////
//
// ship package
//
//////////////////////////////////////////////////

//
// shipの管理
//

app.ship.Controller = function(){
  if( arguments.callee.__isInit ) return;
  arguments.callee.__isInit = true;

  document.onkeydown = function (event){
    var state = app.state.State();
    state.pushTypeKey(String.fromCharCode(event.keyCode));
  };
};

app.ship.Ship = app.Util.declareClass({

  singleton: false,

  data: {
    type: app.Const.el.ship,
    life: 10,
    isDraw: false,
    el: null
  },

  method: {
    init: function(){
    }
  }

});




//////////////////////////////////////////////////
//
// view package
//
//////////////////////////////////////////////////

//
// ビューの管理
//

app.view.Controller = function(){

  if( !arguments.callee.__isInit ) {
    arguments.callee.__isInit = true;

    app.view.Stage.draw();
  }
  app.view.Enemy.draw();

};

//
// ビューのサービス
//

app.view.Service = {

  // 画面の svg 用を Snap 形式で返す
  getSvg: function (){
    return Snap('svg.stage');
  },

  getHtml: function (){
    return $('html');
  },

  getWin: function (){
    return $(window);
  },

  getViewSize: function (){
    var self = this;
    return {
      width: self.getWin().width(),
      height: self.getWin().height(),
    }

  },

  // params: {
  //  x: ...
  //  y: ...
  //  rate: ...

  rateToPosition: function( params ){

  },

  getStartLineY: function(){
    var self = this;
    return self.getViewSize().height / 1.5;
  },

  // state.startLineY = state.viewSize.height / 1.5;



};


//
// ステージの描画
//

app.view.Stage = {

  draw: function(){

    var settings = app.Const.settings;
    var state = app.state.State();
    var $svg = app.view.Service.getSvg();
    var $html = app.view.Service.getHtml();
    var viewSize = app.view.Service.getViewSize();
    var startLineY = app.view.Service.getStartLineY();

    $html.css({
//      'background-color': settings.view.skyColor,
      color: settings.view.fontColor,
    });

    makeLine().attr({
      height: '100%',
      fill: settings.view.groundColor
    });


    _.times(4, function(i){
      app.Util.delay(function(){
        scrollLine(makeLine());
      }, i * settings.view.scrollSpeed / 4);
    });


    function makeLine(){
      var rect = $svg.rect().attr({
        fill: settings.view.baseLineColor,
        x: 0,
        y: startLineY,
        width: '100%',
        height: 1,
        strokeWidth: 0
      });
      return rect;
    }

    function scrollLine(rect, i){
      rect.
        attr({
          y: startLineY
        }).
        animate({
          y: viewSize.height
        },
        settings.view.scrollSpeed,
        function(t){
          return t * t
        },
        function(){
          scrollLine(rect, i)
        }
      );
    }

  }

};


app.view.Enemy = {

  draw: function(){

  var item = state.popDrawing();
  if( item )



    var settings = app.Const.settings;
    var state = app.state.State();
    var $svg = app.view.Service.getSvg();
    var $html = app.view.Service.getHtml();
    var viewSize = app.view.Service.getViewSize();
    var startLineY = app.view.Service.getStartLineY();







  }

}


// app.view.View = app.Util.declareClass({

//   singleton: false,

//   data: {
//   },

//   method: {
//     init: function(){
//     }
//   }

// });






app.Controller();



})();








