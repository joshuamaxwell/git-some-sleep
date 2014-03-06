var GithubUserView = Backbone.View.extend({
  className: 'github-user-card panel-default panel',
  
  initialize: function () {
    $('.user-cards').append( this.el )
    this.render()
  },

  renderTemplate: _.template($('#github-user-card-template').text()),

  render: function(){
    //this.model is currently undefined
    this.$el.html(this.renderTemplate(this.model))
  }
})