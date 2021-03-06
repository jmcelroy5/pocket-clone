var Cards = new Mongo.Collection('cards')

Router.route('/', function () {
  this.render('Home', {
    data: () => {
      const cards = Cards.find({archived: false}, {sort: {createdAt: -1}})
      return {header: 'My List', cards}
    }
  })
})

Router.route('/archive', function () {
  this.render('Home', {
    data: ()  => ({
      header: 'Archived'
    , cards: Cards.find({archived: true}, {sort: {createdAt: -1}})
    })
  })
})

Router.route('/favorites', function () {
  this.render('Home', {
    data: ()  => ({
      header: 'Favorites'
    , cards: Cards.find({favorite: true}, {sort: {createdAt: -1}})
    })
  })
})

Router.route('/read/:id', function () {
  this.render('Reader', {
    data: () => ({
      card: Cards.findOne({_id: this.params.id})
    })
  })
})

if (Meteor.isClient) {
  Template.Home.events({
    'submit [data-action="save"]': (e) => {
      e.preventDefault();
      // save form values as new link doc
      Meteor.call('add', e.target.url.value)
      // clear the form
      e.target.url.value = ''
    }
  })

  Template.cardToolbar.events({
    'click [data-action="delete-popover"]': (e, template) => {
      e.preventDefault()
      template.$('.popover').toggleClass('block')
      // keep the toolbar visible while popover is active
      template.$('.toolbar-icon:not(.gold)').toggleClass('fade')
    }
  , 'click [data-action="delete-confirm"]': (e, template) => {
    e.preventDefault()
    template.$('.popover').toggleClass('block')
    const id = e.target.parentElement.getAttribute('data-id')
    Meteor.call('delete', id)
  }
  , 'click [data-action="archive"]': (e) => {
    e.preventDefault()
    const id = e.target.parentElement.getAttribute('data-id')
    Meteor.call('archive', id)
  }
  , 'click [data-action="favorite"]': (e) => {
    e.preventDefault()
    const id = e.target.parentElement.getAttribute('data-id')
    Meteor.call('favorite', id)
  }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      add: (url) => {
        const linkData = ScrapeParser.get(url)
        Cards.insert(Object.assign(linkData, {
          favorite: false
        , archived: false
        , userTags: []
        , createdAt: Date.now()
        }))
      }
    , delete: (id) => {
      Cards.remove(id)
    }
    , archive: (id) => {
      const current = Cards.findOne({_id: id}).archived
      Cards.update(id, {
        $set: {archived: !current}
      })
    }
    , favorite: (id) => {
      const current = Cards.findOne({_id: id}).favorite
      Cards.update(id, {
        $set: {favorite: !current}
      })
    }
    })
  })
}