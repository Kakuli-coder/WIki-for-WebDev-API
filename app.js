require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const Article = require("./models/article");
const AppError = require("./AppError");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected successfully to Mongo!");
    }).catch((err) => {
        console.log("Mongo Connection error!");
        console.log(err);
    });

function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e));
    };
};

app.route("/articles")
    .get(wrapAsync(async (req, res) => {
        const foundArticles = await Article.find({});
        res.send({
            status: 200,
            message: "Articles found!",
            Articles: foundArticles
        });
    }))
    .post(wrapAsync(async (req, res) => {
        const newArticle = await new Article({
            title: req.body.title,
            content: req.body.content
        });
        await newArticle.save();
        res.send({
            status: 200,
            message: "Successfully added a new article",
            Article: newArticle
        });
    }))
    .delete(wrapAsync(async (req, res) => {
        await Article.deleteMany();
        res.send({
            status: 200,
            message: "Successfully deleted all articles"
        });
    }));

app.route("/articles/:articleTitle")
    .get(wrapAsync(async (req, res) => {
        const { articleTitle } = req.params;
        const foundArticle = await Article.findOne({ title: articleTitle });
        if (!foundArticle) {
            throw new AppError(
                {
                    status: 404,
                    message: "No Article matching that title was found"
                }
                );
        };
        res.send({
            status: 200,
            message: "Article found!",
            Article: foundArticle
        });
    }))
    .put(wrapAsync(async (req, res) => {
        const foundArticle = await Article.findOne({ title: req.params.articleTitle });
        if (!foundArticle) {
            throw new AppError(
                {
                    status: 404,
                    message: "No Article matching that title was found"
                }
);
        };
        await Article.replaceOne(
            { title: req.params.articleTitle },
            { title: req.body.title, content: req.body.content });
        res.send({
            status: 200,
            message: "Successfully updated article",
            PreviousArticle: foundArticle,
            UpdatedArticle: req.body
        });
    }))
    .patch(wrapAsync(async (req, res, next) => {
        const foundArticle = await Article.findOne({ title: req.params.articleTitle });
        if (!foundArticle) {
            throw new AppError(
                {
                    status: 404,
                    message: "No Article matching that title was found"
                }
            );
        };
        await Article.updateOne(
            { title: req.params.articleTitle },
            { $set: req.body });
        res.send({
            status: 200,
            message: "Successfully updated article",
            PreviousArticle: foundArticle,
            UpdatedContents: req.body
        });
        next(err);
    }))
    .delete(wrapAsync(async (req, res) => {
        const foundArticle = await Article.findOne({ title: req.params.articleTitle });
        if (!foundArticle) {
            throw new AppError(
                {
                    status: 404,
                    message: "No Article matching that title was found"
                }
                );
        };
        await Article.deleteOne({ title: req.params.articleTitle });
        res.send({
            status: 200,
            message: "Successfully deleted the following article",
            DeletedArticle: foundArticle
        });
    }));

const handleValidationErr = err => {
    // console.dir(err);
    // return err;
    return new AppError({
        status: 400,
        message: err.message
    });
};

app.use((err, req, res, next) => {
    console.log(err.name);
    if (err.name === "ValidationError") {
        err = handleValidationErr(err);
    };
    next(err);
});

app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong!" } = err;
    res.status(status).send(message);
});

app.listen(process.env.PORT, function () {
    console.log(`Server started on port ${process.env.PORT}`);
});
