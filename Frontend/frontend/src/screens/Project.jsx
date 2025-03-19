import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user.context';
import { useLocation } from 'react-router-dom';
import axios from '../config/axios';
import Markdown from 'markdown-to-jsx';
import { initializeSocket, recieveMessage, sendMessage } from '../config/socket.js';

const Project = () => {
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(new Set());
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const { user } = useContext(UserContext);
    const [fileTree, setFileTree] = useState({
        "app.js": {
            "content": `const express=require('express');`
        },
        "package.json": {
            content: `{
            "name":"temp-server",

            }`
        }

    })
    const [currentFile,setCurrentFile]=useState(null)
    const [openFiles,setOpenFiles]=useState([])
    const [messages, setMessages] = useState([])
    const messageBox = React.createRef()

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    };


    const send = () => {

        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [...prevMessages, { sender: user, message }]) // Update messages state
        setMessage("")

    }

    useEffect(() => {
        initializeSocket(project._id);
        recieveMessage('project-message', data => {
            setMessages(prevMessages => [...prevMessages, data])
        });
        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            setProject(res.data.project);
        });
        axios.get('/users/all').then(res => {
            setUsers(res.data.users);
        }).catch(err => {
            console.log(err);
        });
    }, []);

    function SyntaxHighlightedCode(props) {
        const ref = useRef(null)

        React.useEffect(() => {
            if (ref.current && props.className?.includes('lang-') && window.hljs) {
                window.hljs.highlightElement(ref.current)

                // hljs won't reprocess the element unless this attribute is removed
                ref.current.removeAttribute('data-highlighted')
            }
        }, [props.className, props.children])

        return <code {...props} ref={ref} />
    }



    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    function addCollaborators() {
        axios.put('/projects/add-user', {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false);
        }).catch(err => {
            console.log(err);
        });
    }



    return (
        <main className='h-screen w-screen flex'>
            <section className='left relative flex flex-col h-full min-w-96 bg-slate-200'>
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-300'>
                    <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
                        <i className='ri-add-fill mr-1'></i>
                        <p>Add Collaborators</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className='ri-group-fill'></i>
                    </button>
                </header>

                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div ref={messageBox} className='message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide'>
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${msg.sender._id == user._id.toString() && 'ml-auto'}  message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                                <small className='opacity-65 text-xs'>{msg.sender.email}</small>
                                <div className='text-sm'>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='className="inputField w-full flex absolute bottom-0 bg-slate-50'>
                        <input value={message} onChange={(e) => setMessage(e.target.value)} className='p-2 px-4 border-none outline-none flex-grow' type="text" placeholder='Enter message' />
                        <button className='px-5 bg-slate-950 text-white' onClick={send}><i className='ri-send-plane-fill'></i></button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full bg-slate-100 absolute flex flex-col gap-2 transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center px-3 p-2 bg-slate-200'>
                        <h1 className='font-semibold'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'><i className='ri-close-fill'></i></button>
                    </header>
                    <div className="users flex flex-col gap-2">
                        {project.users && project.users.map(user => (
                            <div key={user._id} className="user flex cursor-pointer hover:bg-slate-200 p-2 gap-2 items-center">
                                <div className='aspect-square rounded-full w-fit flex items-center justify-center h-fit p-5 text-white bg-slate-600 '>
                                    <i className='ri-user-fill absolute'></i>
                                </div>
                                <h1 className='font-light '>{user.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="right bg-red-50 flex flex-grow h-full">
                <div className="explorer h-full max-w-64 min-w-52  bg-slate-400">
                    <div className='file-tree w-full'>
                        {
                            Object.keys(fileTree).map((file,index)=>(
                                
                    <button onClick={()=>{setCurrentFile(file)
                    setOpenFiles(prevOpenFiles => prevOpenFiles.includes(file) ? prevOpenFiles : [...prevOpenFiles, file])
                    } }className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-200 w-full ">
                    <p className=' font-semibold text-lg'>{file}</p>
                    </button>
                  
                            ))
                        }


                    </div>
                </div>
               {currentFile && ( <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex ">
                       {
                        openFiles.map((file,index) => (
                            <button onClick={()=>setCurrentFile(file)} className={`p-2 px-4 ${currentFile===file?'bg-slate-200':''} cursor-pointer`}>{file}</button>
                        ))
                    }
               
                    </div>
                    <div className="bottom flex flex-grow">
                        {
                            fileTree[currentFile] && (
                                <textarea value={fileTree[currentFile].content} onChange={(e)=>setFileTree({...fileTree,[currentFile]:{content:e.target.value}})} className='w-full h-full bg-slate-50 p-2 outline-none border-none resize-none'></textarea>
                            )
                        }

                    </div>
                    

</div>)}

            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg w-96">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user._id} className={`user cursor-pointer hover:bg-slate-400 ${selectedUserId.has(user._id) ? 'bg-slate-400' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-medium '>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button onClick={addCollaborators} className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Project;