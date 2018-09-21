const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Post = require('../../models/Post')
const Profile = require('../../models/Profile')

// Validation
const validatePostInput = require('../../validation/post');

//@route    GET api/posts/
//@desc     Get post
//@access   Public route
router.get('/', (req, res) => {
    Post.find()
        .sort({date: -1})
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({noPostFound: 'no post found with id'}))
});


//@route    GET api/posts/:id
//@desc     Get post by id
//@access   Public route
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({noPostFound: 'no post found with id'}));
});


//@route    POST api/posts
//@desc     Create post
//@access   Private route
router.post('/', passport.authenticate('jwt', {session : false}), (req,res) =>{
    const { errors, isValid} = validatePostInput(req.body);

    if(!isValid){
        return res.status(400).json(errors)
    }
    
    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar : req.body.avatar,
        user: req.user.id
    });

    newPost.save().then(post => res.json(post));
})

//@route    PDELETE  api/posts/:id
//@desc     Delete post
//@access   Private route
router.delete('/:id', passport.authenticate('jwt', {session : false}), (req,res) =>{
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById( req.params.id)
                .then(post => {
                    
                    //check for post ownership
                    if(post.user.toString() !== req.user.id){
                        return res.status(401).json({ notAuthorized: 'User not autorized'});
                    }

                    post.remove().then(() => res.json({success: true}))
                })
                .catch(err => res.status(404).json({ postnotfound: 'no post found'}))
        })
})

//@route    Post  api/posts/like/:id
//@desc     Like post
//@access   Private route
router.post('/like/:id', passport.authenticate('jwt', {session : false}), (req,res) =>{
    Post.findById( req.params.id)
                .then(post => {
                   post.likes.filter(like =>{
                       like.user.toString() === req.user.id
                       return res.status(400).json({alreadyLiked : 'user already liked this post'})
                   }) 
                   
                   post.likes.unshift({ user: req.user.id});

                   post.save().then(post => res.json(post));
            })
            
                .catch(err => res.status(404).json({ postnotfound: 'no post found'}))
})

//@route    Post  api/posts/unlike/:id
//@desc     Unlike post
//@access   Private route
router.post('/unlike/:id', passport.authenticate('jwt', {session : false}), (req,res) =>{
    Post.findById( req.params.id)
                .then(post => {
                   if(post.likes.filter(like => like.user.toString === req.user.id) === 0){
                       return res.status(400).json({notliked : 'user does not like the post'})
                   }

                const   index = post.likes
                                .map(item => item.user.toString())
                                .indexOf(req.user.id);

                        post.likes.splice(index, 1);

                        post.save().then(post => res.json(post));
            })
            
                .catch(err => res.status(404).json({ postnotfound: 'no post found'}))
})

//@route    Post  api/posts/comment/:id
//@desc     add comment to post
//@access   Private 
router.post('/comment/:id', passport.authenticate('jwt', {session : false}), (req,res) =>{
     const { errors, isValid} = validatePostInput(req.body);

    if(!isValid){
        return res.status(400).json(errors)
    }
        
    Post.findById( req.params.id)
            .then(post => {
                const newComment = {
                    text: req.body.text,
                    name: req.body.name,
                    avatar: req.body.avatar,
                    user: req.user.id
                }

                post.comments.unshift(newComment);

                post.save().then(post => res.json(post));
         })
         .catch(err => res.status(404).json({ postnotfound: 'no post found'}))
})

//@route    Delete  api/posts/comment/:id/:comment_id
//@desc     remove comment
//@access   Private 
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', {session : false}), (req,res) =>{
    Post.findById( req.params.id)
        .then(post => {
            if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0){
                    return res.status(404).json({commentnotexists: 'comment does not exist'});
                }
            const removeIndex = post.comments
                .map(item => item._.id.toString())
                .indexOf(req.params.comment_id);

            post.comments.splice(removeIndex, 1);

            post.save().then(post => res.json(post));
        })
       .catch(err => res.status(404).json({ postnotfound: 'no post found'}))
})
module.exports = router;