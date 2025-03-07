import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema=new mongoose.Schema({
   
    email:{type:String, required:true, unique:true,lowercase:true},
    password:{type:String, required:true,select:false}
})
userSchema.statics.hashPassword=async function(password){
    return await bcrypt.hash(password,10);
}

userSchema.methods.isValidPassword=async function(password){
    console.log(password,this.password)
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateToken = function () {
    if (!process.env.JWT_SECRET) {
        throw new Error("Missing SECRET_KEY in environment variables");
    }

    const token = jwt.sign(
        { email: this.email },  // Include user ID for better validation
        process.env.JWT_SECRET,
        {expiresIn:'24h'} 
  
    );

    console.log("Generated Token:", token);  // Print token to console
    return token;
};


const User=mongoose.model('user',userSchema);
export default User;