const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();

const controller = require('../controllers/documentController');

router.post('/upload', upload.single('file'), (req, res, next) => {
  console.log("📨 POST /upload triggered");
  next();
}, controller.uploadDocument);

router.post('/verify', upload.single('file'), (req, res, next) => {
  console.log("📨 POST /verify triggered");
  next();
}, controller.verify);

router.get("/", controller.getAllDocuments);



module.exports = router;
