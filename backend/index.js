const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const im = require('imagemagick');
const bcrypt = require("bcrypt");
const bodyParser = require('body-parser');
const session = require('express-session');
// const base64Img = require('base64-img');
const usersAPI = require("./db/users.js");
const token = require("./Auth/token.js");
const restaurantCache = require("./cache/RestaurantCache.js");
const request = require('request');

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.json());

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

app.get('/api/getRestaurantInfo', (req, res) => {
    console.log("-------------/api/getRestaurantInfo-------------");
    restaurantCache.getRestaurant(req.query.id, function(restaurant) {
        if (restaurant.is_closed === 'false') {
            restaurant.is_closed = false;
        } else {
            restaurant.is_closed = true;
        }
        res.send(restaurant);
    }, function(err) {
        res.send("cannot found the restaurant by id");
    });
});

app.get('/api/getRestaurantsList', (req, res) => {
    console.log("----------------------getRestaurantsList----------------------");
    const base_url = 'https://api.yelp.com/v3/businesses/search';
    const authOptions = {
      url: base_url + '?latitude=' + req.query.lat + "&longitude=" + req.query.lng,
      headers: {
        'Authorization': "Bearer 7tqgwNq05Ewf75JbrdOwtEqF5p1TvkM2-szTe4rTHmDTEu5MXmdImw84wdejue3AAlxl5ku_wQheVB7_EkSnmafVmqJHtC-bzp_-DWHSyDJzUsI7EsZw8oFcpuzWWXYx",
      },
      grant_type: 'client_credentials',
      json: true
    };

    request.get(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            res.send(body);
        }
        else
            res.send({retCode:400, message:'invalid parameters'});
    });
});

app.post('/api/check_fav_status', async (req, res) => {
    const fullToken = req.body.token;
    const userInfo = token.decodeToken(fullToken);
    const userName = userInfo.payload.data.userName;
    const user = await usersAPI.getUserByUsername(userName);
    const user_id = user._id;
    const restaurant_id = req.body.restaurant_id;
    const result = await usersAPI.checkFavorite(user_id, restaurant_id);
    console.log(result);
    res.sendStatus(result ? 201 : 204);
})

app.post('/api/add_to_fav', async (req, res) => {
    console.log("------------------add to fav---------------");
    const fullToken = req.body.token;
    const userInfo = token.decodeToken(fullToken);
    const userName = userInfo.payload.data.userName;
    const user = await usersAPI.getUserByUsername(userName);
    const user_id = user._id;
    const restaurant_id = req.body.restaurant_id;

    try {
        await usersAPI.addFavorite(user_id, restaurant_id);
        console.log("Add to favorite success!");
        res.send({"result": "SUCCESS"});
    } catch (e) {
        res.send({"result": "failed"});
    }
});

app.delete('/api/remove_fav', async (req, res) => {
    console.log("------------------remove fav---------------");
    const fullToken = req.body.token;
    const userInfo = token.decodeToken(fullToken);
    const userName = userInfo.payload.data.userName;
    const user = await usersAPI.getUserByUsername(userName);
    const user_id = user._id;
    const restaurant_id = req.body.restaurant_id;
    try {
        await usersAPI.removeFavorite(user_id, restaurant_id);
        console.log("Favorite remove success!")
        res.send({"result": "SUCCESS"});
    } catch (e) {
        res.send({"result": "failed"});
    }
});

app.get('/api/getRestaurants', (req, res) => {
    console.log("----------------------getRestaurants----------------------");
    const base_url = 'https://api.yelp.com/v3/businesses/search';
    const token = '7tqgwNq05Ewf75JbrdOwtEqF5p1TvkM2-szTe4rTHmDTEu5MXmdImw84wdejue3AAlxl5ku_wQheVB7_EkSnmafVmqJHtC-bzp_-DWHSyDJzUsI7EsZw8oFcpuzWWXYx';
    const authOptions = {
      url: base_url + '?term=' + req.query.term + '&location=' + req.query.location,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      grant_type: 'client_credentials',
      json: true
    };

    request.get(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            restaurantCache.storeRestaurants(body.businesses);
            res.send(body.businesses);
        }
        else {
            res.send({retCode:400, message:'invalid parameters'});
        }
    });
});

app.post('/api/getUserProfile', async (req, res) => {
    console.log('-------------fetching user profile-----------');
    const fullToken = req.body.userToken;
    const userInfo = token.decodeToken(fullToken);
    const userName = userInfo.payload.data.userName;
    const user = await usersAPI.getUserByUsername(userName);
    console.log(user);
    let favRestaurants = [];
    let promises = [];
    for (let i = 0; i < user.favorites.length; i++) {
        promises[i] = restaurantCache.getRestaurant(user.favorites[i], (restaurant) => {
            if (i !== user.favorites.length - 1) {
                console.log(restaurant);
                favRestaurants.push(`<a href="/display/?${restaurant.id}">${restaurant.title}</a>` + "<br>");
            } else {
                favRestaurants.push(`<a href="/display/?${restaurant.id}">${restaurant.title}</a>`);
            }
        }, (error) => {
            console.log(error);
        })
    }
    Promise.all(promises).then(()=> {
        res.send({
            userName: user.user_name,
            email: user.email,
            phone: user.phone,
            comments: user.comments,
            favorites: favRestaurants
        })
    });
    
})

app.post('/api/login', async (req, res) => {
    const user = await usersAPI.getUserByUsername(req.body.userName);
    if (!user) {
        console.log("/api/login no user");
        res.sendStatus(401);
    } else {
        const isMatch = await bcrypt.compare(req.body.password, user.hashed_password);
        if (!isMatch) {
            console.log("/api/login no match");
            res.sendStatus(401);
        } else {
            console.log("/api/login match");
            let tokenCode = token.createToken(req.body);
            res.send({status: 'login success', retCode: tokenCode});
        }
    }
});

app.post('/api/signup', async (req, res) => {
    console.log(req.body);
    try {
        const saltRounds = 4;
        let hashed_password = await bcrypt.hash(req.body.password1, saltRounds);
        await usersAPI.addUser(req.body.userName, hashed_password, req.body.email, req.body.phone);
        console.log("Create user success!");
        res.sendStatus(200);
    } catch (e) {
        const user = await usersAPI.getUserByUsername(req.body.userName);
        if (user) {
            res.sendStatus(400);
        }
    }
});

io.on('connection', socket => {
    console.log('User connected');
    socket.on('login', async(userInfo) => {
        const user = await usersAPI.getUserByUsername(userInfo.userName);
        const isMatch = await bcrypt.compare(userInfo.password, user.hashed_password);
        let status = "Invalid username or password";
        if (!user || !isMatch) {
            socket.emit("login_err", status);
        } else {
            socket.emit("loggedIn", "success");
        }
    });
    
    socket.on('disconnect', () => {
      console.log('user disconnected');
    })
});

http.listen(3001, () => {
    console.log('listening on :3001');
});
