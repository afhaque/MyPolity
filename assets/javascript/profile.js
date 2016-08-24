var googleGeoURL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
var googleGeoKey = "&key=AIzaSyBV2UtJ0s2yvwvJQl7wDajnuzCnGevAnE0";

var sunlightDataApiKey = "f58d2e11ccbe4471bdb7485c4fee0058"
var openStatesURL = "https://openstates.org/api/v1/";
var openStatesKey = "&apikey=" + sunlightDataApiKey;

var openCongressURL = "https://congress.api.sunlightfoundation.com/"
var openCongressKey = "&apikey=" + sunlightDataApiKey;


firebase.auth().onAuthStateChanged(function(user) {
  if(user){
    console.log(user.uid);
    database.ref('users').child(user.uid).once('value', function(snapshot){
      $('#edit-first-name').val(snapshot.val().firstName);
      $('#edit-last-name').val(snapshot.val().lastName);
      $('#edit-street').val(snapshot.val().street);
      $('#edit-city').val(snapshot.val().city);
      $('#edit-state').val(snapshot.val().state);
      $('#edit-zip').val(snapshot.val().zip);
    });
  }
  $('#edit-profile-submit').on('click', function(){
    var firstName = $('#edit-first-name').val();
    var lastName = $('#edit-last-name').val();
    var Street = $('#edit-street').val().trim();
    var City = $('#edit-city').val().trim();
    var State = $('#edit-state').val();
    var Zip = $('#edit-zip').val().trim();

    var newUser = {
      firstName: firstName,
      lastName: lastName,
      street: Street,
      city: City,
      state: State,
      zip: Zip,
      latitude: -1,
      longitude: -1,
      federalReps: [],
      stateReps: [],
      localReps:[],
    }

    var postAddress = Street.toLowerCase().split(' ').join('+');
    postAddress += "+" + City.toLowerCase() + "+" + State.toLowerCase();
    postAddress += "+" + Zip;
    var queryURL = googleGeoURL + postAddress + googleGeoKey;

      $.ajax({
        url: queryURL,
        method: 'GET',
      }).then(function(geoResponse) {
        newUser.latitude = geoResponse.results[0].geometry.location.lat;
        newUser.longitude = geoResponse.results[0].geometry.location.lng;
        var openCongressQuery = "legislators/locate?latitude=" + newUser.latitude;
        openCongressQuery += "&longitude=" + newUser.longitude
        var queryURL = openCongressURL + openCongressQuery + openCongressKey;
        $.ajax({
          url: queryURL,
          method: 'GET',
        }).then(function(ocResponse) {
          var reps = ocResponse.results;
          for (var i = 0; i < reps.length; i++) {
            var ocRepID = reps[i].bioguide_id;
            newUser.federalReps.push(ocRepID);
          }
          var openStatesQuery = "legislators/geo/?lat=" + newUser.latitude;
          openStatesQuery += "&long=" + newUser.longitude
          var queryURL = openStatesURL + openStatesQuery + openStatesKey;
          $.ajax({
            url: queryURL,
            method: 'GET',
          }).then(function(osResponse) {
            var reps = osResponse;
            for (var i = 0; i < reps.length; i++) {
              osRepID = reps[i].id;
              newUser.stateReps.push(osRepID);
            }

            firebase.auth().onAuthStateChanged(function(user) {
              if (user) {
                database.ref('users').child(user.uid).set(newUser);
                window.location = 'table.html';
              }
            });
          });
        });
      });
    return false;
      window.location('table.html');
    });
});

$('#edit-password').on('click', function(){
  window.location = 'pass-change.html';
  return false;
});

$('#edit-password-submit').on('click', function(){
  var pass = $('#new-pwd').val();
  var confirmPass = $('#confirm-new-pwd').val();
  if(pass == confirmPass){
    var user = firebase.auth().currentUser;
    user.updatePassword(pass).then(function() {
      window.location = 'table.html';
    }, function(error) {
      $('#modalText').text('An unexpected error occurred. Please try again.');
      $('#myModal').show();
    });
  } else{
    $('#modalText').text('Oops! Your passwords don\'t match!');
    $('#myModal').show();
  }
  return false;
});

$(document).on('click', '#logout-link', function(){

  firebase.auth().signOut().then(function() {
    window.location = 'index.html';
    // Sign-out successful.
  }, function(error) {
    // An error happened.
  });
});

$(document).on('click', '#login-button', function(){

  var email = $('#login-email').val();
  var pass = $('#login-pass').val();

  firebase.auth().signInWithEmailAndPassword(email, pass).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  $('#modalText').text(error.message);
  $('#myModal').show();
  });

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      window.location = 'table.html';
    }
  });
  return false;
});

$('#modalClose').on('click', function() {
    $('#myModal').hide();
});
