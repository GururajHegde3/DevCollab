"use client"

import React, { useState, useEffect, useContext, useRef } from "react"
import { UserContext } from "../context/user.context"
import { useLocation } from "react-router-dom"
import axios from "../config/axios"
import { initializeSocket, receiveMessage, sendMessage } from "../config/socket"
import Markdown from "markdown-to-jsx"
import hljs from "highlight.js"
import { getWebContainer } from "../config/webcontainer"
import { ArrowRight, Code, Play, Plus, Send, User, Users, X } from "lucide-react"

function SyntaxHighlightedCode(props) {
  const ref = useRef(null)

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current)
      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute("data-highlighted")
    }
  }, [props.className, props.children])

  return <code {...props} ref={ref} />
}

const Project = () => {
  const location = useLocation()

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(new Set())
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState("")
  const { user } = useContext(UserContext)
  const messageBox = useRef()

  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [fileTree, setFileTree] = useState({})

  const [currentFile, setCurrentFile] = useState(null)
  const [openFiles, setOpenFiles] = useState([])

  const [webContainer, setWebContainer] = useState(null)
  const [iframeUrl, setIframeUrl] = useState(null)

  const [runProcess, setRunProcess] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId)
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id)
      } else {
        newSelectedUserId.add(id)
      }
      return newSelectedUserId
    })
  }

  function addCollaborators() {
    axios
      .put("/projects/add-user", {
        projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        console.log(res.data)
        setIsModalOpen(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const send = () => {
    if (!message.trim()) return

    sendMessage("project-message", {
      message,
      sender: user,
    })
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }])
    setMessage("")

    // Scroll to bottom after sending message
    setTimeout(() => {
      if (messageBox.current) {
        messageBox.current.scrollTop = messageBox.current.scrollHeight
      }
    }, 100)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function WriteAiMessage(message) {
    const messageObject = JSON.parse(message)

    return (
      <div className="overflow-auto bg-slate-900 text-white rounded-md p-3 shadow-md">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    )
  }

  useEffect(() => {
    initializeSocket(project._id)

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container)
        console.log("container started")
      })
    }

    receiveMessage("project-message", (data) => {
      console.log(data)

      if (data.sender._id === "ai") {
        const message = JSON.parse(data.message)
        console.log(message)

        webContainer?.mount(message.fileTree)

        if (message.fileTree) {
          setFileTree(message.fileTree || {})
        }
        setMessages((prevMessages) => [...prevMessages, data])
      } else {
        setMessages((prevMessages) => [...prevMessages, data])
      }

      // Scroll to bottom after receiving message
      setTimeout(() => {
        if (messageBox.current) {
          messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
      }, 100)
    })

    axios.get(`/projects/get-project/${location.state.project._id}`).then((res) => {
      console.log(res.data.project)
      setProject(res.data.project)
      setFileTree(res.data.project.fileTree || {})
    })

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  async function runProject() {
    setIsRunning(true)
    try {
      await webContainer.mount(fileTree)

      // Check if package.json exists and contains express
      let hasPackageJson = false
      let needsExpress = false

      for (const fileName in fileTree) {
        if (fileName === "package.json") {
          hasPackageJson = true
          try {
            const packageContent = JSON.parse(fileTree[fileName].file.contents)
            if (!packageContent.dependencies || !packageContent.dependencies.express) {
              needsExpress = true
            }
          } catch (e) {
            console.error("Error parsing package.json:", e)
            needsExpress = true
          }
        }
      }

      // Create or update package.json if needed
      if (!hasPackageJson || needsExpress) {
        const packageJson = hasPackageJson
          ? JSON.parse(fileTree["package.json"].file.contents)
          : {
              name: "express-app",
              version: "1.0.0",
              description: "",
              main: "app.js",
              scripts: {
                start: "node app.js",
              },
              dependencies: {},
            }

        // Ensure express is in dependencies
        packageJson.dependencies = {
          ...packageJson.dependencies,
          express: "^4.18.2",
        }

        // Update fileTree with new package.json
        const updatedFileTree = {
          ...fileTree,
          "package.json": {
            file: {
              contents: JSON.stringify(packageJson, null, 2),
            },
          },
        }

        // Update state and save to server
        setFileTree(updatedFileTree)
        saveFileTree(updatedFileTree)

        // Mount the updated fileTree
        await webContainer.mount(updatedFileTree)
      }

      // Show installation progress in a toast or notification
      const installProcess = await webContainer.spawn("npm", ["install"])

      const installOutput = []
      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chunk)
            installOutput.push(chunk)
          },
        }),
      )

      // Wait for installation to complete
      const installExitCode = await installProcess.exit

      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`)
      }

      if (runProcess) {
        runProcess.kill()
      }

      // Start the application
      const tempRunProcess = await webContainer.spawn("npm", ["start"])

      const runOutput = []
      tempRunProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chunk)
            runOutput.push(chunk)

            // Check for common errors in the output
            if (chunk.includes("Cannot find module") || chunk.includes("Error:")) {
              // We don't immediately stop as the server might recover or show more useful errors
              console.error("Detected error in application startup:", chunk)
            }
          },
        }),
      )

      setRunProcess(tempRunProcess)

      // Listen for server ready event
      webContainer.on("server-ready", (port, url) => {
        console.log("Server ready on port:", port, "URL:", url)
        setIframeUrl(url)
        setIsRunning(false)
      })

      // Set a timeout in case server-ready event doesn't fire
      setTimeout(() => {
        if (isRunning) {
          setIsRunning(false)
        }
      }, 10000)
    } catch (error) {
      console.error("Error running project:", error)
      setIsRunning(false)

      // Show error to user
      alert(`Error running project: ${error.message}`)
    }
  }

  // Add a function to check if a file exists in the file tree
  function fileExists(filename) {
    return Object.keys(fileTree).includes(filename)
  }

  // Add a function to create a basic Express app if none exists
  function createBasicExpressApp() {
    const basicApp = `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World! Express server is running.');
});

