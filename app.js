var express = require('express'),
    path = require('path'),
    cookieParser=require('cookie-parser'),
    bodyParser=require('body-parser'),
    expressHandleBars=require('express-handlebars'),
    //expressHandlebarsSections = require('express-handlebars-sections'),
    expressValidador=require('express-validator'),
    flash=require('connect-flash'),
    session=require('express-session'),
    passport=require('passport'),
    LocalStrategy=require('passport-local').Strategy,
    GithubStrategy = require('passport-github').Strategy,
    mongo=require('mongodb'),
    config=require('./config/database')
    mongoose = require('mongoose');

    mongoose.connect(config.development);
    var db=mongoose.connection;


// routes
var routes = require('./routes/index.route'),
    homeRoute = require('./routes/home.route'),
    userRoute = require('./routes/users.route'),
    apiRoute = require('./routes/api.route'),
    authenticationRoute = require('./routes/authentication.route');

var helpers=require('./helpers/app.helpers');
// Init App
var app= express();
var server = require("http").Server(app);

app.set('port',(process.env.PORT || 8800));
server.listen(app.get('port'),function(){
  console.log('Listinig to port '+app.get('port'));
});

//creating socket server
var io = require("socket.io")(server);

// View engine
app.set('views',path.join(__dirname,'views'));
app.engine('handlebars',expressHandleBars({
  defaultLayout:'layout',
  helpers: helpers
//  section: expressHandlebarsSections()  
}));
app.set('view engine','handlebars');

// body parse midlleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());


// set Static forlder
app.use(express.static(path.join(__dirname,'public')));

// Express session
app.use(session({
  secret:'secret',
  saveUninitialized:true,
  resave:true
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());
app.use(express.cookieParser());
app.use(express.session({secret: 'mysecret'}));

passport.use(new GithubStrategy({
  clientID: '332445fb159186fe0cfa',
  clientSecret: 'b862f87fee8a498c7975627391a5810077a800ef',
  callbackURL: 'https://8800-d0e132cc-6155-4859-87d1-ac2725a1769f.ws-eu01.gitpod.io/home'
}, function(accessToken, refreshToken, profile, done){
  done(null, {
    accessToken: accessToken,
    profile: profile
  });
}));

passport.serializeUser(function(user, done) {
  // for the time being tou can serialize the user 
  // object {accessToken: accessToken, profile: profile }
  // In the real app you might be storing on the id like user.profile.id 
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  // If you are storing the whole user on session we can just pass to the done method, 
  // But if you are storing the user id you need to query your db and get the user 
  //object and pass to done() 
  done(null, user);
});

// express validator
// : rever validação
app.use(expressValidador({
  errorFormatter:function(param,msg,value){
    var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

      while(namespace.length){
        formParam+='['+ namespace.shift()+']'
      }
      return {
        param: formParam,
        msg: msg,
        value: value
      }
  }
}));

// connect Flash
app.use(flash());

// global vars
app.use(function(req,res,next){
  res.locals.success_msg = req.flash('susses_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals["socketio"] = io;
  res.locals.url=req.url.split('/')[1] || 'home'
  res.locals.hostname=req.hostname
  next();
})

app.use('/',homeRoute);
app.use('/io',userRoute);
app.use('/api',apiRoute);
app.use('/authentication',authenticationRoute);

io.on('connection',function(socket){

io.emit('messageSuccess','ola')
  console.log( new Date()+ ', connected to: '+ socket.id + ' on ' + socket.request.connection.remoteAddress + ' - ' + socket.request.headers['user-agent']);
  io.emit('refresh-connection',true)
  socket.on('disconnect', function(){
    io.emit('refresh-connection',false)
    console.log(new Date()+ ', disconnected');
  });
})
io.on('*', function(data){
  console.log(data)
})
io.on('messageSuccess',function(data){
  console.log(data +'ola' )
})

