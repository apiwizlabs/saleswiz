const express = require("express");
const http = require("http");
require("dotenv").config();
const cors = require("cors");
const authRoutes = require("./Routes/Auth.routes.js");
const userRoutes = require("./Routes/User.routes.js");
const customerRoutes = require("./Routes/Customer.routes.js");
const approvalRoutes = require("./Routes/Approvals.routes.js");
const teamRoutes = require("./Routes/Team.routes.js");
const templateRoutes = require("./Routes/Template.routes.js");
const dealRoutes = require("./Routes/Deal.routes.js");
const contactRoutes = require("./Routes/Contact.routes.js");
const activityRoutes = require("./Routes/Activity.routes.js");
const notificationRoutes = require("./Routes/Notification.routes.js");
const currencyRoutes = require("./Routes/Currency.routes.js");
const timelineRoutes = require("./Routes/Timeline.routes.js");
const fileRoutes = require("./Routes/Files.Routes.js");
const notesRoutes = require("./Routes/Notes.routes.js");
const pipelineRoutes = require("./Routes/Pipeline.routes.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("./config.js");
const mongoose = require("mongoose");
const app = express();
const dbConnect = require("./db/db.connect");
const actuator = require("express-actuator");
const logger = require("./helpers/logger.js");
const events = require("events");
const emitter = new events.EventEmitter();

const options = {
  basePath: "/management", // It will set /management/info instead of /info
  infoGitMode: null, // the amount of git information you want to expose, 'simple' or 'full',
  infoBuildOptions: null, // extra information you want to expose in the build object. Requires an object.
  infoDateFormat: null, // by default, git.commit.time will show as is defined in git.properties. If infoDateFormat is defined, moment will format git.commit.time. See https://momentjs.com/docs/#/displaying/format/.
  customEndpoints: [],
};
global.logger = logger;

require("./init")({emitter, logger});

dbConnect()
  .then(() => {
    emitter.emit("db:success");
  })
  .catch((err) => {
    logger.info(`db connect err:`, err);
  });

try {
  app.use(cors());
  app.use(actuator(options));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/customers", customerRoutes);
app.use("/currency", currencyRoutes);
app.use("/templates", templateRoutes);
app.use("/deals", dealRoutes);
app.use("/contacts", contactRoutes);
app.use("/activities", activityRoutes);
app.use("/notifications", notificationRoutes);
app.use("/timeline", timelineRoutes);
app.use("/files", fileRoutes);
app.use("/approvals", approvalRoutes);
app.use("/notes", notesRoutes);
app.use("/pipeline", pipelineRoutes);

  const PORT = config.PORT || 3002;
  app.set("port", PORT);

  const server = http.createServer(app);
  server.listen(PORT);

  server.on("listening", () => {
    emitter.emit("app:start");
  });
} catch (err) {
  console.log("app start err:", err);
}
