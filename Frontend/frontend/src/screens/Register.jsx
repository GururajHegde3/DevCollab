import React,{useState,useContext} from 'react';
import { Link,useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Register = () => {
    const [email,setEmail]=useState('')
    const [password,setPassword]=useState('')
    const {setUser} = useContext(UserContext)
    const navigate=useNavigate()

    function submitHandler(e){
        e.preventDefault();
        axios.post('https://devcollab-4vyp.onrender.com/users/register',{email,password}).
        then((res)=>{
            console.log(res.data)
            localStorage.setItem('token',res.data.token)
            setUser(res.data.user)
        navigate('/')}).catch((err)=>{
                console.log(err.response.data)
            })
    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-extrabold text-white text-center mb-6">Sign Up</h2>
        
        
        <form className="space-y-5" onSubmit={submitHandler}>
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="email">Email</label>
            <input 
            onChange={(e)=>setEmail(e.target.value)}
              type="email" 
              id="email" 
              className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email" 
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2" htmlFor="password">Password</label>
            <input 
            onChange={(e)=>setPassword(e.target.value)}
              type="password" 
              id="password" 
              className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Enter your password" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full p-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign In
          </button>
        </form>

        <div className="flex justify-between items-center mt-4">
          <Link to="#" className="text-sm text-blue-400 hover:underline">Forgot Password?</Link>
          <p className="text-gray-400 text-sm">
            Already have an account? 
            <Link to="/login" className="text-blue-400 hover:underline ml-1">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
