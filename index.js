const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/',async(req,res)=>{
  res.send('Bistro Boss');
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3oeok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
  const verifyToken = (req,res,next)=>{
    if(!req.headers.authorization){
      return res.status(401).send({message : 'unauthorize access'})
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
         if(err){
          return res.status(401).send({message : 'unauthorize access'})
         }
         req.decoded = decoded;
         next();
    })
  }
  
async function run() {
  
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const bistroBossCollection = client.db('bistroBoss').collection('menu');
    const reviewsCollection = client.db('bistroBoss').collection('review');
    const addToCartsCollection = client.db('bistroBoss').collection('cart');
    const userCollection = client.db('bistroBoss').collection('user');

// middle ware for verify admin =================================
    const verifyAdmin = async (req,res,next)=>{
    const email = req.decoded.email;
    const query = {user_email :email };
    const user = await userCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if(!isAdmin){
      return res.status(403).send({message : 'forbidden access'})
      }
      next();
  }
    // jwt token generate ===============================
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
      res.send({token})

    })
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
    app.get('/cart',verifyToken,async(req,res)=>{
      const email = req.query.email;
      const query = {email : email};
      const cartItems = await addToCartsCollection.find(query).toArray();
      res.send(cartItems);
    })
    // get all user information ========================
    app.get('/user',verifyToken,verifyAdmin,async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    // get user base on email ===========================
    app.get('/user/admin/:email',verifyToken,async(req,res)=>{
      const email = req.params.email;
      const decoded_email = req.decoded.email;
      if(email !== decoded_email){
        return res.status(403).send({message : 'forbidden access'})
      }
      const query = {user_email : email}
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin'
      }
        
      res.send({admin})
    })
    // post user information ============================
    app.post('/user',async(req,res)=>{
      const newUser = req.body;
      const email = newUser.user_email;
      const query = {user_email : email};
      const existentUser = await userCollection.findOne(query);
      if(existentUser){
        return res.send({message : 'user already exist', insertedId: null})
      }else{
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    })
    // update user ============================
    app.patch('/user/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const update = {
        $set : {
          role : 'admin',
        }
      }
      const result = await userCollection.updateOne(query,update);
      res.send(result);
    })
    // delete user =============================
    app.delete('/user/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    // post add to cart item ===============================
    app.post('/cart',verifyToken,async(req,res)=>{
      const newItem = req.body;
      const result = await addToCartsCollection.insertOne(newItem);
      res.send(result);
    })
    // delete cart item ============================
    app.delete('/cart/:id',verifyToken,async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await addToCartsCollection.deleteOne(query);
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