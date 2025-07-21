const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const http = require("http");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;

// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(cookieParser());

// Controllers
const authController = require("./src/routes/authRoutes");
const indexController = require("./src/routes/indexRoutes");
const AdminUserController = require("./src/routes/AdminUserRoutes");
const AdminTeamController = require("./src/routes/AdminTeamRoutes");
const packageRouter = require("./src/routes/packageRoutes");
const ComplaintRouter = require("./src/routes/ComplaintRoutes");
const AllComplaint = require("./src/routes/AdminUserComplaintRoutes");
const profileRouter = require("./src/routes/profileRoutes");
const historyRouter = require("./src/routes/historyRoutes");
const contactusRouter = require("./src/routes/contactusRoutes");
const requestRouter = require("./src/routes/requestRoutes");
const SliderRouter = require("./src/routes/SliderRoutes");
const adminindexRoutes = require("./src/routes/adminindexRoutes");
const prayerRoutes = require("./src/routes/prayerRoutes");
const tasbeehRoutes = require("./src/routes/tasbeehRoutes");
const quranRoutes = require("./src/routes/quranRoutes");
const PasswordRequestController = require("./src/routes/PasswordRequestRoutes");
const changepasswordRoutes = require("./src/routes/changepasswordRoutes");
const reviewController = require("./src/routes/reviewRoutes");
const addtaskController = require("./src/routes/addtaskRoutes");
const completedtaskRouter = require("./src/routes/completedtaskRouter");
const userEquipmentRoutes = require("./src/routes/userEquipmentRoutes");
const paymentshistoryRoutes = require("./src/routes/paymentshistoryRoutes");
const pandingpaymentsRoutes = require("./src/routes/pandingpaymentsRoutes");
const weatherRoutes = require("./src/routes/weatherRoutes");

const AddUser = require("./src/routes/AddUser_Routes/AddUser.routes");
const ActiveUser = require("./src/routes/AddUser_Routes/ActiveUser.routes");
const ExpiredUser = require("./src/routes/AddUser_Routes/ExpiredUser.routes");
const ADDsTAFF = require("./src/routes/AddTeam_Routes/AddTeam.routes");
const AddPackage = require("./src/routes/AddPackage_Routes/AddPackage.routes");
const Promotions = require("./src/routes/Promotions_Routes/Promotions.routes");

const Customization = require("./src/routes/Customization_Router/UserDashboard.route"); 
const HerderFooter = require("./src/routes/Customization_Router/HerderorFooter.route");
const BrandingPage = require("./src/routes/Customization_Router/BrandingPage.route");

const ViewAllEquipmentsRoutes = require("./src/routes/ViewAllEquipmentsRoutes");
const AddNewEquipmentRoutes = require("./src/routes/AddNewEquipmentRoutes");
const EquipmentStatusRoutes = require("./src/routes/EquipmentStatusRoutes");
const RecoveryManagementRoutes = require("./src/routes/RecoveryManagementRoutes");

// Session and Flash Messages
app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(flash());
//
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Set up view engine
const server = http.createServer(app);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));
app.use("/", authController);
app.use("/", AdminUserController);
app.use("/", AdminTeamController);
app.use("/", indexController);
app.use("/", packageRouter);
app.use("/", ComplaintRouter);
app.use("/", AllComplaint);
app.use("/", profileRouter);
app.use("/", historyRouter);
app.use("/", contactusRouter);
app.use("/", requestRouter);
app.use("/", SliderRouter);
app.use("/", adminindexRoutes);
app.use("/", prayerRoutes);
app.use("/", tasbeehRoutes);
app.use("/", quranRoutes);
app.use("/", PasswordRequestController);
app.use("/", changepasswordRoutes);
app.use("/", reviewController);
app.use("/", addtaskController);
app.use("/", completedtaskRouter);
app.use("/", userEquipmentRoutes);
app.use("/", paymentshistoryRoutes);
app.use("/", pandingpaymentsRoutes);
app.use("/", weatherRoutes);

app.use("/", AddUser);
app.use("/", ActiveUser);
app.use("/", ExpiredUser);
app.use("/", ADDsTAFF);
app.use("/", AddPackage);
app.use("/", Promotions);

app.use("/", Customization);
app.use("/", HerderFooter);
app.use("/", BrandingPage);

app.use("/", ViewAllEquipmentsRoutes);
app.use("/", AddNewEquipmentRoutes);
app.use("/", EquipmentStatusRoutes);
app.use("/", RecoveryManagementRoutes);

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
