const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const mongoose = require('mongoose');
    const Notification = require('./models/Notification');
    const notifs = await Notification.find({}).sort({createdAt: -1}).limit(5).lean();
    console.log("NOTIFICATIONS IN DB: ", JSON.stringify(notifs, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
