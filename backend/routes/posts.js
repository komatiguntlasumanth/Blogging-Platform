const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('Token verified for user:', decoded.id);
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// GET all posts (public)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'name').sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'name');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        console.log('Creating post:', { title, author: req.user.id });
        const newPost = new Post({ title, content, author: req.user.id });
        await newPost.save();
        console.log('Post saved successfully');
        res.status(201).json(newPost);
    } catch (err) {
        console.error('Error saving post:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// UPDATE post (protected)
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'User not authorized' });

        post.title = title || post.title;
        post.content = content || post.content;
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE post (protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'User not authorized' });

        await Post.deleteOne({ _id: req.params.id });
        res.json({ message: 'Post removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
