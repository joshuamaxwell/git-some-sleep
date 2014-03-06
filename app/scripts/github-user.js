var GithubUser = Backbone.Model.extend({
  defaults: {
    myCommits:[],
    repos: []
  },

  initialize: function(){
  }

})

var GithubUsers = Backbone.Collection.extend({
  model: GithubUser,

  initialize: function (options) {
    this.on('add', this.getUserRepos);
    this.on('add', function(newModel){
      console.log('this is the model that needs a view', newModel);
      new GithubUserView({model: newModel})
    })
  },

  getUserRepos: function (githubUser) {
    var that = this;
    // extend the user's object with a repos property
    // console.log('each users repos url: ', githubUser.get('repos_url'));
    $.get(githubUser.get('repos_url') + '?' + currentUser.access_string, function(repos){
      console.log('I think this should be each users repos array object  ', repos);
      //I'm going to want to add that array object as one of each of their properties
      githubUser.set('repos', repos);
      //then pass the same user to this next method
      that.inflateUserRepos(githubUser);
    }).fail(function(){
      console.log('there is no repos for ', githubUser.get('login'));
    })
  },

  inflateUserRepos: function (githubUser) {
    // take a githubUser model and extend it's repos property object with commit time stamps
    // also adds a myCommits property to the githubUser
      
    //initialize some variables
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

          // filter by only if the user id matches the committer ID
          filteredCommits = _.filter(commits, function(commit){return commit.committer ? commit.committer.id : null === githubUser.get('id')})
          console.log(filteredCommits.length, ' of those were actually from that user');
          
          //use map to create a flattened simplified summary of the users commits to her own repos
          myCommits = _.map(filteredCommits, function(commit){
            myCommit = {}
            myCommit.repoName = repoSummary.name;
            myCommit.date = commit.commit.committer.date;
            myCommit.message = commit.commit.message;
            myCommit.sha = commit.sha;
            return myCommit
          })

          // concatinate the filtered , simplified array to the githubUser.myCommits property 
          githubUser.set('myCommits', githubUser.get('myCommits').concat(myCommits))
          
          //starting from 0, add one to this numResponses variable, 
          //once it equals the length of the array that is 
          //being loped through we should resolve the promise
          if (numResponses === githubUser.get('repos').length) resolve(githubUser)
        }).fail(
          function(err){
                  //add in the failed responses too, please
                  numResponses += 1
                  console.log('got NO commits from ', repoSummary.name, '. That was ', numResponses, ' out of ', githubUser.get('repos').length, ' for ', githubUser.get('login'));
                  if (numResponses === githubUser.get('repos').length) resolve(githubUser)
                  return err;
        })
      })
    })

    p2.then(function(githubUser){
      console.log('added commits info to ', githubUser.get('login'), '\'s  repoSummary and concatinated to githubUser.myCommits array. It looks like this ', githubUser.get('myCommits'));

    })
  }
})

