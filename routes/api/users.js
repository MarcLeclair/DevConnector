const express = require('express');
const router  = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret = require('../../config/keys');
const passport = require('passport');

//Load string validation
const validateRegisterInput = require('../../validation/register');
const valideLoginInput = require('../../validation/login');
// Load User model from mongo
const User = require('../../models/User');

//@route    GET api/users/test
//@desc     Tests post route
//@access   Public route
router.get('/test', (req, res) => res.json({msg: "Users works"}));


//@route    GET api/users/register
//@desc     Register user
//@access   Public 
router.post('/register', (req, res) => {
    //destructuring  
    const {errors,isValid } = validateRegisterInput(req.body);

    //check validation of initial input
    if(!isValid)
    {
       return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email })
     .then(user => {
         if(user){
             errors.email = 'Email already exists';
            return res.status(400).json({errors});          
         } else {
            const avatar = gravatar.url(req.body.email, {
                  s: '200', // size
                  r: 'pg', // Rating
                  d: 'nm' // Default
            })
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password        
            });
            
            bcrypt.genSalt(10, (err, salt) =>  {
               bcrypt.hash(newUser.password, salt, (err, hash) => {
                 if(err) throw err;
                  newUser.password = hash;
                  newUser.save()
                      .then(user => res.json(user))
                      .catch(console.log(err));
               })
            })
         }        
     })        
});

//@route    POST api/users/login
//@desc     Login User / Returning JWT token
//@access   Public 
router.post('/login', (req, res) => {
  const {errors,isValid} = valideLoginInput(req.body);

  //validate
  if(!isValid){
    return res.status(400).json(errors);
  }
  
  const email = req.body.email;
  const password = req.body.password;
  

  //find user by email
  User.findOne({email})
    .then(user => {
      //check
      if(!user) {
        errors.email ='User not found';
        return res.status(404).json({errors});         
      }

      // Check Password
      bcrypt.compare(password, user.password)
       .then(isMatch => {
          if(isMatch){
            
            //Create payload for jwt
            const payload = { id: user.id, name: user.name, avatar: user.avatar };

            //Sign Token
            jwt.sign(
                 payload, 
                 secret.secretOrKey, 
                 {expiresIn: 3600},
                 (err, token) => {
                   if(err) throw err;
                   res.json({ 
                        succes: true,
                        token: 'Bearer ' + token       
                        })        
                 }
               );                   
          } else {
            errors.password = "Incorrect password";
            return res.status(400).json({errors});
          }         
       })
    })
})

//@route    POST api/users/current 
//@desc     Return current user
//@access   Private
router.get('/current', passport.authenticate('jwt',{ session: false }), (req, res) => {
    res.json(req.user);        
})
module.exports = router;