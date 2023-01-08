const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const missingDb = require('./model/model.js');
const axios = require('axios');
const cors = require('cors');

dotenv.config();

const app = express();

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/', function (req, res) {
  res.send('Hello, World!');
});

app.post("/test", function(req,res){
  console.log(req.body.id);
  res.send('Test');
})

app.post('/addmissing', function(req,res){
  
  console.log("start adding");
  
  const detecturl = `https://api-us.faceplusplus.com/facepp/v3/detect?api_key=${process.env.API_KEY}&api_secret=${process.env.API_SECRET}&image_url=${req.body.image_url}`
  
  axios
  .post(detecturl)
  .then(response => {
      const missing = new missingDb({
        name: req.body.name,
        contact_number: req.body.contact_number,
        address: req.body.address,
        image_url: req.body.image_url,
        subject_id: new mongoose.Types.ObjectId(),
        image_token: response.data.faces[0].face_token
      });
      const addurl = `https://api-us.faceplusplus.com/facepp/v3/faceset/addface?api_key=${process.env.API_KEY}&api_secret=${process.env.API_SECRET}&faceset_token=${process.env.FACESET_TOKEN}&face_tokens=${response.data.faces[0].face_token}`
      axios
        .post(addurl)
        .then(addres => {
          missing.save((err,missings)=>{
            if(err){
              res.send(err);
            }
            res.status(200).json({
              ...missings,
              face_count: addres.data.face_count
            })
          })
        })
    });

});

app.post('/foundmissing', async(req,res)=>{
  const searchmissing = `https://api-us.faceplusplus.com/facepp/v3/search?api_key=${process.env.API_KEY}&api_secret=${process.env.API_SECRET}&faceset_token=${process.env.FACESET_TOKEN}&image_url=${req.body.image_url}`

    const response = await axios.post(searchmissing);

    response.data.results.map(async(result)=>{
      console.log(result);
      const doc = await missingDb.findOne({image_token: result.face_token});
      const pos = doc.possible_results;
      console.log(pos);

      const update = {
        possible_results: [{image_url: req.body.image_url, confidence: result.confidence, contact: req.body.contact, address: req.body.address}, ...pos],
      };

      await doc.updateOne(update);
      res.status(200).json("complete");
    });

    res.status(200).json(response.data.results);

});

app.post('/verified/:id', async(req,res)=>{
  const doc = await missingDb.findOne({image_token: req.params.id});
  const update = {
    found: "true",
  }
  await doc.updateOne(update);
  res.status(200).json("complete");
})

app.get('/getallmissing', function(req,res){
  missingDb.find({}, function(err,users){
    res.json(users);
  })
});

app.get('/getmissing/:name', function(req,res){
  missingDb.find({image_token: req.params.name}, (err,data)=>{
    res.json(data);
  })
})

const port = process.env.PORT || 3001;

app.listen(port, async () => {
  console.log(`Server is running at port ${port}`);
});
