console.log('GIT SOME SLEEP!');

//i'm going to store my current user's stuff here
currentUser = {}
githubUsers = new GithubUsers // instantiate the backbone collection

//I've put this click event registration inside a promise because i want to do something after the login is complete
var login = new Promise (function(resolve, reject) {
  $('.github-login').click(githubLogin);
  function githubLogin(){

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
  
  //get the authenticated user's data
  $.get(url + '/user?'+ currentUser.access_string, function(response){
    $.extend(currentUser, response)
    console.log('currently logged in user  ', currentUser);
  }) 
})

//the list of usernames provided by the logged in user will go here
var userLoginsArray = ['joshuamaxwell', 'colorTurtle', 'masondesu'];
console.log('userLoginsArray contains the following: ', userLoginsArray);

//function takes an array of user login strings 
//gets their user object data from github to create a githubUser model
//and adds the github user model object to the githubUsers collection
function retreiveGithubUsers (userLoginsArray) {
// now go through that list of usernames and look up all the repositories for each
  _.each(userLoginsArray, function(userLogin){
    $.get(url + '/users/' + userLogin + '?' + currentUser.access_string , function(githubUser){
      console.log('Charted User\'s github data that needs saved to collection', githubUser);
      //save each one of these as a new model to the collection
      githubUsers.add(new GithubUser(githubUser));
    })
  })

  //this log should get run after every request is returned
  console.log('the collection should be filled now: ', githubUsers.models);

}

// extend the user's object with a repos property
function getUserRepos(githubUser) {
  
  console.log('each users repos url: ', githubUser.get('repos_url'));
  $.get(githubUser.get('repos_url') + '?' + currentUser.access_string, function(repos){
    console.log('I think this should be each users repos array object  ', repos);
    //I'm going to want to add that array object as one of each of their properties
    githubUser.set('repos', repos);
  })
  
}

// take a githubUser model and extend it's repos property object with commit time stamps
function inflateUserRepos (githubUser) {
  githubUser.set('myCommits', [])
  var numResponses = 0
  
  var p2 = new Promise(function(resolve, reject){
    _.each(githubUser.get('repos'), function(repoSummary){
      $.get(repoSummary.url + '/commits?' + currentUser.access_string, function(commits){
        //add to this number for every response (these are successful)
        numResponses += 1
        console.log('got ', commits.length, ' commits from ', repoSummary.name, '. That was ', numResponses, ' out of ', githubUser.get('repos').length, ' for ', githubUser.get('login'));
        
        // add this array of commit data as a property of the user's repo for later?
        repoSummary.commits = commits 

        // only if the user id matches then
        filteredCommits = _.filter(commits, function(commit){return commit.committer.id === githubUser.get('id')})
        console.log(filteredCommits.length, ' of those were actually from that user');
        
        //use map to create a flattened simplified summary of the users commits to her own repo
        myCommits = _.map(filteredCommits, function(commit){
          myCommit = {}
          myCommit.repoName = repoSummary.name;
          myCommit.date = commit.commit.committer.date;
          myCommit.message = commit.commit.message;
          return myCommit
        })

        // concatinate the filtered , simplified array to the githubUser.myCommits property 
        githubUser.set('myCommits', githubUser.get('myCommits').concat(myCommits))
        console.log('added commits info to ', githubUser.get('login'), '\'s  repoSummary and concatinated to githubUser.myCommits array. It looks like this ', githubUser.get('myCommits'));
        
        
        //starting from 0, add one to this numResponses variable, 
        //once it equals the length of the array that is 
        //being loped through we should resolve the promise
        if (numResponses === githubUser.get('repos').length) resolve(githubUser)
      }).fail(
        function(){
                //add in the failed responses too, please
                numResponses += 1
                console.log('got NO commits from ', repoSummary.name, '. That was ', numResponses, ' out of ', githubUser.get('repos').length, ' for ', githubUser.get('login'));
                if (numResponses === githubUser.get('repos').length) resolve(githubUser)
      })
    })
  })

  p2.then(function(githubUser){
    console.log('added commits info to the githubUser.commits . user: ', githubUser.get('login'), ' commits: ', githubUser.get('commits'));
  })
}

 


//testing
function getAllUsersRepos (githubUsers) {
  githubUsers.each(function(githubUser){
    getUserRepos(githubUser)
  })
}

function inflateAllUsersRepos (githubUsers) {
  githubUsers.each(function(githubUser){
    inflateUserRepos(githubUser)
  })
}

//go through each user's repo api uri and request commit data for 
//each one to store and compare with other's combined repos




// function allUsersCommits(url) {
//   console.log('inside commits now: ', url);
// }

// console.log(usersRepos(response_users_joshuamaxwell_repos));
















// function makeid()
// {
//     var text = "";
//     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//     for( var i=0; i < 15; i++ )
//         text += possible.charAt(Math.floor(Math.random() * possible.length));

//     return text;
// }

// var randomString = makeid();

// var params = {
//   client_id: '8159bee811196d909ba6',
//   redirect_uri: 'http://joshuamaxwell.github.io/git-some-sleep/index.html',
//   scope: '',
//   state: randomString
// }

// var url = '//github.com/login/oauth/authorize'
// url += '?' + $.param(params)
// console.log(url);

// location.replace(url);



// var params = {
//   client_id: '8159bee811196d909ba6',
//   code: '',
//   redirect_uri: 'http://joshuamaxwell.github.io/git-some-sleep/index.html'
// }
// $.post('//github.com/login/oauth/access_token')