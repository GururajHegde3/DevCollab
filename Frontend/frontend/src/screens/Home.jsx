import { useState, useEffect } from "react"
import { UserContext } from "../context/user.context"
import axios from "../config/axios"
import { useNavigate } from "react-router-dom"
import { FolderPlus, Users, X, Plus, Folder, Search, Clock, ChevronRight } from "lucide-react"

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
      .post("/projects/create", {
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
      .get("/projects/all")
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">My Projects</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage and collaborate on your projects</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg w-full md:w-72 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                  shadow-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg 
                transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                font-medium"
              >
                <Plus size={18} />
                <span>New Project</span>
              </button>
            </div>
          </div>

          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-sm"></div>
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
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-64 animate-pulse"
                >
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-1/4 mb-6"></div>
                  <div className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-lg mb-4"></div>
                  <div className="mt-auto pt-4">
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
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
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 
                shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col h-64 cursor-pointer group
                hover:border-blue-300 dark:hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 
                    group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <Folder size={22} />
                    </div>
                    <h2 className="font-bold text-xl text-slate-800 dark:text-white line-clamp-1">{project.name}</h2>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4 mt-2 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-slate-400" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Users size={16} />
                    <span>
                      {project.users.length} {project.users.length === 1 ? "Collaborator" : "Collaborators"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-blue-500 
                  hover:text-white text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm 
                  font-medium flex items-center justify-center gap-2 group-hover:shadow-md">
                    Open Project
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
              <div className="p-5 rounded-full bg-slate-100 dark:bg-slate-700 mb-6 shadow-inner">
                <Search size={36} />
              </div>
              <p className="text-xl font-medium mb-2">No projects found matching "{searchQuery}"</p>
              <p className="mb-6 text-slate-400 dark:text-slate-500">Try searching with different keywords</p>
              <button 
                onClick={() => setSearchQuery("")} 
                className="px-6 py-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
              <div className="p-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 mb-6 shadow-inner">
                <FolderPlus size={48} className="text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-medium mb-2">No projects yet</p>
              <p className="mb-8 text-slate-400 dark:text-slate-500 text-center max-w-md">Create your first project to start organizing your work and collaborating with others</p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium flex items-center gap-2"
              >
                <Plus size={18} />
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-[500px] max-w-[90vw] relative border border-slate-200 dark:border-slate-700 animate-scaleIn">
            <header className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                  <FolderPlus size={20} />
                </div>
                Create New Project
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setProjectName("")
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={createProject} className="space-y-6">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                  bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                  placeholder="Enter a meaningful project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 
                  rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
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
                  className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg transition-colors 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                  font-medium shadow-md ${!projectName.trim() || isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg"}`}
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