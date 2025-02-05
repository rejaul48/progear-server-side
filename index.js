
const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware

app.use(cors())
app.use(express.json())


// mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ho6hi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Send a ping to confirm a successful connection

        // database collections
        const db = client.db('sportsDB')
        // users collection
        const sportsUserCollection = db.collection('sportsUserCollection')
        // product collection
        const productsCollection = db.collection('productsCollection')


        // get all users
        app.get('/users', async (req, res) => {

            const cursor = sportsUserCollection.find()
            const users = await cursor.toArray()

            res.send(users)
        })

        // find user using email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;

            try {
                // Find a user with the matching email
                const user = await sportsUserCollection.findOne({ email: email });

                if (user) {
                    res.send(user);
                } else {
                    res.status(404).send({ message: "User not found" });
                }
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch user by email" });
            }
        });

        // // find product api
        // get all data from database
        app.get('/all_products', async (req, res) => {

            const cursor = productsCollection.find()
            const product = await cursor.toArray()

            res.send(product)
        })

        // get data with limit
        app.get('/products', async (req, res) => {
            const limit = parseInt(req.query.limit) || 6;
            const skip = parseInt(req.query.skip) || 0;

            const cursor = productsCollection.find().skip(skip).limit(limit);
            const products = await cursor.toArray();

            res.send(products);
        });




        // get data using specific email address
        app.get('/products/:email', async (req, res, next) => {
            const email = req.params.email;

            if (email.includes('@')) {
                try {
                    const products = await productsCollection.find({ userEmail: email }).toArray();

                    if (products.length > 0) {
                        return res.send(products);
                    } else {
                        return res.status(404).send({ message: "No products found for this email" });
                    }
                } catch (error) {
                    return res.status(500).send({ error: "Failed to fetch products" });
                }
            }

            next();  // Pass to the next route if not an email
        });


        // get data using specific id 
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;

            try {
                const query = { _id: new ObjectId(id) };
                const product = await productsCollection.findOne(query);

                if (product) {
                    res.send(product);
                } else {
                    res.status(404).send({ message: "Product not found" });
                }
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch product by id" });
            }
        });



        // products data store into database
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })


        // post operation / write
        app.post('/users', async (req, res) => {

            const user = req.body;
            const result = await sportsUserCollection.insertOne(user)
            res.send(result)
        })


        // update product information
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };  
            const option = { upsert: true };
            const updateProduct = req.body;  

            const product = {
                $set: {
                    photoURL: updateProduct.photoURL,
                    itemName: updateProduct.itemName,
                    categoryName: updateProduct.categoryName,
                    price: updateProduct.price,
                    rating: updateProduct.rating,
                    customization: updateProduct.customization,
                    processingTime: updateProduct.processingTime,
                    stockStatus: updateProduct.stockStatus,
                    userName: updateProduct.userName,
                    userEmail: updateProduct.userEmail,
                    description: updateProduct.description
                }
            };

            try {
                const result = await productsCollection.updateOne(filter, product, option);

                if (result.modifiedCount > 0) {
                    res.send({ message: "Product updated successfully", result });
                } else {
                    res.status(404).send({ message: "Product not found or no changes made" });
                }
            } catch (error) {
                res.status(500).send({ error: "Failed to update product" });
            }
        });

        // delete product api
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// basic server started and test
app.get('/', (req, res) => {
    res.send("Basic server start....")
})

// listen on 
app.listen(port, () => {
    console.log("This sever running on port number: ", port)
})