var express = require('express');
var router = express.Router();
var cookieParser = require('cookie-parser');
var fs = require('fs');
var bodyParser = require('body-parser');
//
// router.use(cookieParser());

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true });


router.get('/init', function(req, res){

    if (req.cookies.userID) {
      // console.log(req.cookies.userID);
      // console.log("yes");
      var friendInfo = {_id: "", username: ""};
      var db = req.db;
  		var collection = db.get('userList');
      var returnmsg = { thisUser: '' , friendList: [] };
      var thisUsername = "";
      var friendNames = "";
      var friend = {_id: "", username: ""};
      // var friendList = "";
      collection.find({},{},function(e, result){
        if (e != null){
          res.send({msg: e});
        }
        for (var i = 0; i < result.length; i++){
          if (result[i]._id == req.cookies.userID){
            thisUsername = result[i].username;
            friendNames = result[i].friends;
          }
        }
        returnmsg = { thisUser: thisUsername, friendList: [] };
        for (var i = 0; i < result.length; i++){
          for (var j = 0; j < friendNames.length; j++){
            if (result[i].username == friendNames[j]){
              var friend = {_id: result[i]._id, username: result[i].username};
              returnmsg.friendList.push(friend);
            }
          }

        }
        // console.log(returnmsg);
        res.json(returnmsg);
      });

    } else {
      // console.log("no");
      res.send('');
    }
});
module.exports = router;

router.post('/login', urlencodedParser, function(req, res) {
    // if (!req.body){
    //   console.log("no");
    // }
    // console.log(req.body);
    // console.log(req.body.password);
    var db = req.db;
    var collection = db.get('userList');
    var returnmsg = { friendList: [] };
    var friend = { _id: "", username: ""};
    var friendList = "";
    collection.find({},{},function (e, result){
      if (e != null){
        return res.send({msg: e});
      }
      else{
        var success = false;

        for (var i = 0; i < result.length; i++){
          // console.log(i);
          if ((req.body.username == result[i].username) && (req.body.password == result[i].password)) {
            success =  true;
            var milliseconds = 3600 * 1000;
            res.cookie('userID', result[i]._id, { maxAge: milliseconds });
            friendList = result[i].friends;
            // console.log(friendList);
            for (var j = 0; j < result.length; j++){
              for (var k = 0; k < friendList.length; k++){
                // console.log(result[j].username + " & " + friendList[k]);
                if (result[j].username == friendList[k]){
                  // console.log("ok");
                  var friend = { _id: result[j]._id, username: result[j].username };
                  returnmsg.friendList.push(friend);

                }
              }
            }
            // console.log(returnmsg);
            res.json(returnmsg);
          }
        }

        if (!success){
          res.send("Login failure");
        }

      }
    });
});

router.get('/logout', function(req, res){
  res.clearCookie('userID');
  res.send('');
});

router.get('/getalbum/:userid', function(req, res){
  var db = req.db;
  var collection = db.get('photoList');
  var returnmsg = { photos: [] };
  if (req.params.userid == 0){
    collection.find({},{},function (e, result){
      if (e != null){
        res.send({msg: e});
      }
      else{
        for (var i = 0; i < result.length; i++){
          if (result[i].userid == req.cookies.userID){
            var photo = { _id: result[i]._id, url: result[i].url, likedby: result[i].likedby };
            // console.log(result[i]);
            returnmsg.photos.push(photo);
          }
        }
        res.json(returnmsg);
      }
    });
  }
  else{
    collection.find({}, {}, function(e, result){
      if (e != null){
        res.send({msg: e});
      }
      for (var i = 0; i < result.length; i++){
        if (result[i].userid == req.params.userid){
          var photo = { _id: result[i]._id, url: result[i].url, likedby: result[i].likedby };
          returnmsg.photos.push(photo);
        }
      }
      res.json(returnmsg);
    });
  }
});

router.post('/uploadphoto', function(req, res){
  var db = req.db;
  var collection = db.get('photoList');
  var random = Math.floor(Math.random() * 10000);
  var path = "./public/uploads/" + random + ".jpg";
  var url = 'uploads/' + random + '.jpg';
  req.pipe(fs.createWriteStream(path));
  collection.insert({'url': url, 'userid':req.cookies.userID, 'likedby':[]}, function(err, result){
    if (err != null){
      res.send({msg: err});
    }
    else{
      collection.findOne({'url': url},{},function (err, result){
        if (err != null){
          res.send({msg: err});
        }
        else{
          var returnmsg = { _id: result._id, url: result.url };
          res.json(returnmsg);
        }
      });
    }
  });
});

router.delete('/deletephoto/:photoid', function(req, res){
  var db = req.db;
  var collection = db.get('photoList');
  var url = "./public/";
  collection.findOne({_id: req.params.photoid},{}, function(err, result){
    if (err != null){
      res.send({msg: err});
    }
    fs.unlink(url + result.url, (err) => {
      if (err) throw err;
      console.log('successfully deleted ' + url + result.url);
    });
  });
  collection.remove({_id: req.params.photoid}, function(err, result){
    if (err != null){
      res.send({msg: err});
    }
    else{
      res.send('');
    }
  });
});

router.put('/updatelike/:photoid', function(req, res){
  var db = req.db;
  var collection = db.get('userList');
  collection.findOne({_id: req.cookies.userID}, {}, function(err, result){
    if (err != null){
      res.send({msg: err});
    }
    var collection2 = db.get('photoList');
    collection2.findOne({_id: req.params.photoid},{}, function(err, respond){
      if (err != null){
        res.send({msg: err});
      }
      var newLikedby = [];
      // console.log(respond);
      newLikedby = respond.likedby;
      // console.log(newLikedby);
      // console.log(respond.likedby);

      if (newLikedby.length > 0){
        for (var i = 0; i < newLikedby.length; i++){
          if (result.username == newLikedby[i]){
            return res.json(newLikedby);                                        // return if the user has already liked the photo
          }
        }
      }

      newLikedby.push(result.username);
      // console.log(result.username);
      // console.log(newLikedby);
      collection2.update({_id: req.params.photoid},{$set:{likedby: newLikedby}},{upsert: false}, function (err, response){
        if (err != null){
          res.send(writeResult.wirteConcernError.errmsg);
        }
        else{
          res.json(newLikedby);
        }
      });

    });
  });
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
