// index.js
// where your node app starts

// init project
require('dotenv').config();

var express = require('express');
const cors = require('cors');
var app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');

const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortner");
const urls = db.collection("urls");

//Port
const port = process.env.PORT || 3000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// your first API endpoint...
app.post('/api/shorturl', function (req, res) {
  console.log(req.body);
  const url = req.body.url
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if(!address) {
      res.json({error: "Invalid URL"});
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount
      }

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({short_url: +shorturl});
  res.redirect(urlDoc.url);
});
/*
// Define a new GET route to redirect to the original URL based on the short_url parameter
app.get('/api/shorturl/:short_url', async function (req, res) {
  const short_url = parseInt(req.params.short_url);

  // Find the corresponding document in the database based on the short_url
  const urlDoc = await urls.findOne({ short_url });

  if (urlDoc) {
    // Redirect to the original URL
    res.redirect(urlDoc.url);
  } else {
    // If the short_url is not found, respond with an error
    res.json({ error: "Short URL not found" });
  }
});

*/

// listen for requests :)
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