app.listen(port, () => {
  console.log(\`Server listening at http://localhost:\${port}\`);
});`

    const updatedFileTree = {
      ...fileTree,
      "app.js": {
        file: {
          contents: basicApp,
        },
      },
    }

    setFileTree(updatedFileTree)
    saveFileTree(updatedFileTree)
    return updatedFileTree
  }

  return (
    <main className="h-screen w-screen flex bg-slate-50 overflow-hidden">
      {/* Left Section - Chat */}
      <section className="left relative flex flex-col h-screen w-96 bg-white border-r border-slate-200 shadow-sm">
        <header className="flex justify-between items-center p-4 w-full bg-white border-b border-slate-200 sticky z-10 top-0">
          <button
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span className="font-medium">Add collaborator</span>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
          >
            <Users size={20} />
          </button>
        </header>

        <div className="conversation-area pt-2 pb-16 flex-grow flex flex-col h-full relative">
          <div
            ref={messageBox}
            className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-hide"
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 text-center">No messages yet. Start a conversation!</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${msg.sender._id === "ai" ? "max-w-[85%]" : "max-w-[75%]"} 
                  ${msg.sender._id === user._id.toString() ? "ml-auto" : ""}
                  message flex flex-col p-3 
                  ${
                    msg.sender._id === user._id.toString()
                      ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                      : msg.sender._id === "ai"
                        ? "bg-slate-100 rounded-2xl rounded-tl-sm"
                        : "bg-slate-200 rounded-2xl rounded-tl-sm"
                  }
                  shadow-sm transition-all duration-200 hover:shadow-md`}
              >
                <small
                  className={`${msg.sender._id === user._id.toString() ? "text-blue-100" : "text-slate-500"} text-xs font-medium mb-1`}
                >
                  {msg.sender.email}
                </small>
                <div className={`text-sm ${msg.sender._id === user._id.toString() ? "text-white" : "text-slate-800"}`}>
                  {msg.sender._id === "ai" ? WriteAiMessage(msg.message) : <p className="break-words">{msg.message}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="inputField w-full flex absolute bottom-0 p-3 bg-white border-t border-slate-200">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="p-2.5 px-4 border border-slate-300 rounded-l-full outline-none flex-grow focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              type="text"
              placeholder="Type your message..."
            />
            <button
              onClick={send}
              disabled={!message.trim()}
              className={`px-5 bg-blue-500 text-white rounded-r-full transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!message.trim() ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Side Panel for Collaborators */}
        <div
          className={`sidePanel w-full h-full flex flex-col gap-2 bg-white absolute transition-all duration-300 ease-in-out ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"} top-0 z-20 shadow-lg border-r border-slate-200`}
        >
          <header className="flex justify-between items-center px-4 py-3 bg-slate-100 border-b border-slate-200">
            <h1 className="font-semibold text-lg text-slate-800">Collaborators</h1>
            <button
              onClick={() => setIsSidePanelOpen(false)}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </header>

          <div className="users flex flex-col gap-1 p-2 overflow-auto">
            {project.users && project.users.length > 0 ? (
              project.users.map((user, index) => (
                <div
                  key={index}
                  className="user cursor-pointer hover:bg-slate-100 rounded-lg p-3 flex gap-3 items-center transition-colors"
                >
                  <div className="aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <h1 className="font-medium text-slate-800">{user.email}</h1>
                    <p className="text-xs text-slate-500">Collaborator</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center p-4">No collaborators yet</p>
            )}
          </div>
        </div>
      </section>

      {/* Right Section - Code Editor */}
      <section className="right flex-grow h-full flex">
        {/* File Explorer */}
        <div className="explorer h-full w-64 bg-slate-100 border-r border-slate-200 overflow-y-auto">
          <div className="p-3 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Code size={18} />
              <span>Files</span>
            </h2>
          </div>

          <div className="file-tree w-full">
            {Object.keys(fileTree).length > 0 ? (
              Object.keys(fileTree).map((file, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentFile(file)
                    setOpenFiles([...new Set([...openFiles, file])])
                  }}
                  className={`tree-element cursor-pointer p-2.5 px-4 flex items-center gap-2 hover:bg-slate-200 w-full text-left transition-colors ${currentFile === file ? "bg-slate-200 border-l-4 border-blue-500" : ""}`}
                >
                  <p className={`font-medium ${currentFile === file ? "text-blue-600" : "text-slate-700"}`}>{file}</p>
                </button>
              ))
            ) : (
              <p className="text-slate-500 text-center p-4">No files available</p>
            )}
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="code-editor flex flex-col flex-grow h-full">
          {/* Tabs and Actions */}
          <div className="top flex justify-between w-full bg-slate-50 border-b border-slate-200">
            <div className="files flex overflow-x-auto scrollbar-hide">
              {openFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFile(file)}
                  className={`open-file cursor-pointer p-2.5 px-4 flex items-center gap-2 border-r border-slate-200 min-w-fit transition-colors
                    ${
                      currentFile === file
                        ? "bg-white text-blue-600 border-t-2 border-t-blue-500"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                >
                  <p className="font-medium truncate max-w-40">{file}</p>
                  {currentFile === file && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenFiles(openFiles.filter((f) => f !== file))
                        if (currentFile === file) {
                          setCurrentFile(
                            openFiles.length > 1 ? (openFiles[0] === file ? openFiles[1] : openFiles[0]) : null,
                          )
                        }
                      }}
                      className="ml-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </button>
              ))}
            </div>

            <div className="actions flex gap-2 p-2">
              <button
                onClick={runProject}
                disabled={isRunning || Object.keys(fileTree).length === 0}
                className={`p-2 px-4 bg-green-500 text-white rounded-md flex items-center gap-2 transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  ${isRunning || Object.keys(fileTree).length === 0 ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isRunning ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Run</span>
                  </>
                )}
              </button>

              {!fileExists("app.js") && (
                <button
                  onClick={() => createBasicExpressApp()}
                  className="p-2 px-4 bg-blue-500 text-white rounded-md flex items-center gap-2 transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Code size={16} />
                  <span>Create Express App</span>
                </button>
              )}
            </div>
          </div>

          {/* Code Editor Content */}
          <div className="bottom flex flex-grow max-w-full overflow-hidden">
            {currentFile && fileTree[currentFile] ? (
              <div className="code-editor-area h-full overflow-auto flex-grow bg-white">
                <pre className="hljs h-full p-4">
                  <code
                    className="hljs h-full outline-none font-mono text-sm"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedContent = e.target.innerText
                      const ft = {
                        ...fileTree,
                        [currentFile]: {
                          file: {
                            contents: updatedContent,
                          },
                        },
                      }
                      setFileTree(ft)
                      saveFileTree(ft)
                    }}
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight("javascript", fileTree[currentFile].file.contents).value,
                    }}
                    style={{
                      whiteSpace: "pre-wrap",
                      paddingBottom: "25rem",
                      counterSet: "line-numbering",
                    }}
                  />
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-white">
                <div className="text-center text-slate-400">
                  <Code size={48} className="mx-auto mb-4 opacity-30" />
                  <p>{openFiles.length === 0 ? "Select a file to start editing" : "No file content available"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {iframeUrl && webContainer && (
          <div className="flex w-96 flex-col h-full border-l border-slate-200 bg-white">
            <div className="address-bar border-b border-slate-200 p-2">
              <div className="flex items-center bg-slate-100 rounded-md overflow-hidden">
                <span className="p-2 bg-slate-200 text-slate-500">
                  <ArrowRight size={16} />
                </span>
                <input
                  type="text"
                  onChange={(e) => setIframeUrl(e.target.value)}
                  value={iframeUrl}
                  className="w-full p-2 bg-slate-100 outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex-grow relative">
              <iframe src={iframeUrl} className="w-full h-full absolute inset-0 border-0" />
            </div>
          </div>
        )}
      </section>

      {/* Modal for Adding Collaborators */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-[450px] max-w-[90vw] relative shadow-xl">
            <header className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Add Collaborators</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </header>

            <div className="users-list flex flex-col gap-1 mb-16 max-h-[60vh] overflow-auto pr-1">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <div
                    key={index}
                    className={`user cursor-pointer rounded-lg transition-all duration-200
                      ${
                        Array.from(selectedUserId).includes(user._id)
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-slate-50 border border-transparent"
                      } 
                      p-3 flex gap-3 items-center`}
                    onClick={() => handleUserClick(user._id)}
                  >
                    <div
                      className={`aspect-square relative rounded-full w-10 h-10 flex items-center justify-center text-white
                      ${Array.from(selectedUserId).includes(user._id) ? "bg-blue-500" : "bg-slate-600"}`}
                    >
                      <User size={20} />
                    </div>
                    <div className="flex-grow">
                      <h1 className="font-medium text-slate-800">{user.email}</h1>
                      <p className="text-xs text-slate-500">User</p>
                    </div>
                    {Array.from(selectedUserId).includes(user._id) && (
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center p-4">No users available</p>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 mr-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCollaborators}
                disabled={selectedUserId.size === 0}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${selectedUserId.size === 0 ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                Add Selected ({selectedUserId.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Project

