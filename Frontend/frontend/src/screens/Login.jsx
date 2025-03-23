import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "../config/axios"
import { UserContext } from "../context/user.context"
import { Mail, Lock } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  function submitHandler(e) {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)
    setError("")

    axios
      .post("https://devcollab-4vyp.onrender.com/users/login", { email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token)
        setUser(res.data.user)
        navigate("/")
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Login failed")
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-slate-700">
        {/* DevCollab Header */}
        <h1 className="text-3xl font-bold text-white text-center mb-4">Welcome to DevCollab</h1>

        <h2 className="text-2xl font-bold text-white text-center mb-6">Login</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">{error}</div>
        )}

        <form className="space-y-5" onSubmit={submitHandler}>
          <div>
            <label className="block text-slate-300 mb-2 text-sm" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                id="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                id="password"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="flex justify-between items-center mt-6 text-sm">
         
          <p className="text-slate-400">
            No account?
            <Link to="/register" className="text-blue-400 hover:text-blue-300 ml-1">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
