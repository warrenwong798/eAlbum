// function highlight(id){
//   $("#")
// }

var iAlbum = angular.module('iAlbum', []);
iAlbum.controller('iAlbumController', function($scope, $http){

//use to highlight selected album
  $scope.highlightedId = '';
  $scope.highlight = function(id){

    if (id === $scope.highlightedId){
      return;
    }

    if (id !== ''){
      $("#"+id).css("background-color", "#747474");
    }

    if ($scope.highlightedId !== ''){
      $("#"+$scope.highlightedId).css("background-color", "transparent");
    }

    $scope.highlightedId = id;
    // console.log($scope.highlightedId);
  };

//initialize the albums
  $scope.loggedIn = false;
  $scope.username = '';
  $scope.friendList = '';
  $scope.init = function(){
    $http.get("/init").then(function(response){
      if (response.data == ''){
        $scope.loggedIn = false;
        // alert("");
      }
      else {
        // alert(response.data);
        $scope.loggedIn = true;
        $scope.username = response.data.thisUser;
        $scope.friendList = response.data.friendList;
      }
    }, function(response){
      alert("Error getting albums.");
    });
  };

// login function
  $scope.loginFail = false;
  $scope.inputName = '';
  $scope.inputPassword = '';
  // $scope.loginInfo = { username: '', password: '' };
  $scope.login = function(){
    if (($scope.inputName) && ($scope.inputPassword)){
      // $scope.loginInfo = { 'username': $scope.inputName, 'password': $scope.inputPassword };
      var body = "username=" + $scope.inputName + "&password=" + $scope.inputPassword;
      $http.post("/login", body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).then(function(response){
        if (response.data == "Login failure"){
          $scope.loginFail = true;
        }
        else{
          // alert(response.data);
          $scope.loginFail = false;
          $scope.loggedIn = true;
          $scope.friendList = response.data.friendList;
          $scope.username = $scope.inputName;
          $scope.inputName = '';
          $scope.inputPassword = '';
        }
      }, function(response){
        alert(response.data.msg);
      });
    }
    else{
      alert("You must enter username and password.")
    }
  };

  //logout function
  $scope.logout = function(){
    $http.get("/logout").then(function(response){

      if (response.data == ''){
        // alert(response.data);
        $scope.loggedIn = false;
        $scope.back();
        $scope.highlight('');
        $scope.photoList = '';
        $scope.myAlbum = false;
      }

    }, function(response){
      alert(response.data.msg);
    });
  };

// display specific album when selected
  $scope.myAlbum = false;
  $scope.photoList = '';
  $scope.displayAlbum = function(user){
    $scope.photoList = '';
    if (user == 0){
      $scope.myAlbum = true;
    }
    else{
      $scope.myAlbum = false;
    }
    $http.get("/getalbum/" + user).then(function(response){
      // alert(JSON.stringify(response.data.photos));
      $scope.photoList = response.data.photos;
    }, function(response){
      alert(response.data.msg);
    });
  };

  //enlarge photo and back to album
  $scope.enlarge = false;
  $scope.enlargeIndex = '';
  $scope.enlargePhoto = { _id: '', url: '', likedby: '' };

// passing some temp var for displaying the specific photo
  $scope.enlargeThis = function (photo){
    $scope.enlarge = true;
    $scope.enlargePhoto = { _id: photo._id, url: photo.url, likedby: photo.likedby };
    $scope.enlargeIndex = $scope.photoList.indexOf(photo);
  }

// clear all temp memory for enlarging purpose
  $scope.back = function(){
    $scope.enlarge = false;
    $scope.enlargePhoto = { _id: '', url: '', likedby: '' };
    $scope.enlargeIndex = '';
  }

  //upload photo
  // $scope.uploadFile = '';
  $scope.newPhoto = {_id: '', url: '', likedby: ''};
  $scope.upload = function (){
    var x = document.getElementById("selectFile");

    if ('files' in x){
      // console.log("a");
      if (x.files.length != 0){
        // console.log("b");
        // console.log(x.files[0]);
        $http.post("/uploadphoto", x.files[0], { withCredentials : true, headers : { 'Content-Type' : undefined }, transformRequest : angular.identity }).then(function(response){
          // alert(JSON.stringify(response));
          $scope.newPhoto = {_id: response.data._id, url: response.data.url, likedby: ''};
          $scope.photoList.push($scope.newPhoto);
        }, function(response){
          alert(response.data.msg);
        });
      }
      // else{
      //
      // }
    }
  };

  //delete a photo
  $scope.delete = function(photo, id){
    var confirmDelete = confirm("Are you sure you want to delete this photo?");
    var index = $scope.photoList.indexOf(photo);
    // alert(index);
    if (confirmDelete){
      $http.delete('/deletephoto/' + photo._id).then(function(response){
        if (response.data == ''){
          var index = $scope.photoList.indexOf(photo);
          // id === 0 indicate the delete is called by the delete button in album
          // id !== 0 indicate the delete is called when the photo is enlargeIndex
          // as the referencing of the photo will change in this app, the position of
          // the enlarged photo in the array photoList will be recored in enlargeIndex
          if (id === 0){
            $scope.photoList.splice(index, 1);
          }
          else{
            $scope.photoList.splice($scope.enlargeIndex, 1);
          }
          $scope.back();
        }
      }, function(response){
        alert(response.data.msg);
      });
    }
  };

// handle the like action
  $scope.like = function(photo){
    $http.put('/updatelike/' + photo._id).then(function(response){
      // console.log(JSON.stringify(response));
      var newLikedby = response.data;
      photo.likedby = newLikedby;
    }, function(response){
      alert(response.data.msg);
    });
  };

// reload the selected album when exit the enlarge function
  $scope.reload = function(){
    $scope.displayAlbum($scope.highlightedId);  // the selected album id is stored when handling highlight feature
  };

})
