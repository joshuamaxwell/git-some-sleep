console.log('GIT SOME SLEEP!');

//i'm going to store my current user's stuff here
currentUser = {}
githubUsers = new GithubUsers // instantiate the backbone collection

//I've put this click event registration inside a promise because i want to do something after the login is complete
var login = new Promise (function(resolve, reject) {
  $('.github-login').click(githubLogin);
  function githubLogin(){
    $('.github-login').addClass('btn-danger')

    hello('github').login(function(response){
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
  // facebook : FACEBOOK_CLIENT_ID,
  // windows  : WINDOWS_CLIENT_ID,
  // google    : GOOGLE_CLIENT_ID,
  github     : '8159bee811196d909ba6'
},{});

var url = 'https://api.github.com'
// var params = {
//   access_token: access_token,
// }
// params = $.param(params)

//after the 'login' promise is fulfilled,then print out a basic url
login.then( function(access_token){
  currentUser.access_token = access_token
  currentUser.access_string = '&access_token=' + access_token;

  console.log('api url and access_string is: ', url + '?' + currentUser.access_string);
  $('.github-login').removeClass('btn-danger')  
  $('.github-login').addClass('btn-warning')  
  
  //get the authenticated user's data
  $.get(url + '/user?'+ currentUser.access_string, function(response){
    $.extend(currentUser, response)
    console.log('currently logged in user  ', currentUser);
    $('.github-login').addClass('btn-success')
  }) 
})

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

// these were moved to collection constructor methods that run on whenever a model is added

// // extend the user's object with a repos property
// function getUserRepos(githubUser) {
//   // console.log('each users repos url: ', githubUser.get('repos_url'));
//   $.get(githubUser.get('repos_url') + '?' + currentUser.access_string, function(repos){
//     console.log('I think this should be each users repos array object  ', repos);
//     //I'm going to want to add that array object as one of each of their properties
//     githubUser.set('repos', repos);
//     resolve(repos);
//   }).fail(function(){
//     reject();
//   })
// }

// // take a githubUser model and extend it's repos property object with commit time stamps
// // also adds a myCommits property to the githubUser
// function inflateUserRepos (githubUser) {
//   //initialize some variables
//   githubUser.set('myCommits', [])
//   var numResponses = 0
  
//   var p2 = new Promise(function(resolve, reject){
//     _.each(githubUser.get('repos'), function(repoSummary){
//       $.get(repoSummary.url + '/commits?' + currentUser.access_string, function(commits){
//         //add to this number for every response (these are successful)
//         numResponses += 1
//         console.log('got ', commits.length, ' commits from ', repoSummary.name, '. That was ', numResponses, ' out of ', githubUser.get('repos').length, ' for ', githubUser.get('login'));
        
//         // add this array of commit data as a property of the user's repo for later?
//         repoSummary.commits = commits 

//         // filter by only if the user id matches the committer ID
//         filteredCommits = _.filter(commits, function(commit){return commit.committer ? commit.committer.id : null === githubUser.get('id')})
//         console.log(filteredCommits.length, ' of those were actually from that user');
        
//         //use map to create a flattened simplified summary of the users commits to her own repos
//         myCommits = _.map(filteredCommits, function(commit){
//           myCommit = {}
//           myCommit.repoName = repoSummary.name;
//           myCommit.date = commit.commit.committer.date;
//           myCommit.message = commit.commit.message;
//           myCommit.sha = commit.sha;
//           return myCommit
//         })

//         // concatinate the filtered , simplified array to the githubUser.myCommits property 
//         githubUser.set('myCommits', githubUser.get('myCommits').concat(myCommits))
        
//         //starting from 0, add one to this numResponses variable, 
//         //once it equals the length of the array that is 
//         //being loped through we should resolve the promise
//         if (numResponses === githubUser.get('repos').length) resolve(githubUser)
//       }).fail(
//         function(err){
//                 //add in the failed responses too, please
//                 numResponses += 1
//                 console.log('got NO commits from ', repoSummary.name, '. That was ', numResponses, ' out of ', githubUser.get('repos').length, ' for ', githubUser.get('login'));
//                 if (numResponses === githubUser.get('repos').length) resolve(githubUser)
//                 return err;
//       })
//     })
//   })

//   p2.then(function(githubUser){
//     console.log('added commits info to ', githubUser.get('login'), '\'s  repoSummary and concatinated to githubUser.myCommits array. It looks like this ', githubUser.get('myCommits'));
//   })
// }

 
// for convenience?
function getAllUsersRepos (githubUsers) {
  return new Promise(function(resolve, reject){

    githubUsers.each(function(githubUser){
      getUserRepos(githubUser)
    })

  })
}

function inflateAllUsersRepos (githubUsers) {
  githubUsers.each(function(githubUser){
    inflateUserRepos(githubUser)
  })
}

