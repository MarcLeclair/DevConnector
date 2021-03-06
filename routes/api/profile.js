const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check')
//Load Profile Model
const Profile = require('../../models/Profile');
//Loaud User Profile
const User = require('../../models/User');

//Load string validation
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

//@route    GET api/profile/test
//@desc     Tests post route
//@access   Public route
router.get('/test', (req, res) => res.json({msg: "profile works"}));


//@route    GET api/profile/me
//@desc     Get current users profile
//@access   private
router.get('/me', passport.authenticate('jwt', { session : false}),async (req,res) =>{
    try{
        const errors = {};

        const  profile = await Profile.findOne({ user: req.user.id })
                            .populate('user',['name','avatar']);
                           
        if(!profile){   
            errors.noprofile = 'There is no profile for this user';
            return res.status(404).json(errors);
        }
        res.json(profile);
    }catch(err){
        res.status(500).send('Server Error');
    }
});

//@route    GET api/profile/handle/:handle
//@desc     Get profile by handle
//@access   Public
router.get('/handle/:handle', (req,res) =>{
    const errors = {};

    Profile.findOne({ handle: req.params.handle })
        .populate('user',['name', 'avatar'])
        .then(profile =>{
            if(!profile){
                errors.noprofile = ' THere is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json({profile : "there is no profile for this ID"}));
})

//@route    GET api/profile/:user_id
//@desc     Get profile by user ID
//@access   Public
router.get('/user/:user_id', (req,res) =>{
    const errors = {};

    Profile.findOne({ user: req.params.user_id })
        .populate('user',['name', 'avatar'])
        .then(profile =>{
            if(!profile){
                errors.noprofile = ' THere is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json(err));
})


// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }

      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: 'There are no profiles' }));
});
//@route    POST api/profile
//@desc     Create or Edit user profile
//@access   private
router.post('/', 
    [
       passport.authenticate('jwt', { session : false}), 
       [
            check('status', 'Status is Required')
                .not()
                .isEmpty(),
            check('skills', 'Skills is required')
                .not()
                .isEmpty()
        ]
    ], 
    async (req,res) =>{
        try{
            const errors = validationResult(req);
            //check Vadlidation
            if(!errors.isEmpty()){
                //return any errors with 400 status
                return res.status(400).json({errors: errors.array()});
            }
            //Get fields
            const profileFields = {};
            profileFields.user = req.user.id;
            if(req.body.handle) profileFields.handle = req.body.handle;
            if(req.body.company) profileFields.company = req.body.company;
            if(req.body.website) profileFields.website = req.body.website;
            if(req.body.location) profileFields.location = req.body.location;
            if(req.body.bio) profileFields.bio = req.body.bio;
            if(req.body.status) profileFields.status = req.body.status;
            if(req.body.githubUserName) profileFields.githubUserName = req.body.githubUserName;
            //Skills - Split into array
            if(typeof req.body.skills !== 'undefined'){
                profileFields.skills = req.body.skills.split(',');
            }

            //social
            profileFields.social = {};
            if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
            if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
            if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
            if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
            if(req.body.instagram) profileFields.social.instagram = req.body.instagram;
            
            if(req.body.handle) profileFields.handle = req.body.handle;



            Profile.findOne({user: req.user.id})
                .then(profile => {
                    if(profile){
                        //update
                        Profile.findOneAndUpdate({user: req.user.id} , {$set: profileFields}, {new: true})
                        .then(profile => res.json(profile))
                    }else {
                        //create Profile
                        //check if handle exists
                        Profile.findOne({handle: profileFields.handle}).then(profile =>{
                            if(profile){
                                errors.handle = 'That handle already exists';
                                res,status(400).json(errors);
                            }
                            //save profile

                            new Profile(profileFields).save().then(profile => res.json(profile));
                        })
                    }
                    
                })    
        }catch(err){
            console.log(err);
            res.status(500).send('Server error');
        }

});


//@route    POST api/profile/experience
//@desc     Create or Edit user profile
//@access   private
router.post('/experience', passport.authenticate('jwt' , {session : false}), (req, res) => {
   const {errors, isValid } = validateExperienceInput(req.body);
    
    //check Vadlidation
    if(!isValid){
        //return any errors with 400 status
        return res.status(400).json(errors);
    }

    Profile.findOne({user: req.user.id})
    .then(profile => {
        const newExp = {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        }
        
        //Add to exp array
        profile.experience.unshift(newExp);

        profile.save().then(profile=> res.json(profile));

    })
})

//@route    POST api/profile/education
//@desc     Create or Edit user profile
//@access   private
router.post('/education', passport.authenticate('jwt' , {session : false}), (req, res) => {
   const {errors, isValid } = validateEducationInput(req.body);
    console.log(req.body)
    //check Vadlidation
    if(!isValid){
        //return any errors with 400 status
        return res.status(400).json(errors);
    }

    Profile.findOne({user: req.user.id})
    .then(profile => {
        const newEdu = {
            school: req.body.school,
            degree: req.body.degree,
            fieldOfStudy: req.body.fieldOfStudy,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        }
        
        //Add to exp array
        profile.education.unshift(newEdu);

       
        profile.save().then(profile=> res.json(profile));
    })
})

//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete experience from profile
//@access   private
router.delete('/experience/:exp_id', passport.authenticate('jwt' , {session : false}), (req, res) => {

    Profile.findOne({user: req.user.id})
    .then(profile => {
            //Get remove index
            const removeIndex = profile.experience
                .map(item => item.id)
                .indexOf(req.params.exp_id);
        
            //Splice out of array
            profile.experience.splice(removeIndex, 1);

            // Save
            profile.save().then(profile =>  res.json(profile));
        })
        .catch(err => res.status(404).json(err));
    })

//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete experience from profile
//@access   private
router.delete('/education/:edu_id', passport.authenticate('jwt' , {session : false}), (req, res) => {

    Profile.findOne({user: req.user.id})
    .then(profile => {
            //Get remove index
            const removeIndex = profile.education
                .map(item => item.id)
                .indexOf(req.params.exp_id);
        
            //Splice out of array
            profile.education.splice(removeIndex, 1);

            // Save
            profile.save().then(profile =>  res.json(profile));
        })
        .catch(err => res.status(404).json(err));
    })


//@route    DELETE api/profile
//@desc     Delete experience from profile
//@access   private
router.delete('/', passport.authenticate('jwt' , {session : false}), (req, res) => {
        Profile.findOneAndRemove({ user: req.user.id })
            .then(() => {
                 User.findOneAndRemove({ _id : req.user.id})
                    .then(() => res.json({ success : true}));       
            })
    })

module.exports = router;