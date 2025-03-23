import mongoose from 'mongoose';

const projectSchema=new mongoose.Schema({
    name:{
        type:String,
        lowercase:true,
        required:true,
        unique:[true,'project name must be unique'],
        trim:true,
    },
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    fileTree:{
        type:Object,
        default:{}
    },
})

const Project=mongoose.model('project',projectSchema);

export default Project;