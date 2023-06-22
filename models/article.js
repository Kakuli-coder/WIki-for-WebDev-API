const mongoose = require("mongoose");

const articleSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title cannot be blank!"]
    },
    content: {
        type: String,
        required: [true, "Content cannot be blank!"]
    }
});

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
