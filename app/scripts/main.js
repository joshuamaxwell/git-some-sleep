console.log('GIT SOME SLEEP!');

//i'm going to store my current user's stuff here
currentUser = {}

// instantiate the backbone collection
githubUsers = new GithubUsers 

//I've put this click event registration inside a promise because i want to do 
//something after the login is complete
var login = new Promise (function(resolve, reject) {
  $('.github-login').click(githubLogin);
  function githubLogin(){
    $('.github-login').addClass('btn-danger')

    hello('github').login(function(response){
      $('.github-login').removeClass('btn-danger')  
      $('.github-login').addClass('btn-warning')  
      console.log('you are logged into github: ', response);
      response.authResponse.access_token ? access_token = response.authResponse.access_token : access_token = 'no token';
      resolve(access_token);
    });

  }
})

hello.on('auth.login', function(auth){
    
    // call user information, for the given network
    hello( auth.network ).api( '/me' ).success(function(r){
      var $target = $("#profile_"+ auth.network );
      if($target.length==0){
        $target = $("<div id='profile_"+auth.network+"'></div>").appendTo("#profile");
      }
      $target.html('<img src="'+ r.thumbnail +'" /> Hey '+r.name).attr('title', r.name + " on "+ auth.network);
    });
  });

hello.init({ 
  github     : '8159bee811196d909ba6'
},{});

var url = 'https://api.github.com'


//after the 'login' promise is fulfilled,then print out a basic url
login.then( function(access_token){
  currentUser.access_token = access_token
  currentUser.access_string = '&access_token=' + access_token;

  console.log('api url and access_string is: ', url + '?' + currentUser.access_string);
  
  //get the authenticated user's data
  $.get(url + '/user?'+ currentUser.access_string, function(response){
    $.extend(currentUser, response)
    console.log('currently logged in user  ', currentUser);
    $('.github-login').addClass('btn-success')
  }) 
})

// click event to query user data and put it on the screen
$('.chart-users').click(function(){
  $('.chart-users').addClass('btn-warning')
  //the list of usernames provided by the logged in user will go into this array
  userLoginsString = $('.users-csv').val();
  $('.users-csv').val('');
  userLoginsArray = userLoginsString.replace(/\s+/g,'').split(',');
  console.log('userLoginsArray contains the following: ', userLoginsArray);
  retreiveGithubUsers(userLoginsArray).then(function(){
    $('.chart-users').addClass('btn-success');
  })
})


//to save some time for testing
var exampleLogins = ['joshuamaxwell', 'colorTurtle', 'masondesu'];
$('.users-csv').val(exampleLogins.join(', '));



//functions


//function takes an array of user login strings 
//gets their user object data from github to create a githubUser model
//and adds the github user model object to the githubUsers collection
function retreiveGithubUsers (userLoginsArray) {
  return new Promise(function(resolve, reject){
  var numResponses = 0;

    _.each(userLoginsArray, function(userLogin){
      $.get(url + '/users/' + userLogin + '?' + currentUser.access_string , function(githubUser){
        //I got a response so add one
        numResponses += 1

        //save each one of these as a new model to the collection
        githubUsers.add(githubUser);
        console.log('githubUser\'s github data that is saved to githubUsers collection', githubUser);

        //check are we done yet?
        if(numResponses === userLoginsArray.length) resolve();
      }).fail(function(){
        // ...still got a response
        numResponses += 1
        // don't add it to the collection at this point
        // githubUsers.add(new GithubUser({login: userLogin}));
        console.log('this user didn not get data back from api call ', userLogin, ' and was not added to the backbone collection');
        //check are we done yet?
        if(numResponses === userLoginsArray.length) resolve();
      })
    })

  }) 
}