const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/',async(req,res)=>{
  res.send('Bistro Boss');
})



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3oeok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const bistroBossCollection = client.db('bistroBoss').collection('menu');
    const reviewsCollection = client.db('bistroBoss').collection('review');
    const addToCartsCollection = client.db('bistroBoss').collection('cart');
    // all menu item =====================
    app.get('/menu',async(req,res)=>{
      const menu = await bistroBossCollection.find().toArray();
      res.send(menu);
    })
    // all customer reviews ========================
    app.get('/review',async(req,res)=>{
      const review = await reviewsCollection.find().toArray();
      res.send(review);
    })
    // get all cart item ======================
    app.get('/cart',async(req,res)=>{
      const email = req.query.email;
      const query = {email : email};
      const cartItems = await addToCartsCollection.find(query).toArray();
      res.send(cartItems);
    })
    // post add to cart item ===============================
    app.post('/cart',async(req,res)=>{
      const newItem = req.body;
      const result = await addToCartsCollection.insertOne(newItem);
      res.send(result);
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.listen(port,()=>{
  console.log(`My Port is : ${port}`)
})