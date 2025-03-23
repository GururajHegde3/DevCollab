
import {  useState, useEffect } from "react"
import { UserContext } from "../context/user.context"
import axios from "../config/axios"
import { useNavigate } from "react-router-dom"
import { FolderPlus, Users, X, Plus, Folder, Search } from "lucide-react"

const Home = () => {

  const [isModalOpen, setModalOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  function createProject(event) {
    event.preventDefault()

    if (!projectName.trim()) return

    setIsLoading(true)

    axios
      .post("https://devcollab-4vyp.onrender.com/projects/create", {
        name: projectName,
      })
      .then((res) => {
        console.log(res)
        setModalOpen(false)
        setProjectName("")
        // Refresh projects list
        fetchProjects()
      })
      .catch((err) => {
        console.log(err)
        setIsLoading(false)
      })
  }

  const fetchProjects = () => {
    setIsLoading(true)
    axios
      .get("https://devcollab-4vyp.onrender.com/projects/all")
      .then((res) => {
        setProjects(res.data.projects)
        setIsLoading(false)
      })
      .catch((err) => {
        console.log(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Projects</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus size={18} />
                <span className="font-medium">New Project</span>
              </button>
            </div>
          </div>

          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </header>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array(4)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-48 animate-pulse"
                >
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="mt-auto pt-6">
                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
              ))
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <div
                key={project._id}
                onClick={() => {
                  navigate("/project", {
                    state: { project },
                  })
                }}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col h-48 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Folder size={20} />
                    </div>
                    <h2 className="font-semibold text-lg text-slate-800 line-clamp-1">{project.name}</h2>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-2">
                  Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                </p>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users size={16} />
                  <span>
                    {project.users.length} {project.users.length === 1 ? "Collaborator" : "Collaborators"}
                  </span>
                </div>

                <div className="mt-auto pt-4">
                  <button className="w-full py-2 px-4 bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-700 rounded-md transition-colors text-sm font-medium">
                    Open Project
                  </button>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <Search size={32} />
              </div>
              <p className="text-lg font-medium">No projects found matching "{searchQuery}"</p>
              <button onClick={() => setSearchQuery("")} className="mt-2 text-blue-500 hover:text-blue-600">
                Clear search
              </button>
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <FolderPlus size={32} />
              </div>
              <p className="text-lg font-medium">No projects yet</p>
              <p className="mb-4">Create your first project to get started</p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[450px] max-w-[90vw] relative">
            <header className="flex justify-between items-center mb-6 pb-2 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <FolderPlus size={20} className="text-blue-500" />
                Create New Project
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setProjectName("")
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={createProject}>
              <div className="mb-6">
                <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setModalOpen(false)
                    setProjectName("")
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!projectName.trim() || isLoading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-md transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    !projectName.trim() || isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home

