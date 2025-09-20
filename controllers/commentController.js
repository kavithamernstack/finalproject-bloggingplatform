import Comment from '../models/Comment.js'
import Post from '../models/Post.js'

//creating the comments

const simpleSpam = (text) => /http:\/\/|https:\/\//i.test(text) && text.length < 20

//listing the comments
export const listByPost = async (req, res) => {
    const comments = await Comment.find({ post: req.params.postId }).populate('author', 'name').sort({ createdAt: -1 })
    res.json(comments)
}

export const listMyComments = async (req, res) => {
    try {
        const comments = await Comment.find({ author: req.user._id })
            .populate("post", "title") // show blog title
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// adding the comments
export const addComment = async (req, res) => {
    const { postId, content } = req.body
    const isSpam = simpleSpam(content)
    const c = await Comment.create({ post: postId, author: req.user._id, content, isSpam })
    await Post.findByIdAndUpdate(postId, { $inc: { 'metrics.comments': 1 } })
    res.json(c)
}

// update the comments
export const updateComment = async (req, res) => {
    const c = await Comment.findById(req.params.id)
    if (!c)
        return res.status(404).json({ message: 'Not Found' })
    if (String(c.author) !== String(req.user._id))
        return res.status(403).json({ message: 'Forbidden' })
    c.content = req.body.content
    await c.save()
    res.json(c)
}

// Deleting the comments
export const deleteComment = async (req, res) => {
    const c = await Comment.findById(req.params.id)
    if (!c)
        return res.status(404).json({ message: 'Not Found' })
    if (String(c.author) !== String(req.user._id))
        return res.status(403).json({ message: 'Forbidden' })
    await c.deleteOne()
    await Post.findByIdAndUpdate(c.post, { $inc: { 'metrics.comments': -1 } })
    res.json({ message: 'Deleted' })
}
