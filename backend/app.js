
import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './db/routes/user.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import projectRoutes from './db/routes/project.routes.js'

connect();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use('/users',userRoutes);
app.use('/projects',projectRoutes)


app.get('/',(req,res)=>{
    res.send("helloo");
});

export default app;


