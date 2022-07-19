//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb+srv://huge-orange-master:3cWvoZjQRbsVEZFqUq@cluster0.arlckwg.mongodb.net/todolistDB?retryWrites=true&w=majority');

const dateNow = date.getDate();

const itemSchema = new mongoose.Schema ({
  itemBody: String,
  dateAdded: Date
});
const Item = new mongoose.model('Item', itemSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
const List = new mongoose.model('List', listSchema);

const userSchema = new mongoose.Schema({
  name: String,
  lists: [listSchema]
});
const User = new mongoose.model('User', userSchema);

const item1 = new Item ({
  itemBody: 'Welcome to your todolist!',
  dateAdded: dateNow
});

const item2 = new Item ({
  itemBody: 'Hit the + button to add new item.',
  dateAdded: dateNow
});

const item3 = new Item ({
  itemBody: '<-- Hit this to delete an item.',
  dateAdded: dateNow
});

const defaultsItems = [item1, item2, item3];

app.get('/', function(req, res) {
  Item.find({name: 'inbox'}, function (err, foundItems){
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultsItems, function(err){
          if (err) {
              console.log(err);
          }
        });
        res.redirect('/');
      } else {
        res.render('list', {listTitle: dateNow, newListItems: foundItems});
      }
  }});
});

app.get('/:listName', function (req, res) {
  
  let listName = _.capitalize(req.params.listName);
  const listRoute = '/' + listName;
  
  const list = new List ({
    name: listName,
    items: defaultsItems
  });
  
  List.findOne({name: listName}, function (err, foundList){
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        list.save();
        res.redirect(listRoute);
      } else {
        res.render('list', {listTitle: listName, newListItems: foundList.items});
      }
    }
  });

});

app.post('/add', function(req, res){
  let listName = req.body.list;
  const listRoute = '/' + listName;

  const item = new Item ({
    itemBody: req.body.newItem,
    dateAdded: dateNow
  });

  if (listName === dateNow) {
    listName = 'inbox';
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect(listRoute);
    });
  }
});

app.post('/delete', function(req,res){
  let listName = req.body.list;
  const listRoute = '/' + listName;
  const itemID = req.body.checkbox;
  
  if (listName === dateNow) {
    Item.findByIdAndRemove(itemID, function (err){
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
      }});
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: itemID}}},
      function (err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect(listRoute);
        }});
}});

app.get('/about', function(req, res){
  res.render('about');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function (req, res) {
  console.log('The server is runing now.');
});