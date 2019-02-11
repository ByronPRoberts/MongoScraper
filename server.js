var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();


app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/MongoScraper";

mongoose.connect(MONGODB_URI);

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");


    
    
    app.get("/scrape", function(req, res){
    axios.get("www.reddit.com/r/nba").then(function(response){
        var $ = cheerio.load(response.data);

        $("scrollerItem").each(function(i, element){
            var result = {}

            result.title = $(this)
                .children("h2")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");
            result.summary = $(this)
                .find(".s90z9tc-10 fHRkcP")
                .text();


                db.Article.create(result)
                .then(function(dbArticle) {
                  res.redirect("/");
                })
                .catch(function(err) {
                //   res.json(err);
                });
            })
          });
        });
        
        app.get("/", function(req, res) {
            db.Article.find({})
                .then(function(dbArticle) {
                    res.render("index", {dbArticle});
                })
                .catch(function(err) {
                    res.json(err);
                });
        });  
        app.get("/article/save/:id", function(req, res) {
          var id = req.params.id
          db.Article.findByIdAndUpdate(id, { saved: true})
            .then(function(dbArticle) {
              res.redirect("back");
            })
            .catch(function(err) {
              res.redirect("/");
            })
        });
  
        app.get("/article/unsave/:id", function(req, res) {
          var id = req.params.id
          db.Article.findByIdAndUpdate(id, { saved: false})
            .then(function(dbArticle) {
              // dbArticle.remove();
              res.redirect("back");
            })
            .catch(function(err) {
              res.redirect("/");
            })
        });

        app.get("/article/saved", function(req, res) {
            db.Article.find({saved: true})
              .then(function(dbArticle) {
                res.render("saved", {dbArticle});
              })
              .catch(function(err) {
                res.json(err);
              })
          });
        
        app.get("/article/clear", function(req, res) {
          db.Article.find({saved: false}).remove()
            .then(function(dbArticle) {
              res.redirect("back");
            })
            .catch(function(err) {
              res.json(err);
            })
        });
        
        app.get("/article/delete/:id", function(req, res) {
          var id = req.params.id
          db.Article.findByIdAndRemove(id)
            .then(function(dbArticle) {
              res.redirect("/")
            })
            .catch(function(err) {
              res.json(err);
            });
        });
  
        app.get("/comment/delete/:id", function(req, res) {
          var id = req.params.id
          db.Note.findByIdAndRemove(id)
            .then(function(dbNote) {
              res.redirect("back")
            })
            .catch(function(err) {
              res.json(err);
            });
        });
        
        app.get("/article/detail/:id", function(req, res) {
          var id = req.params.id;
          db.Article.findById(id)
            .populate("notes")
            .then(function(dbArticle) {
              
              notes = dbArticle.notes;
              
              res.render("article", {
                link: dbArticle.link,
                title: dbArticle.title,
                summary: dbArticle.summary,
                saved: dbArticle.saved,
                _id: dbArticle._id,
                notes
              });
            });
        });
        
        app.post("/articles/comment/:id", function(req, res) {
          console.log(req.body);
          db.Note.create(req.body)
            .then(function(dbNote) {
              
              console.log(req.params.id);
              
              return db.Article.findByIdAndUpdate(req.params.id, { $push: {notes: dbNote._id} }, { new: true });
            })
            .then(function(dbArticle) {
              res.redirect("back");
            })
            .catch(function(err) {
              res.json(err);
            });
        })


app.listen(PORT, function(){
    console.log("app running on http://localhost:"+ PORT);
});