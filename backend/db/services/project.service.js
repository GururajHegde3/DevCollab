import projectModel from '../models/project.model.js'
import mongoose from 'mongoose';


export const createProject = async({
    name,userId
})=>{
    if(!name){
        throw new Error('Name is required')
    }
    if(!userId){
        throw new Error('user is required')

    }
    let project;
    try{
       project=await projectModel.create({
        name,
        users:[userId]
    });
}catch(error){
    if(error.code===11000){
        throw new Error('Project name already exists')
    }
    throw error;
}
    return project;

}

export const getAllProjectByUserId = async(userId)=>{
    if(!userId) {
        throw new Error('Userid is required')
    }
    const allUserProjects=projectModel.find({users:userId});
    return allUserProjects 
}
export const addUsersToProject = async ({ projectId, users, userId }) => {
    if (!projectId) throw new Error('ProjectId is required');
    if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error('Invalid ProjectId');
    if (!Array.isArray(users) || users.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('Users must be an array of valid ObjectIds');
    }
    if (!userId) {
        throw new Error('UserId is required');
    }


    const project = await projectModel.findOne({ _id: projectId });

    if (!project) {
        throw new Error('Project not found');
    }

    if (!project.users.includes(userId)) {
        throw new Error('User does not belong to this project');
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { $addToSet: { users: { $each: users } } },
        { new: true }
    );

    return updatedProject;
};

export const getProjectById = async({projectId})=>{
    if(!projectId){
        throw new Error('ProjectId is required')
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid ProjectId')
    }
    const project=await projectModel.findOne({
        _id:projectId
    }).populate('users','email');
    if(!project){
        throw new Error('Project not found')
    }
    return project;
}